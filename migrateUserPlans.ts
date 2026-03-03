import mongoose from "mongoose";
import { User } from "./src/models/User";

const MONGODB_URI = "mongodb://127.0.0.1:27017/blog";

async function migrateUserPlans() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    let updated = 0;

    // Use lean() to avoid schema defaults interfering
    const users = await User.find({}).lean();

    for (const user of users) {
      const updateFields: any = {};

      if (!("plan" in user)) updateFields.plan = "free";
      if (!("planStatus" in user)) updateFields.planStatus = "active";
      if (!("aiGenerationCount" in user)) updateFields.aiGenerationCount = 0;
      if (!("aiExtraCredits" in user)) updateFields.aiExtraCredits = 0;
      if (!("aiUsagePeriodStart" in user))
        updateFields.aiUsagePeriodStart = new Date();

      if (Object.keys(updateFields).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updateFields });

        updated++;
        console.log(`✔ Fixed user: ${user.email}`);
      }
    }

    console.log(`\n🎉 Migration completed! Total fixed: ${updated}`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

migrateUserPlans();
