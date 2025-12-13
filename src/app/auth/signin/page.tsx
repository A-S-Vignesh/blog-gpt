import Login from "@/components/Login";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const session = await getServerSession(authOptions);
  console.log(session);

  // Redirect if already logged in
  if (session?.user?._id) {
    redirect(`/${session.user.username}`);
  }

  return <Login />;
};

export default LoginPage;
