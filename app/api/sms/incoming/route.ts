import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    console.log("Incoming SMS:", from, body);

    // Return JSON instead of TwiML
    return NextResponse.json({
      success: true,
      from,
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}