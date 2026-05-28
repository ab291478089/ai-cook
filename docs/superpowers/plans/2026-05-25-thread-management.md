# 会话管理功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 在聊天界面左侧添加会话管理功能，支持会话列表展示、切换、删除等操作

**架构:** 采用组件化设计，左侧固定宽度会话列表 + 右侧聊天主区域，通过自定义Hook管理会话状态，Mock API模拟后端接口

**技术栈:** Next.js 16, TypeScript, Tailwind CSS, Lucide React Icons

---

## 文件结构

**新增文件:**

- `types/thread.ts` - 会话类型定义
- `lib/api/thread.ts` - 会话相关API（Mock实现）
- `lib/hooks/useThreads.ts` - 会话管理Hook
- `components/ThreadList.tsx` - 会话列表组件
- `components/ThreadItem.tsx` - 单个会话项组件

**修改文件:**

- `lib/api.ts` - 重构为导出聚合
- `app/page.tsx` - 改为左右分栏布局

---

## Task 1: 添加会话类型定义

**文件:**

- Create: `types/thread.ts`

- [ ]  **Step 1: 创建会话类型定义文件**

```typescript
/**
 * 会话相关类型定义
 */

export interface ThreadMeta {
  id: string;                    // 会话ID
  title: string;                 // 会话标题
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 最后更新时间戳
  preview?: string;              // 最后一条消息预览
}

export interface ThreadListResponse {
  threads: ThreadMeta[];
}

export interface CreateThreadResponse {
  id: string;
  title: string;
  createdAt: number;
}
```

- [ ]  **Step 2: 验证类型定义**

运行: `npx tsc --noEmit`
预期: 无类型错误

---

## Task 2: 创建会话API Mock实现

**文件:**

- Create: `lib/api/thread.ts`

- [ ]  **Step 1: 创建会话API Mock文件**

```typescript
/**
 * 会话相关 API (Mock 实现)
 */
import { ThreadMeta, ThreadListResponse, CreateThreadResponse } from "@/types/thread";
import { generateUUID } from "@/lib/utils";

const API_BASE = "http://localhost:8001";

// Mock 数据存储
let mockThreads: ThreadMeta[] = [
  {
    id: "thread-1",
    title: "红烧肉需要什么食材",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    preview: "做红烧肉需要五花肉、生抽、老抽..."
  },
  {
    id: "thread-2",
    title: "清蒸鲈鱼的做法",
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
    preview: "清蒸鲈鱼需要准备鲈鱼一条..."
  }
];

// 是否使用 Mock 数据（后续对接真实API时改为 false）
const USE_MOCK = true;

/**
 * 获取会话列表
 */
export async function getThreadList(): Promise<ThreadListResponse> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));
    return { threads: [...mockThreads].sort((a, b) => b.updatedAt - a.updatedAt) };
  }

  const response = await fetch(`${API_BASE}/api/v1/threads`);
  if (!response.ok) {
    throw new Error("获取会话列表失败");
  }
  return response.json();
}

/**
 * 创建新会话
 */
export async function createThread(title?: string): Promise<CreateThreadResponse> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newThread: ThreadMeta = {
      id: generateUUID(),
      title: title || "新建会话",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockThreads.unshift(newThread);
    return {
      id: newThread.id,
      title: newThread.title,
      createdAt: newThread.createdAt,
    };
  }

  const response = await fetch(`${API_BASE}/api/v1/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error("创建会话失败");
  }
  return response.json();
}

/**
 * 删除会话
 */
export async function deleteThread(threadId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockThreads = mockThreads.filter(t => t.id !== threadId);
    return;
  }

  const response = await fetch(`${API_BASE}/api/v1/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("删除会话失败");
  }
}

/**
 * 更新会话信息
 */
export async function updateThread(threadId: string, updates: Partial<Pick<ThreadMeta, 'title'>>): Promise<void> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockThreads.findIndex(t => t.id === threadId);
    if (index !== -1) {
      mockThreads[index] = {
        ...mockThreads[index],
        ...updates,
        updatedAt: Date.now(),
      };
    }
    return;
  }

  const response = await fetch(`${API_BASE}/api/v1/threads/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("更新会话失败");
  }
}
```

- [ ]  **Step 2: 验证API文件编译**

运行: `npx tsc --noEmit lib/api/thread.ts`
预期: 无类型错误

---

## Task 3: 重构API导出结构

**文件:**

- Modify: `lib/api.ts`

- [ ]  **Step 1: 重命名现有API文件**

运行: `mv lib/api.ts lib/api/chat.ts`
预期: 文件重命名成功

- [ ]  **Step 2: 创建新的API索引文件**

```typescript
/**
 * API 导出聚合
 */
