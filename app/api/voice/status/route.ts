import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const twiml = new VoiceResponse();
  
  try {
    const formData = await request.formData();
    const dialCallStatus = formData.get("DialCallStatus") as string;
    
    // If call wasn't answered, provide a message
    if (dialCallStatus === "no-answer" || dialCallStatus === "busy" || dialCallStatus === "failed") {
      twiml.say({ voice: "alice" }, "We were unable to connect your call. Please try again later. Goodbye.");
    }
    // If completed, just end the call gracefully
  } catch (error) {
    twiml.say({ voice: "alice" }, "An error occurred. Goodbye.");
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
