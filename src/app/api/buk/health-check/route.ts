import { NextResponse } from 'next/server';

const useMock = process.env.USE_MOCK_DATA?.trim() === 'true';

export async function GET() {
  try {
    if (useMock) {
      return NextResponse.json(
        {
          data: {
            ok: true,
            latencyMs: 5,
            status: 'ok',
            mode: 'mock',
          },
        },
        { status: 200 }
      );
    }

    const { getBukSDK } = await import('@/lib/buk-sdk');
    const sdk = getBukSDK();
    const result = await sdk.healthCheck();
    return NextResponse.json({ data: result }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error('[BUK] Health check error:', error);
    return NextResponse.json(
      {
        data: {
          ok: false,
          latencyMs: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 503 }
    );
  }
}
