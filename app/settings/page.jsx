// app/settings/page.jsx
export const dynamic = "force-dynamic";
import AccountSettings from "@/components/AccountSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/db/models/user";
import { connectToDB } from "@/db/database";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }
  return <AccountSettings />;
}
