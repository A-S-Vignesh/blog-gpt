import { NextResponse } from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Hard validation (do NOT trust frontend)
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Message too long" },
        { status: 400 }
      );
    }

    await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("CONTACT_MESSAGE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
