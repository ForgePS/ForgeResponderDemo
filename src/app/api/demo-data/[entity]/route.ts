import { NextResponse } from 'next/server'

import {
  getForgeDataSource,
  readForgeData,
  resetForgeData,
  writeForgeData
} from '@/utils/forgeDataStore'

type RouteContext = {
  params: Promise<{ entity: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { entity } = await params

  try {
    return NextResponse.json({
      entity,
      source: getForgeDataSource(entity),
      data: readForgeData(entity)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read Forge Responder data.' },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { entity } = await params

  try {
    const data = await request.json()

    return NextResponse.json({
      entity,
      source: 'persistent',
      data: writeForgeData(entity, data)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save Forge Responder data.' },
      { status: 400 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { entity } = await params

  try {
    return NextResponse.json({
      entity,
      source: 'seed',
      data: resetForgeData(entity)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to reset Forge Responder data.' },
      { status: 400 }
    )
  }
}
