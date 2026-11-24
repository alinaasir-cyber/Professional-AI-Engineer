import { NextResponse } from "next/server";
import { inngest } from "@/app/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, data } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    const sendResponse = await inngest.send({
      name,
      data: data || {},
    });

    return NextResponse.json({
      success: true,
      event: name,
      ids: sendResponse.ids,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to trigger event";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
