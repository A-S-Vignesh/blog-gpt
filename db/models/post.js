import { model, models, Schema } from "mongoose";

const PostSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    post: {
      type: String,
      required: [true, "Post is required."],
    },
    tag: {
      type: String,
      required: [true, "Tag is required."],
    },
  },
  { timestamps: true }
);

// Ensure the model is only registered once
let Post;
try {
  Post = model("Post", PostSchema);
} catch (error) {
  Post = models.Post;
}

export default Post;
