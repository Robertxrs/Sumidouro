export type BlockTag =
  | 'Treino'
  | 'Foco'
  | 'Trabalho'
  | 'Lazer'
  | 'Descanso'
  | 'Rotina'
  | 'Transição'

export type RoutineMode = 'WORKDAY' | 'DAY_OFF'

export interface RoutineBlock {
  id: string
  startTime: string // "06:30"
  endTime: string   // "06:45"
  title: string
  tag: BlockTag
}

export const WORKDAY_ROUTINE: RoutineBlock[] = [
  { id: 'w1', startTime: '06:30', endTime: '06:45', title: 'Acordar', tag: 'Transição' },
  { id: 'w2', startTime: '06:45', endTime: '07:45', title: 'Exercício Físico', tag: 'Treino' },
  { id: 'w3', startTime: '07:45', endTime: '08:30', title: 'Banho e Café da manhã', tag: 'Rotina' },
  { id: 'w4', startTime: '08:30', endTime: '09:00', title: 'Deslocamento / Preparação', tag: 'Transição' },
  { id: 'w5', startTime: '09:00', endTime: '19:00', title: 'Trabalho', tag: 'Trabalho' },
  { id: 'w6', startTime: '19:00', endTime: '19:45', title: 'Retorno e Jantar', tag: 'Rotina' },
  { id: 'w7', startTime: '19:45', endTime: '21:45', title: 'Projeto Dale', tag: 'Foco' },
  { id: 'w8', startTime: '21:45', endTime: '23:15', title: 'Jogos / Lazer', tag: 'Lazer' },
  { id: 'w9', startTime: '23:15', endTime: '23:30', title: 'Desconectar Telas', tag: 'Transição' },
  { id: 'w10', startTime: '23:30', endTime: '06:30', title: 'Sono', tag: 'Descanso' },
]

export const DAY_OFF_ROUTINE: RoutineBlock[] = [
  { id: 'd1', startTime: '07:30', endTime: '08:30', title: 'Despertar natural e café com calma', tag: 'Rotina' },
  { id: 'd2', startTime: '08:30', endTime: '09:45', title: 'Treino solto (corda/bike)', tag: 'Treino' },
  { id: 'd3', startTime: '09:45', endTime: '11:30', title: 'Tempo offline e descanso', tag: 'Descanso' },
  { id: 'd4', startTime: '11:30', endTime: '13:30', title: 'Almoço', tag: 'Rotina' },
  { id: 'd5', startTime: '13:30', endTime: '17:30', title: 'Deep Work - Projeto Dale', tag: 'Foco' },
  { id: 'd6', startTime: '17:30', endTime: '18:00', title: 'Café da tarde e pausa', tag: 'Transição' },
  { id: 'd7', startTime: '18:00', endTime: '22:30', title: 'Sessão de jogos e lazer', tag: 'Lazer' },
  { id: 'd8', startTime: '22:30', endTime: '23:30', title: 'Jantar leve e reset para terça', tag: 'Transição' },
  { id: 'd9', startTime: '23:30', endTime: '07:30', title: 'Sono', tag: 'Descanso' },
]

export const TAG_CONFIG: Record<
  BlockTag,
  {
    bg: string
    text: string
    border: string
    badgeBg: string
    accentColor: string
  }
> = {
  Treino: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    accentColor: '#10b981',
  },
  Foco: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    accentColor: '#a855f7',
  },
  Trabalho: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    accentColor: '#3b82f6',
  },
  Lazer: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    badgeBg: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    accentColor: '#ec4899',
  },
  Descanso: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    accentColor: '#6366f1',
  },
  Rotina: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    accentColor: '#06b6d4',
  },
  Transição: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    accentColor: '#f59e0b',
  },
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function getCurrentRoutineMode(date = new Date()): RoutineMode {
  // getDay(): 0 = Domingo, 1 = Segunda-feira, 2 = Terça, ..., 6 = Sábado
  return date.getDay() === 1 ? 'DAY_OFF' : 'WORKDAY'
}

export function getRoutineBlocks(mode: RoutineMode): RoutineBlock[] {
  return mode === 'DAY_OFF' ? DAY_OFF_ROUTINE : WORKDAY_ROUTINE
}

export function isTimeInBlock(
  startTime: string,
  endTime: string,
  currentMinutes: number
): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end
  } else {
    // Bloco noturno que vira a noite (ex: 23:30 - 06:30)
    return currentMinutes >= start || currentMinutes < end
  }
}

export function getBlockProgress(
  startTime: string,
  endTime: string,
  currentMinutes: number
): number {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  let cur = currentMinutes
  if (start > end) {
    end += 24 * 60
    if (cur < start) cur += 24 * 60
  }

  const duration = end - start
  if (duration <= 0) return 0
  const elapsed = cur - start
  return Math.min(100, Math.max(0, Math.floor((elapsed / duration) * 100)))
}

export function getCurrentAndNextBlock(
  date = new Date(),
  customMode?: RoutineMode
) {
  const mode = customMode || getCurrentRoutineMode(date)
  const blocks = getRoutineBlocks(mode)

  const currentMinutes = date.getHours() * 60 + date.getMinutes()

  const currentIndex = blocks.findIndex((b) =>
    isTimeInBlock(b.startTime, b.endTime, currentMinutes)
  )

  const currentBlock = currentIndex !== -1 ? blocks[currentIndex] : null
  const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % blocks.length : 0
  const nextBlock = blocks[nextIndex] || null
  const progress = currentBlock
    ? getBlockProgress(currentBlock.startTime, currentBlock.endTime, currentMinutes)
    : 0

  return {
    mode,
    modeLabel: mode === 'DAY_OFF' ? 'Segunda-feira (Folga)' : 'Terça a Domingo (Trabalho)',
    currentBlock,
    nextBlock,
    progress,
  }
}
