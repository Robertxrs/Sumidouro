import { NextResponse } from 'next/server'
import { getCurrentAndNextBlock, getRoutineBlocks, getCurrentRoutineMode } from '@/lib/routine'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, max-age=0',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET() {
  try {
    const now = new Date()
    const { mode, modeLabel, currentBlock, nextBlock, progress } = getCurrentAndNextBlock(now)
    const blocks = getRoutineBlocks(mode)

    return NextResponse.json(
      {
        mode,
        modeLabel,
        currentBlock,
        nextBlock,
        progress,
        allBlocks: blocks,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar dados da rotina' },
      { status: 500, headers: corsHeaders }
    )
  }
}
