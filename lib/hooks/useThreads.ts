/**
 * 会话管理 Hook
 */
import { useState, useEffect, useCallback } from "react";
import { ThreadMeta } from "@/types/thread";
import { getThreadList, createThread, deleteThread, updateThread } from "@/lib/api";
import { clearChatHistory } from "@/lib/api";

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

  // 加载会话列表
  const refreshThreads = useCallback(async () => {
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
  }, [currentThreadId]);

  // 初始化加载会话列表
  useEffect(() => {
    refreshThreads();
  }, []);

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
