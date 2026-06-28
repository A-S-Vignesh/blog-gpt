export type ClientComment = {
  _id: string;
  postId: string;
  postSlug?: string;
  content: string;
  parentCommentId?: string | null;
  depth?: number;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  /** Number of direct replies under this comment. Computed server-side. */
  replyCount?: number;
  userId: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
};
