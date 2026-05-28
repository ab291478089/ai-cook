"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ThreadList } from "@/components/ThreadList";
import { useThreads } from "@/lib/hooks/useThreads";
import { uploadImageToOss, streamChat, getChatHistory } from "@/lib/api";
import { UtensilsCrossed, Menu, X } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [processing, setProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  const {
    threads,
    currentThreadId,
    isLoading: threadsLoading,
    createNewThread,
    deleteThreadById,
    switchToThread,
  } = useThreads();

  // 加载当前会话的历史消息
  const loadHistory = async (threadId: string) => {
    try {
      const history = await getChatHistory(threadId);
      if (history && history.length > 0) {
        const loadedMessages: Message[] = history.map((msg, index) => {
          let content = "";
          let imageUrl: string | undefined;

          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            const parts = msg.content as { type: string; text?: string; url?: string }[];
            for (const part of parts) {
              if (part.type === "text" && part.text) {
                content += part.text;
              } else if (part.type === "image" && part.url) {
                imageUrl = part.url;
              }
            }
          }

          return {
            id: `history_${index}_${Date.now()}`,
            role: msg.role as "user" | "assistant",
            content,
            imageUrl,
            timestamp: Date.now() - (history.length - index) * 1000,
          };
        });
        setMessages(loadedMessages);
        messageIdCounter.current = loadedMessages.length;
      } else {
        setMessages([]);
        messageIdCounter.current = 0;
      }
    } catch (error) {
      console.error("加载历史消息失败:", error);
      setMessages([]);
    }
  };

  // 当切换会话时加载历史
  useEffect(() => {
    if (currentThreadId) {
      loadHistory(currentThreadId);
    }
  }, [currentThreadId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 添加消息
  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    messageIdCounter.current += 1;
    const newMessage: Message = {
      ...message,
      id: `msg_${messageIdCounter.current}_${Date.now()}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  // 处理发送消息
  const handleSend = async (text: string, file?: File) => {
    if (processing || !currentThreadId) return;

    let imageUrl: string | undefined;

    if (file) {
      try {
        imageUrl = await uploadImageToOss(file);
      } catch (error) {
        console.error("图片上传失败:", error);
        addMessage({
          role: "assistant",
          content: "图片上传失败，请稍后重试。",
        });
        return;
      }
    }

    addMessage({
      role: "user",
      content: text || "上传了一张食材图片",
      imageUrl,
    });

    setProcessing(true);

    const assistantMessageId = addMessage({
      role: "assistant",
      content: "",
      streaming: true,
    }).id;

    try {
      await streamChat(
        text || "这是我冰箱里的食物，帮我看看能做什么佳肴？",
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        imageUrl,
        (error) => {
          console.error("聊天失败:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: msg.content + `\n[错误]: ${error.message}`,
                    streaming: false,
                  }
                : msg
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, streaming: false }
                : msg
            )
          );
        },
        currentThreadId
      );
    } finally {
      setProcessing(false);
    }
  };

  // 新建会话
  const handleNewThread = async () => {
    try {
      const newId = await createNewThread();
      switchToThread(newId);
      setMessages([]);
      messageIdCounter.current = 0;
      setSidebarOpen(false);
    } catch (error) {
      console.error("创建会话失败:", error);
    }
  };

  // 删除会话
  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThreadById(threadId);
    } catch (error) {
      console.error("删除会话失败:", error);
    }
  };

  // 切换会话
  const handleSelectThread = (threadId: string) => {
    switchToThread(threadId);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧会话列表 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <ThreadList
          threads={threads}
          currentThreadId={currentThreadId}
          isLoading={threadsLoading}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onNewThread={handleNewThread}
        />
      </aside>

      {/* 右侧聊天区域 */}
      <main className="flex-1 flex flex-col min-h-screen relative">
        {/* 背景 */}
        <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 lg:ml-72" />
        <div className="fixed inset-0 opacity-30 lg:ml-72">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div
            className="absolute top-40 right-10 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-20 left-1/3 w-80 h-80 bg-red-100 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* 顶部栏 */}
        <header className="relative z-10 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/60 rounded-xl"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* 标题 */}
            <div className="hidden lg:block flex-1" />
            <div className="text-center lg:text-right">
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {threads.find(t => t.id === currentThreadId)?.title || "AI 私人厨师"}
              </h1>
              <p className="text-sm text-gray-500">上传食材图片，获取个性化食谱推荐</p>
            </div>
            <div className="w-10 lg:hidden" /> {/* 占位，保持居中 */}
          </div>
        </header>

        {/* 聊天内容区域 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-24">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-20">
                <div className="p-4 bg-white/80 rounded-full mb-4">
                  <UtensilsCrossed size={48} className="text-orange-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">上传食材图片开始吧</p>
                <p className="text-sm mt-2 text-gray-400">我会帮您识别食材并推荐食谱</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 底部输入区域 */}
        <div className="relative z-10 p-4">
          <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
            <ChatInput onSend={handleSend} disabled={processing} />
          </div>
        </div>
      </main>
    </div>
  );
}
