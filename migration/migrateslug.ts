import mongoose from "mongoose";
import Post from "../src/models/Post";
import slugify from "slugify";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";

const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");

function normalizeSlug(slug: string) {
  return slugify(slug || "", {
    lower: true,
    strict: true,
    trim: true,
  });
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const posts = await Post.find({}).lean();

  let changed = 0;

  for (const post of posts) {
    if (!post.slug) continue;

    const newSlug = normalizeSlug(post.slug);

    if (post.slug !== newSlug) {
      console.log(`${DRY_RUN ? "[dry]" : "✔"} "${post.slug}" -> "${newSlug}"`);

      if (!DRY_RUN) {
        await Post.updateOne(
          { _id: post._id },
          {
            $set: {
              slug: newSlug,
            },
          },
          {
            timestamps: false,
          },
        );
      }

      changed++;
    }
  }

  console.log(`\n${changed} posts updated`);

  await mongoose.disconnect();
}

run().catch(console.error);
