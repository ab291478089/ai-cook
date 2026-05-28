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
