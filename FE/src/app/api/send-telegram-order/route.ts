// src/app/api/send-telegram-order/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import TelegramBot from 'node-telegram-bot-api'

const TELEGRAM_BOT_TOKEN = '7355613031:AAHR0L88A_4LJ9PCHTliLtOlUi1BJr1Xk_8'
const CHAT_ID = '-4814428628'
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN)

export async function POST(req: NextRequest) {
  const { product, phone, address, note, fullName, email } = await req.json()

  if (!product || !phone || !address) {
    return NextResponse.json({ message: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  const message = `
🛒 ĐƠN HÀNG MỚI
-------------------------
Sản phẩm: ${product.title}
Giá: ${product.price}
-------------------------
Tên: ${fullName}
Email: ${email}
Số điện thoại: ${phone}
Địa chỉ: ${address}
Ghi chú: ${note || 'Không'}
-------------------------
  `.trim()

  try {
    await bot.sendMessage(CHAT_ID, message)
    return NextResponse.json({ message: 'Đã gửi đơn hàng thành công!' })
  } catch (error) {
    return NextResponse.json({ message: 'Gửi telegram thất bại', error }, { status: 500 })
  }
}
