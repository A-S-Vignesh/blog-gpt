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
  comments?: Schema.Types.ObjectId[];
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  scheduledAt?: Date;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper to strip HTML tags
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

// Helper to truncate to nearest word
function truncateToNearestWord(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  return truncated.slice(0, truncated.lastIndexOf(" ")) || truncated;
}

// Helper to generate meta description
function generateMetaDescription(content: string, maxLength = 160) {
  if (!content) return "";

  // Strip HTML
  const text = content.replace(/<[^>]+>/g, "").trim();

  // Truncate to maxLength
  let truncated = text.slice(0, maxLength);

  // Try to cut at last period for a complete sentence
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > 50) { // make sure we don't cut too early
    truncated = truncated.slice(0, lastPeriod + 1);
  } else {
    // Otherwise, cut at last space to avoid broken words
    const lastSpace = truncated.lastIndexOf(" ");
    truncated = truncated.slice(0, lastSpace) + "...";
  }

  return truncated;
}

const PostSchema = new Schema<IPost>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: "" },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/ddj4zaxln/image/upload/laptop_hyujfu.jpg",
    },
    imagePublicId: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    readingTime: { type: Number, default: 0 },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    scheduledAt: { type: Date },
    date: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook for excerpt and meta description
PostSchema.pre<IPost>("save", function (next) {
  // Generate excerpt if missing
  if ((!this.excerpt || this.excerpt.trim() === "") && this.content) {
    const plainText = this.content.replace(/<[^>]+>/g, "");
    const truncated = plainText.slice(0, 200);
    this.excerpt = truncated.slice(0, truncated.lastIndexOf(" ")) || truncated;
  }

  // Generate meta description if missing
  if ((!this.metaDescription || this.metaDescription.trim() === "") && this.content) {
    this.metaDescription = generateMetaDescription(this.content, 160);
  }

  next();
});

const Post = models.Post || model<IPost>("Post", PostSchema);
export default Post;
