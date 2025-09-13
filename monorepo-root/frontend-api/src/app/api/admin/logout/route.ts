import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Создаем ответ
    const response = NextResponse.json({ success: true })

    // Очищаем куки авторизации
    response.cookies.delete('auth')
    response.cookies.delete('refresh_token')

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при выходе' }, { status: 500 })
  }
}
