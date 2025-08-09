
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import GenerateBlog from "@/components/GenerateBlog";

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }
  return (
    <GenerateBlog />
  )
};

export default Page;
