import { NextResponse, type NextRequest } from "next/server";

// Local-dev stub: auth is disabled. Everything passes through.
export async function updateSession(_request: NextRequest) {
  return NextResponse.next();
}
