import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json({
        authenticated: false,
        error: error.message,
        headers: Object.fromEntries([...request.headers.entries()].filter(([k]) => !k.includes('authorization'))),
        cookies: Object.fromEntries([...request.cookies.getAll()].map(c => [c.name, 'present']))
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        reason: 'No user found',
        headers: Object.fromEntries([...request.headers.entries()].filter(([k]) => !k.includes('authorization'))),
        cookies: Object.fromEntries([...request.cookies.getAll()].map(c => [c.name, 'present'])) 
      }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      cookieCount: request.cookies.getAll().length,
      headers: Object.fromEntries([...request.headers.entries()].filter(([k]) => !k.includes('authorization'))),
      cookies: Object.fromEntries([...request.cookies.getAll()].map(c => [c.name, 'present']))
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message || 'Unknown error',
      errorObj: JSON.stringify(error)
    }, { status: 500 });
  }
}