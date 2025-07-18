const mongoose = require("mongoose");

// Define Post schema
const postSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    image: {
      type: String,
      default:
        "https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png",
    },
    imagePublicId: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    tag: { type: String, required: true },
    date: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true, // ✅ Adds createdAt and updatedAt automatically from now on
  }
);

// Define model
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// Connect to DB
const connectToDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://vignesh:admin01@cluster.m8sqahv.mongodb.net/blog?retryWrites=true&w=majority&appName=cluster",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Main Script
(async () => {
  try {
    await connectToDB();

    const posts = await Post.find({
      $or: [
        { createdAt: { $exists: false } },
        { updatedAt: { $exists: false } },
      ],
    });

    console.log(`🔍 Found ${posts.length} posts to update...`);

    for (const post of posts) {
      const baseDate = post.date || new Date();
      post.createdAt = baseDate;
      post.updatedAt = baseDate;
      await post.save();
    }

    console.log("✅ All missing timestamps updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during update:", err);
    process.exit(1);
  }
})();
