import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
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
    geminiApiKey: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const User = models.User || model("User", UserSchema);

export default User;
