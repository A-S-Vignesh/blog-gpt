import { model, models, Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  website?: string;
  image?: string;
  role: "admin" | "author" | "user";
  emailVerified: boolean;
  isActive: boolean;
  bookmarks: Schema.Types.ObjectId[];
  likes: Schema.Types.ObjectId[];
  followers: Schema.Types.ObjectId[];
  following: Schema.Types.ObjectId[];
  geminiApiKey?: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: [true, "Email already exists!"],
      required: [true, "Email is required!"],
    },
    name: {
      type: String,
      required: [true, "Name is required!"],
      match: [
        /^[a-zA-Z\s\-]+$/,
        "Name must contain only letters, spaces, or hyphens!",
      ],
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: [true, "Username already exists!"],
      match: [
        /^(?=.{6,20}$)(?![_-])(?!.*[_-]{2})[a-zA-Z0-9_-]+(?<![_-])$/,
        "Username must be 6-20 characters, alphanumeric with optional underscores or hyphens.",
      ],
    },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters!"],
    },
    socials: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    website: { type: String, default: "" },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "author", "user"],
      default: "user",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    bookmarks: [
      { type: Schema.Types.ObjectId, ref: "Post" }
    ],
    likes: [
      { type: Schema.Types.ObjectId, ref: "Post" }
    ],
    followers: [
      { type: Schema.Types.ObjectId, ref: "User" }
    ],
    following: [
      { type: Schema.Types.ObjectId, ref: "User" }
    ],
    geminiApiKey: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
