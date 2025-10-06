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

  const user: UserDataType | null = session?.user ?? null;

  return <NavbarClient userData={user} />;
};

export default Navbar;
