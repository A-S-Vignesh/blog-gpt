"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col items-center mt-10 p-10">
        <h1 className="text-4xl font-bold mb-8">Sign In</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="black_btn"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 