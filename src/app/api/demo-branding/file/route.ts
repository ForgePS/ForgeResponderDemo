import fs from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const mime: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requested = url.searchParams.get('name')

  if (!requested) return new NextResponse('Not found', { status: 404 })

  const fileName = path.basename(requested)
  const ext = path.extname(fileName).toLowerCase()

  if (!mime[ext]) return new NextResponse('Unsupported file', { status: 400 })

  const filePath = path.join(process.cwd(), 'demo-persistence', 'uploads', fileName)

  if (!fs.existsSync(filePath)) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(fs.readFileSync(filePath), {
    headers: {
      'Content-Type': mime[ext],
      'Cache-Control': 'no-store'
    }
  })
}
