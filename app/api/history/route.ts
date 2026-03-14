import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, calls, messages, recordings
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const result: {
      calls: any[];
      messages: any[];
      recordings: any[];
    } = {
      calls: [],
      messages: [],
      recordings: [],
    };

    // Build date filters
    const dateFilter: {
      startTimeAfter?: Date;
      startTimeBefore?: Date;
      dateSentAfter?: Date;
      dateSentBefore?: Date;
      dateCreatedAfter?: Date;
      dateCreatedBefore?: Date;
    } = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.startTimeAfter = start;
      dateFilter.dateSentAfter = start;
      dateFilter.dateCreatedAfter = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.startTimeBefore = end;
      dateFilter.dateSentBefore = end;
      dateFilter.dateCreatedBefore = end;
    }

    // Fetch calls
    if (type === "all" || type === "calls") {
      const callsFilter: any = { limit: 100 };
      if (dateFilter.startTimeAfter) callsFilter.startTimeAfter = dateFilter.startTimeAfter;
      if (dateFilter.startTimeBefore) callsFilter.startTimeBefore = dateFilter.startTimeBefore;
      
      const calls = await client.calls.list(callsFilter);
      result.calls = calls.map((call) => ({
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        duration: call.duration,
        direction: call.direction,
        dateCreated: call.dateCreated,
      }));
    }

    // Fetch messages
    if (type === "all" || type === "messages") {
      const messagesFilter: any = { limit: 100 };
      if (dateFilter.dateSentAfter) messagesFilter.dateSentAfter = dateFilter.dateSentAfter;
      if (dateFilter.dateSentBefore) messagesFilter.dateSentBefore = dateFilter.dateSentBefore;
      
      const messages = await client.messages.list(messagesFilter);
      result.messages = messages.map((msg) => ({
        sid: msg.sid,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        direction: msg.direction,
        status: msg.status,
        dateCreated: msg.dateCreated,
      }));
    }

    // Fetch recordings
    if (type === "all" || type === "recordings") {
      const recordingsFilter: any = { limit: 100 };
      if (dateFilter.dateCreatedAfter) recordingsFilter.dateCreatedAfter = dateFilter.dateCreatedAfter;
      if (dateFilter.dateCreatedBefore) recordingsFilter.dateCreatedBefore = dateFilter.dateCreatedBefore;
      
      const recordings = await client.recordings.list(recordingsFilter);
      result.recordings = recordings.map((rec) => ({
        sid: rec.sid,
        callSid: rec.callSid,
        duration: rec.duration,
        dateCreated: rec.dateCreated,
      }));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
