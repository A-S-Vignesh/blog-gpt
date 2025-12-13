import { Schema, model, models, Document } from "mongoose";

export interface IPost extends Document {
  creator: Schema.Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image: string;
  imagePublicId?: string;
  tags: string[];
  category?: string;
  status?: "draft" | "published" | "archived";
  views?: number;
  likes?: Schema.Types.ObjectId[];
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  scheduledAt?: Date;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.jpg",
    },
    imagePublicId: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readingTime: { type: Number, default: 0 },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    scheduledAt: { type: Date },
    date: { type: Date },
  },
  { timestamps: true }
);

PostSchema.index({ creator: 1, slug: 1 }, { unique: true });

const Post = models.Post || model<IPost>("Post", PostSchema);
export default Post;
