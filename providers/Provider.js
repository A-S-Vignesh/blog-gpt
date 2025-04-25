"use client";

import { SessionProvider } from "next-auth/react";
//provider for use the users details across the components
const Provider = ({ children, session }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};
export default Provider;
