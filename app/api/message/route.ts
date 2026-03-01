import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function GET() {
  try {
    const messages = await client.messages.list({ limit: 20 });

    const formatted = messages.map((msg) => ({
      sid: msg.sid,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      direction: msg.direction,
      dateCreated: msg.dateCreated,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { to, body } = await request.json();

    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });

    return NextResponse.json({
      sid: message.sid,
      from: message.from,
      to: message.to,
      body: message.body,
      direction: message.direction,
      dateCreated: message.dateCreated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}