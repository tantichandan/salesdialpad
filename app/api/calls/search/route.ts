import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

/**
 * POST /api/calls/search
 * Search calls by date range
 * Request body: { startDate?: string (ISO date), endDate?: string (ISO date) }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    // Build filter options
    const filterOptions: any = { limit: 100 };

    // If dates provided, add them to filter
    if (startDate) {
      const start = new Date(startDate);
      filterOptions.dateCreatedAfter = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      // Add one day to include entire end date
      end.setDate(end.getDate() + 1);
      filterOptions.dateCreatedBefore = end;
    }

    const calls = await client.calls.list(filterOptions);

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
    console.error('Calls search error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
