import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const recordings = await client.recordings.list({ limit: 10 });

    const formatted = recordings.map((rec) => ({
      sid: rec.sid,
      duration: rec.duration,
      dateCreated: rec.dateCreated,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Fetch recordings error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}