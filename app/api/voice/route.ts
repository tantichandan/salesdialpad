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
      // INCOMING CALL - Connect directly to browser client
      response.say(
        { voice: "alice" },
        "Please hold while we connect your call."
      );

      const dial = response.dial({
        callerId: from,
        record: "record-from-answer",
        timeout: 30,
        action: "/api/voice/status",
        method: "POST",
      });
      
      // Connect to the browser client
      dial.client("voicelink-user");
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
