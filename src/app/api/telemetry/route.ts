import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    return NextResponse.json({ok: false}, {status: 400});
  }

  return new NextResponse(null, {status: 204});
}
