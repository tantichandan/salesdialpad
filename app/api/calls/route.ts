import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const calls = await client.calls.list({ limit: 10 });

    const formatted = calls.map((call) => ({
      sid: call.sid,
      from: call.from,
      to: call.to,
      status: call.status,
      duration: call.duration,
      direction: call.direction,
      dateCreated: call.dateCreated,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Fetch calls error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
