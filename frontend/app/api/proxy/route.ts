import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    if (!action) {
      return NextResponse.json({ detail: "Missing action parameter" }, { status: 400 });
    }
    
    const endpoint = `http://127.0.0.1:8000/${action}`;
    const contentType = req.headers.get('content-type') || '';
    
    const fetchOptions: RequestInit = {
      method: 'POST',
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      fetchOptions.body = formData;
    } else if (contentType.includes('application/json')) {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = await req.text();
    }

    const response = await fetch(endpoint, fetchOptions);
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
        return NextResponse.json(data || { detail: "Backend error" }, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ detail: errorMsg }, { status: 500 });
  }
}
