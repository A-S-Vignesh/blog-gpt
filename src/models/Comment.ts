import { Schema, model, models, Document, Types } from "mongoose";

export interface IComment extends Document {
  postId: Types.ObjectId; // The post being commented on
  userId: Types.ObjectId; // The user who made the comment
  content: string;
  parentCommentId?: Types.ObjectId | null; // For threaded/reply comments
  likes: Types.ObjectId[]; // Users who liked this comment
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
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Comment = models.Comment || model<IComment>("Comment", CommentSchema);
export default Comment;
