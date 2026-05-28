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