export * from "./api/chat";
export * from "./api/thread";
```

- [ ]  **Step 3: 验证导入路径**

运行: `npx tsc --noEmit`
预期: 无类型错误

---

## Task 4: 创建会话管理Hook

**文件:**

- Create: `lib/hooks/useThreads.ts`

- [ ]  **Step 1: 创建hooks目录**

运行: `mkdir -p lib/hooks`

- [ ]  **Step 2: 创建useThreads Hook**

```typescript
/**
 * 会话管理 Hook
 */
import { useState, useEffect, useCallback } from "react";
import { ThreadMeta } from "@/types/thread";
import { getThreadList, createThread, deleteThread, updateThread } from "@/lib/api";
import { getChatHistory, clearChatHistory } from "@/lib/api";
import { generateUUID } from "@/lib/utils";

interface UseThreadsReturn {
  threads: ThreadMeta[];
  currentThreadId: string;
  isLoading: boolean;
  createNewThread: () => Promise<string>;
  deleteThreadById: (threadId: string) => Promise<void>;
  switchToThread: (threadId: string) => void;
  updateThreadTitle: (threadId: string, title: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
}

export function useThreads(): UseThreadsReturn {
  const [threads, setThreads] = useState<ThreadMeta[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // 初始化加载会话列表
  useEffect(() => {
    refreshThreads();
  }, []);

  // 加载会话列表
  const refreshThreads = async () => {
    setIsLoading(true);
    try {
      const response = await getThreadList();
      setThreads(response.threads);

      // 如果没有当前会话，选择第一个或创建新的
      if (!currentThreadId && response.threads.length > 0) {
        setCurrentThreadId(response.threads[0].id);
        localStorage.setItem("thread_id", response.threads[0].id);
      } else if (!currentThreadId && response.threads.length === 0) {
        // 没有任何会话，创建一个新的
        const newId = await createNewThread();
        setCurrentThreadId(newId);
        localStorage.setItem("thread_id", newId);
      } else {
        // 恢复上次选中的会话
        const storedThreadId = localStorage.getItem("thread_id");
        if (storedThreadId && response.threads.some(t => t.id === storedThreadId)) {
          setCurrentThreadId(storedThreadId);
        }
      }
    } catch (error) {
      console.error("加载会话列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新会话
  const createNewThread = async (): Promise<string> => {
    try {
      const response = await createThread();
      const newThread: ThreadMeta = {
        id: response.id,
        title: response.title,
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
      };
      setThreads(prev => [newThread, ...prev]);
      return response.id;
    } catch (error) {
      console.error("创建会话失败:", error);
      throw error;
    }
  };

  // 删除会话
  const deleteThreadById = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      await clearChatHistory(threadId);

      setThreads(prev => prev.filter(t => t.id !== threadId));

      // 如果删除的是当前会话，切换到第一个或创建新的
      if (currentThreadId === threadId) {
        const remainingThreads = threads.filter(t => t.id !== threadId);
        if (remainingThreads.length > 0) {
          const nextThread = remainingThreads[0];
          setCurrentThreadId(nextThread.id);
          localStorage.setItem("thread_id", nextThread.id);
        } else {
          const newId = await createNewThread();
          setCurrentThreadId(newId);
          localStorage.setItem("thread_id", newId);
        }
      }
    } catch (error) {
      console.error("删除会话失败:", error);
      throw error;
    }
  };

  // 切换会话
  const switchToThread = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    localStorage.setItem("thread_id", threadId);
  }, []);

  // 更新会话标题
  const updateThreadTitle = async (threadId: string, title: string) => {
    try {
      await updateThread(threadId, { title });
      setThreads(prev =>
        prev.map(t =>
          t.id === threadId
            ? { ...t, title, updatedAt: Date.now() }
            : t
        )
      );
    } catch (error) {
      console.error("更新会话标题失败:", error);
      throw error;
    }
  };

  return {
    threads,
    currentThreadId,
    isLoading,
    createNewThread,
    deleteThreadById,
    switchToThread,
    updateThreadTitle,
    refreshThreads,
  };
}
```

- [ ]  **Step 3: 验证Hook编译**

运行: `npx tsc --noEmit lib/hooks/useThreads.ts`
预期: 无类型错误

---

## Task 5: 创建会话项组件

**文件:**

- Create: `components/ThreadItem.tsx`

- [ ]  **Step 1: 创建ThreadItem组件**

```typescript
/**
 * 单个会话项组件
 */
import { ThreadMeta } from "@/types/thread";
import { MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";

interface ThreadItemProps {
  thread: ThreadMeta;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ThreadItem({ thread, isActive, onSelect, onDelete }: ThreadItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    if (confirm(`确定要删除会话"${thread.title}"吗？`)) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    }
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all
        ${isActive
          ? "bg-orange-100 border-2 border-orange-300"
          : "bg-white/60 hover:bg-white/80 border-2 border-transparent"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
          <MessageSquare size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${isActive ? "text-orange-900" : "text-gray-800"}`}>
            {thread.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {formatDate(thread.updatedAt)}
            </span>
            {thread.preview && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <p className="text-xs text-gray-400 truncate flex-1">
                  {thread.preview}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 删除按钮 */}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
```

- [ ]  **Step 2: 验证组件编译**

运行: `npx tsc --noEmit components/ThreadItem.tsx`
预期: 无类型错误

---

## Task 6: 创建会话列表组件

**文件:**

- Create: `components/ThreadList.tsx`

- [ ]  **Step 1: 创建ThreadList组件**

```typescript
/**
 * 会话列表组件
 */
import { ThreadMeta } from "@/types/thread";
import { ThreadItem } from "./ThreadItem";
import { Plus, ChefHat } from "lucide-react";

interface ThreadListProps {
  threads: ThreadMeta[];
  currentThreadId: string;
  isLoading: boolean;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onNewThread: () => void;
}

export function ThreadList({
  threads,
  currentThreadId,
  isLoading,
  onSelectThread,
  onDeleteThread,
  onNewThread,
}: ThreadListProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50 to-amber-50">
      {/* 头部 */}
      <div className="p-4 border-b border-orange-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <ChefHat className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            AI 私人厨师
          </h1>
        </div>

        {/* 新建会话按钮 */}
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          <span className="font-medium">新建会话</span>
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">暂无会话记录</p>
            <p className="text-xs mt-1">点击上方按钮开始新对话</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === currentThreadId}
                onSelect={() => onSelectThread(thread.id)}
                onDelete={() => onDeleteThread(thread.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-3 border-t border-orange-100 text-center">
        <p className="text-xs text-gray-400">
          {threads.length} 个会话
        </p>
      </div>
    </div>
  );
}
```

- [ ]  **Step 2: 验证组件编译**

运行: `npx tsc --noEmit components/ThreadList.tsx`
预期: 无类型错误

---

## Task 7: 重构主页面为左右分栏布局

**文件:**

- Modify: `app/page.tsx`

- [ ]  **Step 1: 备份当前页面文件**

运行: `cp app/page.tsx app/page.tsx.backup`

- [ ]  **Step 2: 重构主页面组件**

将现有的 `app/page.tsx` 完整替换为：

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ThreadList } from "@/components/ThreadList";
import { useThreads } from "@/lib/hooks/useThreads";
import { uploadImageToOss, streamChat, getChatHistory, clearChatHistory } from "@/lib/api";
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
    refreshThreads,
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
```

- [ ]  **Step 3: 验证页面编译**

运行: `npx tsc --noEmit app/page.tsx`
预期: 无类型错误

---

## Task 8: 验证功能完整性

- [ ]  **Step 1: 启动开发服务器**

运行: `npm run dev`
预期: 服务器启动成功，监听 localhost:3000

- [ ]  **Step 2: 测试会话列表加载**

操作: 打开浏览器 http://localhost:3000
预期:

- 左侧显示会话列表
- 显示2个Mock会话
- 第一个会话自动选中

- [ ]  **Step 3: 测试会话切换**

操作: 点击不同的会话项
预期:

- 当前会话高亮显示
- 右侧加载对应会话的历史消息

- [ ]  **Step 4: 测试新建会话**

操作: 点击"新建会话"按钮
预期:

- 创建新的会话
- 自动切换到新会话
- 消息列表清空

- [ ]  **Step 5: 测试删除会话**

操作: 悬停会话项，点击删除按钮，确认删除
预期:

- 会话从列表中移除
- 自动切换到其他会话

- [ ]  **Step 6: 测试响应式布局**

操作: 调整浏览器窗口大小或使用移动设备模式
预期:

- 桌面端：侧边栏固定显示
- 移动端：侧边栏隐藏，点击菜单按钮展开

---

## Task 9: 清理和优化

- [ ]  **Step 1: 删除备份文件**

运行: `rm app/page.tsx.backup`

- [ ]  **Step 2: 提交代码**

```bash
git add .
git commit -m "feat: 添加会话管理功能

- 新增会话列表侧边栏
- 支持会话切换、新建、删除
- 使用Mock数据，便于后续对接真实API
- 响应式设计，支持移动端
"
```

---

## 后续对接真实API清单

当后端接口就绪后，需要：

1. 修改 `lib/api/thread.ts` 中的 `USE_MOCK` 为 `false`
2. 确认后端接口返回格式与类型定义一致
3. 测试所有会话操作功能
4. 可选：添加会话持久化和多设备同步
