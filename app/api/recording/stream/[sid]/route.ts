import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sid: string }> }
) {
  try {
    const { sid } = await context.params;

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;

    const twilioResponse = await fetch(url, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });

    if (!twilioResponse.ok) {
      return new NextResponse("Failed to fetch recording", { status: 500 });
    }

    const audioBuffer = await twilioResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("Stream error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}