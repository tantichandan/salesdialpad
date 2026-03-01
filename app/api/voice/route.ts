import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const response = new VoiceResponse();

    // IMPORTANT: Twilio sends form-encoded body, not query params
    const formData = await request.formData();
    const to = formData.get("To") as string | null;
    const from = formData.get("From") as string | null;

    if (to) {
      // OUTGOING CALL FROM BROWSER
      response.dial(
        {
          callerId: process.env.TWILIO_PHONE_NUMBER,
          record: "record-from-answer",
          
        },
        to
      );
    } else if (from) {
      // INCOMING CALL
      response.say(
  { voice: "alice" },
  "Thank you for calling. Press 1 to speak with sales, or 2 for support."
);

      response.gather({
        numDigits: 1,
        action: "/api/voice/gather",
        method: "POST",
      });
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    const response = new VoiceResponse();
    response.say("An error occurred. Please try again later.");

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}