import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// The password is stored securely in environment variable - not visible in source code
const APP_PASSWORD = process.env.APP_ACCESS_PASSWORD;

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (!APP_PASSWORD) {
      return NextResponse.json(
        { error: "App password not configured" },
        { status: 500 }
      );
    }

    if (password === APP_PASSWORD) {
      // Create a secure session token
      const sessionToken = Buffer.from(
        `${Date.now()}-${APP_PASSWORD}`
      ).toString("base64");
      
      const cookieStore = await cookies();
      cookieStore.set("voicelink_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("voicelink_session");
    
    if (!session?.value || !APP_PASSWORD) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify the session token contains our password
    const decoded = Buffer.from(session.value, "base64").toString();
    const isValid = decoded.includes(APP_PASSWORD);

    return NextResponse.json({ authenticated: isValid });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("voicelink_session");
  return NextResponse.json({ success: true });
}
