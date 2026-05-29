import { ThreadMeta, ThreadListResponse, CreateThreadResponse } from "@/types/thread";
import { generateUUID } from "@/lib/utils";

const API_BASE = "http://localhost:8001/api/v1";

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

const USE_MOCK = false;

export async function getThreadList(): Promise<ThreadListResponse> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { threads: [...mockThreads].sort((a, b) => b.updatedAt - a.updatedAt) };
  }

  const response = await fetch(`${API_BASE}/threads`);
  if (!response.ok) {
    throw new Error("获取会话列表失败");
  }
  return response.json();
}

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

  const response = await fetch(`${API_BASE}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error("创建会话失败");
  }
  return response.json();
}

export async function deleteThread(threadId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockThreads = mockThreads.filter(t => t.id !== threadId);
    return;
  }

  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("删除会话失败");
  }
}

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

  const response = await fetch(`${API_BASE}/threads/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("更新会话失败");
  }
}