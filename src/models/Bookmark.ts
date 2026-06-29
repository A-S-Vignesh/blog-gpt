import { Schema, model, models, Document, Types } from "mongoose";

export interface IBookmark extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

BookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark =
  models.Bookmark || model<IBookmark>("Bookmark", BookmarkSchema);
export default Bookmark;
