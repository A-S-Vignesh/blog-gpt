
import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017"; // change if needed
const client = new MongoClient(uri);

async function migrateTags() {
  try {
    await client.connect();
    const db = client.db("blog"); // change
    const collection = db.collection("posts"); // change

    const cursor = collection.find({ tag: { $type: "string" } });

    let updatedCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // old field
      const oldTag = doc.tag;

      console.log("Before:", oldTag);

      // convert "#CloudComputing, #Data, #Education" -> ["cloudComputing", "data", "education"]
      const newTags = oldTag
        .split(",")
        .map((tag) => tag.trim())
        .map((tag) => tag.replace(/^#/, "")) // remove leading #
        .map((tag) => tag.charAt(0).toLowerCase() + tag.slice(1)) // make first letter lowercase
        .filter((tag) => tag.length > 0);

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: { tags: newTags }, // new array field
          $unset: { tag: "" }, // remove old string field
        }
      );

      console.log("After:", newTags);
      updatedCount++;
    }

    console.log(`✅ Migration complete! Updated ${updatedCount} documents.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

migrateTags();

