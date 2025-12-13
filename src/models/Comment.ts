import { Schema, model, models, Document, Types } from "mongoose";

export interface IComment extends Document {
  postId: Types.ObjectId; // The post being commented on
  postSlug: string;
  userId: Types.ObjectId; // The user who made the comment
  content: string;
  parentCommentId?: Types.ObjectId | null; // For threaded/reply comments
  likes: Types.ObjectId[]; // Users who liked this comment
  depth: number; // For threaded comments
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    postSlug: { type: String },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required!"],
      maxlength: [1000, "Comment cannot exceed 1000 characters!"],
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null, // null means it's a root-level comment
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: { type: Boolean, default: false },
    depth: { type: Number, default: 0 }, // For threaded comments
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Comment = models.Comment || model<IComment>("Comment", CommentSchema);
export default Comment;
