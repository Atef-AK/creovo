import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { code, state } = await request.json();

        // Exchange code for tokens via backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-drive/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: request.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ code, state }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to connect Google Drive' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // Redirect to Google OAuth
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-drive/authorize?user_id=${userId}`);
    const { authorization_url } = await response.json();

    return NextResponse.redirect(authorization_url);
}
