import { NextResponse } from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PER_HOUR_LIMIT = 5;

export async function POST(req: Request) {
  try {
    // Public endpoint: throttle by client IP to prevent spam/abuse.
    const ip = getClientIp(req);
    const limit = await rateLimit({
      key: `contact:hour:${ip}`,
      windowMs: 60 * 60 * 1000,
      max: PER_HOUR_LIMIT,
    });
    if (!limit.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many messages. Please try again later.",
        },
        {
          status: 429,
          headers: limit.retryAfterSeconds
            ? { "Retry-After": String(limit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

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

    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email is required" },
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
