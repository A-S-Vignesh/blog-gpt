import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import NavbarClient from "./NavbarClient";

interface UserDataType {
  _id?: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
  username?: string;
}




const Navbar = async () => {
  const session = await getServerSession(authOptions);

  // Typecast session.user to your interface (if needed)
  const user: UserDataType | null = session?.user ?? null;

  // console.log("Session:",session)

  return <NavbarClient userData={user} />;
};

export default Navbar;
