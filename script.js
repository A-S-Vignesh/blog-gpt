import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

async function migrateUserPlans() {
  try {
    await client.connect();

    const db = client.db("blog");
    const collection = db.collection("users");

    const cursor = collection.find({});

    let updated = 0;

    while (await cursor.hasNext()) {
      const user = await cursor.next();
      if (!user) continue;

      const updateFields = {};

      // Set defaults only if missing
      if (!user.plan) {
        updateFields.plan = "free";
      }

      if (!user.planStatus) {
        updateFields.planStatus = "active";
      }

      if (typeof user.aiGenerationCount !== "number") {
        updateFields.aiGenerationCount = 0;
      }

      if (typeof user.aiExtraCredits !== "number") {
        updateFields.aiExtraCredits = 0;
      }

      if (!user.aiUsagePeriodStart) {
        updateFields.aiUsagePeriodStart = new Date();
      }

      if (Object.keys(updateFields).length > 0) {
        await collection.updateOne({ _id: user._id }, { $set: updateFields });

        updated++;
        console.log(`✔ Updated user: ${user.email}`);
      }
    }

    console.log(
      `\n🎉 User plan migration completed! Total updated: ${updated}`
    );
  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    await client.close();
  }
}

migrateUserPlans();
