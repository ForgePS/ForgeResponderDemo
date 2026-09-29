import fs from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const persistenceDir = path.join(process.cwd(), 'demo-persistence')
const uploadsDir = path.join(persistenceDir, 'uploads')
const configPath = path.join(persistenceDir, 'branding.json')

type LogoSlot = 'primaryLogo' | 'secondaryLogo'

type BrandingConfig = {
  primaryLogo: string | null
  secondaryLogo: string | null
  updatedAt: string | null
}

const defaultConfig: BrandingConfig = {
  primaryLogo: null,
  secondaryLogo: null,
  updatedAt: null
}

function ensureStorage() {
  fs.mkdirSync(uploadsDir, { recursive: true })

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }
}

function readConfig(): BrandingConfig {
  ensureStorage()

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    return {
      primaryLogo: typeof parsed.primaryLogo === 'string' ? parsed.primaryLogo : null,
      secondaryLogo: typeof parsed.secondaryLogo === 'string' ? parsed.secondaryLogo : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null
    }
  } catch {
    return defaultConfig
  }
}

function writeConfig(config: BrandingConfig) {
  ensureStorage()
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function safeExtension(type: string) {
  if (type === 'image/png') return 'png'
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  return null
}

export async function GET() {
  return NextResponse.json(readConfig(), {
    headers: { 'Cache-Control': 'no-store' }
  })
}

export async function POST(request: Request) {
  ensureStorage()

  const form = await request.formData()
  const slot = form.get('slot')
  const file = form.get('file')

  if (slot !== 'primaryLogo' && slot !== 'secondaryLogo') {
    return NextResponse.json({ error: 'Invalid logo slot.' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No logo file supplied.' }, { status: 400 })
  }

  const extension = safeExtension(file.type)

  if (!extension) {
    return NextResponse.json(
      { error: 'Logo must be PNG, JPG, or WEBP.' },
      { status: 400 }
    )
  }

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Logo must be 4 MB or smaller.' },
      { status: 400 }
    )
  }

  const fileName = `${slot}.${extension}`
  const absolutePath = path.join(uploadsDir, fileName)

  for (const existing of fs.readdirSync(uploadsDir)) {
    if (existing.startsWith(`${slot}.`) && existing !== fileName) {
      fs.rmSync(path.join(uploadsDir, existing), { force: true })
    }
  }

  fs.writeFileSync(absolutePath, Buffer.from(await file.arrayBuffer()))

  const config = readConfig()

  config[slot as LogoSlot] = `/api/demo-branding/file?name=${encodeURIComponent(fileName)}`
  config.updatedAt = new Date().toISOString()

  writeConfig(config)

  return NextResponse.json(config)
}

export async function DELETE(request: Request) {
  ensureStorage()

  const body = await request.json().catch(() => ({}))
  const slot = body?.slot

  if (slot !== 'primaryLogo' && slot !== 'secondaryLogo') {
    return NextResponse.json({ error: 'Invalid logo slot.' }, { status: 400 })
  }

  const config = readConfig()
  const current = config[slot as LogoSlot]

  if (current) {
    const match = current.match(/name=([^&]+)/)

    if (match) {
      const fileName = path.basename(decodeURIComponent(match[1]))
      fs.rmSync(path.join(uploadsDir, fileName), { force: true })
    }
  }

  config[slot as LogoSlot] = null
  config.updatedAt = new Date().toISOString()

  writeConfig(config)

  return NextResponse.json(config)
}
