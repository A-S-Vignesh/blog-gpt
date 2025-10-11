import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb://127.0.0.1:27017"; // your Mongo URI
const client = new MongoClient(uri);

async function updateExcerpts() {
  try {
    await client.connect();
    const db = client.db("blog"); // change to your DB name
    const collection = db.collection("posts"); // change to your collection name

    // Find posts where excerpt is missing or empty
    const cursor = collection.find({
      $or: [{ excerpt: { $exists: false } }, { excerpt: "" }],
    });

    let updatedCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      if (doc.content && doc.content.length > 0) {
        // Generate excerpt: first 200 characters
        const newExcerpt = doc.content.slice(0, 200);

        await collection.updateOne(
          { _id: doc._id },
          {
            $set: { excerpt: newExcerpt },
          }
        );

        console.log(`✅ Updated excerpt for: "${doc.title}"`);
        updatedCount++;
      }
    }

    console.log(
      `🎉 Excerpt update complete! Updated ${updatedCount} documents.`
    );
  } catch (err) {
    console.error("❌ Error updating excerpts:", err);
  } finally {
    await client.close();
  }
}

updateExcerpts();
