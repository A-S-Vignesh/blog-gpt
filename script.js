import { MongoClient } from "mongodb";
import { marked } from "marked";

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

async function migrateMarkdownToHtml() {
  try {
    await client.connect();

    const db = client.db("blog");
    const collection = db.collection("posts");

    const cursor = collection.find({});

    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const content = doc.content || "";

      // Detect REAL HTML (not markdown with <span> inside code blocks)
      const trimmed = content.trim();

      const isRealHTML =
        trimmed.startsWith("<p") ||
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol");

      if (isRealHTML) {
        console.log(`⏭ Skipping (already HTML): ${doc.slug}`);
        continue;
      }

      console.log(`🔄 Converting markdown for: ${doc.slug}`);

      const html = marked(content);

      await collection.updateOne({ _id: doc._id }, { $set: { content: html } });

      updated++;
      console.log(`✔ Updated: ${doc.slug}`);
    }

    console.log(`\n🎉 Migration completed! Total updated: ${updated}`);
  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    await client.close();
  }
}

migrateMarkdownToHtml();
