import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const recordingSid = params.get("RecordingSid");
    const recordingStatus = params.get("RecordingStatus");
    const callSid = params.get("CallSid");

    console.log("Recording callback received:", {
      recordingSid,
      recordingStatus,
      callSid,
    });

    // Handle recording completion
    if (recordingStatus === "completed") {
      console.log("Recording completed successfully:", {
        recordingSid,
        callSid,
      });
      // You can store the recording SID in a database here
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Recording callback error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
