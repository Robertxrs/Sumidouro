'use client'

import { useState, useEffect } from 'react'
import {
  RoutineMode,
  getRoutineBlocks,
  getCurrentRoutineMode,
  getCurrentAndNextBlock,
  TAG_CONFIG,
  BlockTag,
  timeToMinutes,
} from '@/lib/routine'
import {
  Clock,
  Calendar,
  Briefcase,
  Coffee,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Moon,
  ArrowRightLeft,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react'

const ICON_MAP: Record<BlockTag, any> = {
  Treino: Dumbbell,
  Foco: Sparkles,
  Trabalho: Briefcase,
  Lazer: Gamepad2,
  Descanso: Moon,
  Rotina: Coffee,
  Transição: ArrowRightLeft,
}

export default function RotinaPage() {
  const [selectedMode, setSelectedMode] = useState<RoutineMode>('WORKDAY')
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const systemDate = new Date()
    setNow(systemDate)
    const autoMode = getCurrentRoutineMode(systemDate)
    setSelectedMode(autoMode)

    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000) // Atualiza a cada 10 segundos

    return () => clearInterval(timer)
  }, [])

  const currentDate = now || new Date()
  const systemMode = getCurrentRoutineMode(currentDate)
  const isSelectedModeToday = selectedMode === systemMode

  const blocks = getRoutineBlocks(selectedMode)
  const { currentBlock, nextBlock, progress } = getCurrentAndNextBlock(currentDate, selectedMode)

  const formatCurrentTime = (d: Date) => {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getDayName = (d: Date) => {
    const day = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

  // Cálculo de tempo restante no bloco atual em minutos
  const getMinutesRemaining = () => {
    if (!currentBlock) return 0
    const curMinutes = currentDate.getHours() * 60 + currentDate.getMinutes()
    let end = timeToMinutes(currentBlock.endTime)
    if (end < timeToMinutes(currentBlock.startTime)) {
      end += 24 * 60
    }
    let cur = curMinutes
    if (cur < timeToMinutes(currentBlock.startTime) && end > 24 * 60) {
      cur += 24 * 60
    }
    return Math.max(0, end - cur)
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* HEADER DA TELA */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/60 shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Rotina Semanal & Timeline</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Blocos de Tempo
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Organize seu dia com foco e clareza visual.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-3 rounded-2xl border border-slate-700/80 self-start md:self-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <div className="text-xs text-slate-400 font-medium">{getDayName(currentDate)}</div>
              <div className="text-lg font-mono font-bold text-white tracking-wider">
                {formatCurrentTime(currentDate)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ALTERNADOR DE MODO (TABS/TOGGLE) */}
      <div className="mb-8">
        <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 grid grid-cols-2 gap-2 shadow-inner">
          <button
            onClick={() => setSelectedMode('WORKDAY')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              selectedMode === 'WORKDAY'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Terça a Domingo</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/20 font-extrabold">
              Trabalho
            </span>
          </button>

          <button
            onClick={() => setSelectedMode('DAY_OFF')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              selectedMode === 'DAY_OFF'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Segunda-feira</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/20 font-extrabold">
              Folga
            </span>
          </button>
        </div>
      </div>

      {/* CARD DO BLOCO ATUAL (HERO HIGHLIGHT) */}
      {isSelectedModeToday && currentBlock && (
        <section className="mb-10">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl p-6 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10">
            {/* Efeito Glow de Fundo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Bloco Atual Agora
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {currentBlock.startTime} - {currentBlock.endTime}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {currentBlock.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restam {getMinutesRemaining()} minutos neste bloco</span>
                </p>
              </div>

              {(() => {
                const IconComponent = ICON_MAP[currentBlock.tag] || Clock
                const cfg = TAG_CONFIG[currentBlock.tag]
                return (
                  <div className={`p-3.5 rounded-2xl ${cfg.badgeBg} flex-shrink-0 shadow-lg`}>
                    <IconComponent className="w-7 h-7" />
                  </div>
                )
              })()}
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Progresso</span>
                <span className="text-emerald-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-600/50">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Próxima Atividade Teaser */}
            {nextBlock && (
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-400">A seguir:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                  {nextBlock.startTime} • {nextBlock.title} [{nextBlock.tag}]
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TIMELINE VERTICAL */}
      <section className="relative space-y-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Cronograma ({selectedMode === 'WORKDAY' ? 'Terça a Domingo' : 'Segunda-feira'})
          </h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700 font-medium">
            {blocks.length} blocos
          </span>
        </div>

        {/* Linha vertical contínua da timeline */}
        <div className="relative pl-6 md:pl-8 space-y-4 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700/80">
          {blocks.map((block) => {
            const isCurrent = isSelectedModeToday && currentBlock?.id === block.id
            const IconComp = ICON_MAP[block.tag] || Clock
            const tagCfg = TAG_CONFIG[block.tag]

            return (
              <div key={block.id} className="relative flex items-start group">
                {/* Marcador na linha do tempo */}
                <div
                  className={`absolute -left-6 md:-left-8 top-3.5 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/40 scale-110'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:border-slate-500'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>

                {/* Card do Bloco */}
                <div
                  className={`w-full ml-2 md:ml-4 p-4 md:p-5 rounded-2xl transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-slate-800/90 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50 scale-[1.01]'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm md:text-base font-bold text-slate-200 tracking-wide">
                        {block.startTime} - {block.endTime}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 animate-pulse">
                          AGORA
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tagCfg.badgeBg}`}>
                      {block.tag}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-base md:text-lg font-bold ${
                        isCurrent ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {block.title}
                    </h4>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
