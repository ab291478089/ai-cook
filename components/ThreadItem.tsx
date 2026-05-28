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
