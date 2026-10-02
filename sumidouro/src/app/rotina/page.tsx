'use client'

import { useState, useEffect } from 'react'
import {
  RoutineMode,
  RoutineBlock,
  getRoutineBlocks,
  getCurrentRoutineMode,
  getCurrentAndNextBlock,
  getCustomRoutineBlocks,
  saveCustomRoutineBlocks,
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
  Zap,
  Settings,
  X,
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Kanban,
  RotateCcw
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

const TAG_OPTIONS: BlockTag[] = ['Treino', 'Foco', 'Trabalho', 'Lazer', 'Descanso', 'Rotina', 'Transição']

export default function RotinaPage() {
  const [selectedMode, setSelectedMode] = useState<RoutineMode>('WORKDAY')
  const [now, setNow] = useState<Date | null>(null)
  
  // Custom blocks & layout state
  const [blocks, setBlocks] = useState<RoutineBlock[]>([])
  const [layoutStyle, setLayoutStyle] = useState<'timeline' | 'cards' | 'kanban'>('timeline')

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // New Block Form State
  const [newTitle, setNewTitle] = useState('')
  const [newStart, setNewStart] = useState('10:00')
  const [newEnd, setNewEnd] = useState('11:00')
  const [newTag, setNewTag] = useState<BlockTag>('Foco')

  // Editing Block State
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(null)

  useEffect(() => {
    const systemDate = new Date()
    setNow(systemDate)
    const autoMode = getCurrentRoutineMode(systemDate)
    setSelectedMode(autoMode)

    // Load custom layout style
    try {
      const savedLayout = localStorage.getItem('sumidouro_routine_layout')
      if (savedLayout && (savedLayout === 'timeline' || savedLayout === 'cards' || savedLayout === 'kanban')) {
        setLayoutStyle(savedLayout as any)
      }
    } catch (e) {}

    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  // Update blocks whenever selectedMode changes
  useEffect(() => {
    const custom = getCustomRoutineBlocks(selectedMode)
    setBlocks(custom)
  }, [selectedMode])

  const currentDate = now || new Date()
  const systemMode = getCurrentRoutineMode(currentDate)
  const isSelectedModeToday = selectedMode === systemMode

  const { currentBlock, nextBlock, progress } = getCurrentAndNextBlock(currentDate, selectedMode, blocks)

  const formatCurrentTime = (d: Date) => {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getDayName = (d: Date) => {
    const day = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

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

  // Handlers for settings & block CRUD
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newBlock: RoutineBlock = {
      id: 'custom-' + Date.now(),
      title: newTitle.trim(),
      startTime: newStart,
      endTime: newEnd,
      tag: newTag,
    }

    const updated = [...blocks, newBlock]
    setBlocks(updated)
    saveCustomRoutineBlocks(selectedMode, updated)

    setNewTitle('')
  }

  const handleUpdateBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBlock || !editingBlock.title.trim()) return

    const updated = blocks.map(b => b.id === editingBlock.id ? editingBlock : b)
    setBlocks(updated)
    saveCustomRoutineBlocks(selectedMode, updated)
    setEditingBlock(null)
  }

  const handleDeleteBlock = (id: string) => {
    if (confirm('Deseja remover este bloco do cronograma?')) {
      const updated = blocks.filter(b => b.id !== id)
      setBlocks(updated)
      saveCustomRoutineBlocks(selectedMode, updated)
    }
  }

  const handleResetDefault = () => {
    if (confirm('Deseja restaurar o cronograma padrão para este modo?')) {
      const defaultBlocks = getRoutineBlocks(selectedMode)
      setBlocks(defaultBlocks)
      saveCustomRoutineBlocks(selectedMode, defaultBlocks)
    }
  }

  const handleSelectLayout = (layout: 'timeline' | 'cards' | 'kanban') => {
    setLayoutStyle(layout)
    try {
      localStorage.setItem('sumidouro_routine_layout', layout)
    } catch (e) {}
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-12 font-sans">
      {/* HEADER DA TELA COM BOTÃO DE CONFIGURAÇÕES */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
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

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
              <div>
                <div className="text-xs text-slate-400 font-medium">{getDayName(currentDate)}</div>
                <div className="text-lg font-mono font-bold text-white tracking-wider">
                  {formatCurrentTime(currentDate)}
                </div>
              </div>
            </div>

            {/* BOTÃO DE CONFIGURAÇÕES DA ROTINA */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl border border-slate-700 transition-all shadow-md active:scale-95 flex items-center justify-center"
              title="Configurações da Rotina"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ALTERNADOR DE MODO (TABS/TOGGLE) */}
      <div className="mb-8">
        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 shadow-inner">
          <button
            onClick={() => setSelectedMode('WORKDAY')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              selectedMode === 'WORKDAY'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
          <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10">
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

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Progresso</span>
                <span className="text-emerald-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {nextBlock && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-400">A seguir:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                  {nextBlock.startTime} • {nextBlock.title} [{nextBlock.tag}]
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* RENDERIZAÇÃO DINÂMICA DE CRONOGRAMA DE ACORDO COM O LAYOUT */}
      <section className="relative space-y-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Cronograma ({selectedMode === 'WORKDAY' ? 'Terça a Domingo' : 'Segunda-feira'})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800 font-medium">
              {blocks.length} blocos
            </span>
          </div>
        </div>

        {/* 1. VISÃO LINHA DO TEMPO (DEFAULT TIMELINE) */}
        {layoutStyle === 'timeline' && (
          <div className="relative pl-6 md:pl-8 space-y-4 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {blocks.map((block) => {
              const isCurrent = isSelectedModeToday && currentBlock?.id === block.id
              const IconComp = ICON_MAP[block.tag] || Clock
              const tagCfg = TAG_CONFIG[block.tag]

              return (
                <div key={block.id} className="relative flex items-start group">
                  <div
                    className={`absolute -left-6 md:-left-8 top-3.5 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/40 scale-110'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 group-hover:border-slate-600'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>

                  <div
                    className={`w-full ml-2 md:ml-4 p-4 md:p-5 rounded-2xl transition-all duration-200 border ${
                      isCurrent
                        ? 'bg-slate-900 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50 scale-[1.01]'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
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
        )}

        {/* 2. VISÃO GRADE DE CARDS COMPACTOS */}
        {layoutStyle === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocks.map((block) => {
              const isCurrent = isSelectedModeToday && currentBlock?.id === block.id
              const IconComp = ICON_MAP[block.tag] || Clock
              const tagCfg = TAG_CONFIG[block.tag]

              return (
                <div
                  key={block.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-900 border-emerald-500/80 shadow-lg ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tagCfg.badgeBg}`}>
                      {block.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{block.title}</h4>
                      {isCurrent && <span className="text-[10px] text-emerald-400 font-bold uppercase">Bloco Ativo</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 3. VISÃO KANBAN POR TAGS */}
        {layoutStyle === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TAG_OPTIONS.map((tag) => {
              const tagBlocks = blocks.filter(b => b.tag === tag)
              if (tagBlocks.length === 0) return null
              const cfg = TAG_CONFIG[tag]

              return (
                <div key={tag} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badgeBg}`}>
                      {tag}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{tagBlocks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {tagBlocks.map((b) => (
                      <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] font-mono font-bold text-slate-400 mb-1">
                          {b.startTime} - {b.endTime}
                        </div>
                        <div className="text-xs font-bold text-white">{b.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* MODAL DE CONFIGURAÇÕES DA ROTINA */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-800 text-white max-h-[85vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Configurar Rotina & Layout</h3>
                  <p className="text-xs text-slate-400">Personalize blocos, horários e estilo de exibição</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SEÇÃO 1: ESTILO DE LAYOUT DA ROTINA */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estilo de Exibição do Cronograma</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectLayout('timeline')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    layoutStyle === 'timeline'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <List className="w-5 h-5" />
                  <span>Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLayout('cards')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    layoutStyle === 'cards'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span>Grade Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLayout('kanban')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    layoutStyle === 'kanban'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Kanban className="w-5 h-5" />
                  <span>Kanban</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO 2: FORMULÁRIO DE NOVO BLOCO */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Bloco ao Cronograma ({selectedMode === 'WORKDAY' ? 'Terça a Domingo' : 'Segunda-feira'})
              </h4>
              <form onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Título (ex: Meditação, Leitura)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Início (08:00)"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 text-center font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Fim (09:00)"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 text-center font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="sm:col-span-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors mt-1"
                >
                  Salvar Bloco
                </button>
              </form>
            </div>

            {/* SEÇÃO 3: LISTA E EDIÇÃO DE BLOCOS EXISTENTES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocos Atuais ({blocks.length})</h4>
                <button
                  onClick={handleResetDefault}
                  className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Resetar para o padrão
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {blocks.map((b) => (
                  <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    {editingBlock?.id === b.id ? (
                      <form onSubmit={handleUpdateBlock} className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingBlock.title}
                          onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={editingBlock.startTime}
                          onChange={(e) => setEditingBlock({ ...editingBlock, startTime: e.target.value })}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1 py-1 text-xs font-mono text-center text-white"
                        />
                        <input
                          type="text"
                          value={editingBlock.endTime}
                          onChange={(e) => setEditingBlock({ ...editingBlock, endTime: e.target.value })}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1 py-1 text-xs font-mono text-center text-white"
                        />
                        <button type="submit" className="p-1 bg-emerald-500 text-slate-950 rounded font-bold">OK</button>
                        <button type="button" onClick={() => setEditingBlock(null)} className="p-1 bg-slate-800 text-slate-400 rounded">X</button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-slate-300">{b.startTime} - {b.endTime}</span>
                          <span className="font-bold text-white truncate">{b.title}</span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">{b.tag}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingBlock(b)} className="p-1 text-slate-400 hover:text-white rounded" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteBlock(b.id)} className="p-1 text-slate-400 hover:text-red-400 rounded" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Concluir Configurações
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}
