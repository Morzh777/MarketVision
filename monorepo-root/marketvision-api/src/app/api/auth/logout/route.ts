import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    }, { status: 200 });

    // Удаляем cookie с токеном
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Logout failed'
    }, { status: 500 });
  }
} 