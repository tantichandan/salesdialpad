import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const digits = request.nextUrl.searchParams.get("Digits");

    const response = new VoiceResponse();

    if (digits === "1") {
      response.say("You selected sales. Transferring now.", { voice: "alice" });
      response.dial({
        number: process.env.TWILIO_PHONE_NUMBER!,
      });
    } else if (digits === "2") {
      response.say("You selected support. Transferring now.", { voice: "alice" });
      response.dial({
        number: process.env.TWILIO_PHONE_NUMBER!,
      });
    } else {
      response.say("Invalid selection. Please try again.", { voice: "alice" });
      response.redirect("/api/voice");
    }

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Gather route error:", error);

    const response = new VoiceResponse();
    response.say("An error occurred. Please try again later.");

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
}
