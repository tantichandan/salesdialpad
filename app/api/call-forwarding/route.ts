import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'call-forwarding-config.json');

async function readConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { forwardingEnabled: false, forwardingNumber: '' };
  }
}

async function writeConfig(config: any) {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json(
      { error: 'Failed to read configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forwardingEnabled, forwardingNumber } = body;

    const config = {
      forwardingEnabled: Boolean(forwardingEnabled),
      forwardingNumber: forwardingNumber?.trim() || '',
    };

    await writeConfig(config);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error writing config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
