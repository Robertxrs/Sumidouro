'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, CheckCircle2, Settings, X, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'

export interface Exercise {
  id: number
  name: string
  icon: string
  desc: string
}

const DEFAULT_EXERCISES: Exercise[] = [
  { id: 1, name: 'Pular Corda', icon: '🪢', desc: 'Ótimo aquecimento e cardio intenso. Pule em ritmo constante.' },
  { id: 2, name: 'Alpinista', icon: '🏔️', desc: 'Na posição de flexão, traga os joelhos em direção ao peito.' },
  { id: 3, name: 'Bike Ergométrica', icon: '🚲', desc: 'Pedalada em alta intensidade para acelerar a queima calórica.' },
  { id: 4, name: 'Prancha Isométrica', icon: '🪵', desc: 'Apoie-se nos antebraços e pontas dos pés. Contraia muito o abdômen.' },
  { id: 5, name: 'Burpees', icon: '🔥', desc: 'Agache, jogue os pés para trás, volte e dê um salto.' },
  { id: 6, name: 'Elevação de Pernas', icon: '📐', desc: 'Deitado de costas, suba as pernas retas e desça devagar.' }
]

export default function TreinoPage() {
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES)
  const [phase, setPhase] = useState<'home' | 'prep' | 'work' | 'rest' | 'done'>('home')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  
  // Custom Timings State
  const [customTimings, setCustomTimings] = useState({
    beginnerWork: 30,
    beginnerRest: 20,
    intermediateWork: 40,
    intermediateRest: 20,
    advancedWork: 50,
    advancedRest: 15,
  })

  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // New Exercise Form State
  const [newExName, setNewExName] = useState('')
  const [newExIcon, setNewExIcon] = useState('⚡')
  const [newExDesc, setNewExDesc] = useState('')

  // Editing Exercise State
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<any>(null)

  // Load custom settings on mount
  useEffect(() => {
    try {
      const savedEx = localStorage.getItem('sumidouro_workout_exercises')
      if (savedEx) setExercises(JSON.parse(savedEx))

      const savedTimings = localStorage.getItem('sumidouro_workout_timings')
      if (savedTimings) setCustomTimings(JSON.parse(savedTimings))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const workTime = difficulty === 'beginner' 
    ? customTimings.beginnerWork 
    : difficulty === 'intermediate' 
    ? customTimings.intermediateWork 
    : customTimings.advancedWork

  const restTime = difficulty === 'beginner' 
    ? customTimings.beginnerRest 
    : difficulty === 'intermediate' 
    ? customTimings.intermediateRest 
    : customTimings.advancedRest

  const prepTime = 10

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }

  const playBeep = (type: 'normal' | 'high') => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    if (type === 'high') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } else {
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }
  }

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
      }
    } catch (err) {}
  }

  const startWorkout = () => {
    if (exercises.length === 0) {
      alert('Adicione pelo menos 1 exercício para começar!')
      return
    }
    initAudio()
    requestWakeLock()
    setPhase('prep')
    setCurrentExIndex(0)
    setTotalSeconds(0)
    setTimeLeft(prepTime)
    setIsPaused(false)
  }

  // Cronômetro
  useEffect(() => {
    if (phase === 'home' || phase === 'done' || isPaused) return
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
      setTotalSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, isPaused])

  // Transição de Fases e Bipes
  useEffect(() => {
    if (phase === 'home' || phase === 'done') return

    if (timeLeft <= 3 && timeLeft > 0) {
      playBeep('normal')
    } else if (timeLeft < 0) {
      if (phase === 'prep') {
        setPhase('work')
        setTimeLeft(workTime)
        playBeep('high')
      } else if (phase === 'work') {
        if (currentExIndex < exercises.length - 1) {
          setPhase('rest')
          setTimeLeft(restTime)
          playBeep('high')
        } else {
          setPhase('done')
          playBeep('high')
          if (wakeLockRef.current) wakeLockRef.current.release()
        }
      } else if (phase === 'rest') {
        setCurrentExIndex(prev => prev + 1)
        setPhase('work')
        setTimeLeft(workTime)
        playBeep('high')
      }
    }
  }, [timeLeft, phase, currentExIndex, workTime, restTime, exercises.length])

  const skip = (direction: 1 | -1) => {
    if (direction === 1) {
      if (currentExIndex < exercises.length - 1) {
        setCurrentExIndex(prev => prev + 1)
        setPhase('prep')
        setTimeLeft(prepTime)
      } else {
        setPhase('done')
      }
    } else {
      if (phase === 'work' && timeLeft < workTime - 5) {
        setPhase('prep')
        setTimeLeft(prepTime)
      } else if (currentExIndex > 0) {
        setCurrentExIndex(prev => prev - 1)
        setPhase('prep')
        setTimeLeft(prepTime)
      }
    }
    if (isPaused) setIsPaused(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Handlers for Exercise CRUD & Settings
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExName.trim()) return

    const newEx: Exercise = {
      id: Date.now(),
      name: newExName.trim(),
      icon: newExIcon || '💪',
      desc: newExDesc.trim() || 'Exercício personalizado do circuito.',
    }

    const updated = [...exercises, newEx]
    setExercises(updated)
    try {
      localStorage.setItem('sumidouro_workout_exercises', JSON.stringify(updated))
    } catch (e) {}

    setNewExName('')
    setNewExDesc('')
  }

  const handleUpdateExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEx || !editingEx.name.trim()) return

    const updated = exercises.map(ex => ex.id === editingEx.id ? editingEx : ex)
    setExercises(updated)
    try {
      localStorage.setItem('sumidouro_workout_exercises', JSON.stringify(updated))
    } catch (e) {}
    setEditingEx(null)
  }

  const handleDeleteExercise = (id: number) => {
    if (confirm('Deseja remover este exercício do circuito?')) {
      const updated = exercises.filter(ex => ex.id !== id)
      setExercises(updated)
      try {
        localStorage.setItem('sumidouro_workout_exercises', JSON.stringify(updated))
      } catch (e) {}
    }
  }

  const handleResetDefaultExercises = () => {
    if (confirm('Deseja restaurar a lista padrão de exercícios?')) {
      setExercises(DEFAULT_EXERCISES)
      try {
        localStorage.setItem('sumidouro_workout_exercises', JSON.stringify(DEFAULT_EXERCISES))
      } catch (e) {}
    }
  }

  const handleSaveTimings = (newTimings: typeof customTimings) => {
    setCustomTimings(newTimings)
    try {
      localStorage.setItem('sumidouro_workout_timings', JSON.stringify(newTimings))
    } catch (e) {}
  }

  const activeEx = exercises[currentExIndex] || DEFAULT_EXERCISES[0]
  const progressPercent = exercises.length > 0 ? (currentExIndex / exercises.length) * 100 : 0

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-slate-950 text-slate-50 font-sans">
      <header className="bg-slate-900 p-4 shadow-md flex justify-between items-center z-10 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-xl font-bold text-emerald-400">Circuito</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-400">Rotina Ativa</div>
          {phase === 'home' && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="Configurações do Treino"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-md mx-auto relative min-h-[100dvh] pb-28 overflow-y-auto">
        {/* TELA INICIAL */}
        {phase === 'home' && (
          <div className="flex flex-col flex-1 p-6 space-y-6">
            <div className="text-center mt-4">
              <h2 className="text-3xl font-bold mb-2 text-white">Pronto para suar?</h2>
              <p className="text-slate-400 text-sm">Circuito focado em queima calórica e condicionamento.</p>
            </div>
            
            <div className="bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-800">
              <h3 className="font-semibold text-emerald-400 mb-4 flex items-center justify-between">
                <span>⚙️ Configuração</span>
                <span className="text-xs text-slate-400 font-normal">Nível de Intensidade</span>
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button key={level} onClick={() => setDifficulty(level)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors border-2 ${difficulty === level ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-transparent hover:bg-slate-700 text-slate-200'}`}>
                    {level === 'beginner' ? 'Leve' : level === 'intermediate' ? 'Médio' : 'Intenso'}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 px-1 font-mono font-bold">
                <span>Trabalho: {workTime}s</span>
                <span>Descanso: {restTime}s</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl shadow-inner border border-slate-800 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-emerald-400 text-sm uppercase tracking-wider">Exercícios ({exercises.length})</h3>
                <button onClick={() => setIsSettingsOpen(true)} className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Personalizar
                </button>
              </div>
              <ul className="space-y-3">
                {exercises.map(ex => (
                  <li key={ex.id} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-2xl">{ex.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block">{ex.name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{ex.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={startWorkout} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xl font-bold py-4 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)] mt-auto active:scale-95 transition-transform">
              COMEÇAR TREINO
            </button>
          </div>
        )}

        {/* TELA DE TREINO ATIVO */}
        {(phase === 'prep' || phase === 'work' || phase === 'rest') && (
          <div className="flex flex-col flex-1 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide border ${phase === 'prep' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : phase === 'work' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50'}`}>
                {phase === 'prep' ? 'Prepare-se' : phase === 'work' ? 'Valendo!' : 'Descanso'}
              </div>
              <div className="text-sm font-semibold text-slate-400 font-mono">
                {currentExIndex + 1} / {exercises.length}
              </div>
            </div>

            <div className="bg-slate-900 h-2 rounded-full overflow-hidden mb-6 border border-slate-800">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="text-center mb-8 flex-1 flex flex-col justify-center">
              <div className="text-7xl mb-4">{phase === 'rest' ? '😮💨' : activeEx.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{phase === 'rest' ? 'Recupere o fôlego' : activeEx.name}</h2>
              <p className="text-slate-400 text-sm px-4">{phase === 'rest' ? 'Respire fundo.' : activeEx.desc}</p>
            </div>

            <div className="text-center mb-8 relative">
              <div className={`text-9xl font-black tracking-tighter drop-shadow-lg ${timeLeft <= 3 && timeLeft > 0 ? 'animate-pulse text-red-500' : phase === 'prep' ? 'text-amber-400' : phase === 'work' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {timeLeft}
              </div>
              {phase === 'rest' && currentExIndex + 1 < exercises.length && (
                <div className="mt-4 bg-slate-900 p-3 rounded-xl border border-slate-800 animate-fade-in">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">A Seguir</p>
                  <p className="font-semibold text-white">{exercises[currentExIndex + 1].name} {exercises[currentExIndex + 1].icon}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center gap-6 mt-auto pb-4">
              <button onClick={() => skip(-1)} className="p-4 rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">
                <SkipBack className="w-6 h-6" />
              </button>
              <button onClick={() => setIsPaused(!isPaused)} className={`w-20 h-20 flex items-center justify-center rounded-full text-slate-950 shadow-lg ${isPaused ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}>
                {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
              </button>
              <button onClick={() => skip(1)} className="p-4 rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
            
            <button onClick={() => { if(confirm("Encerrar treino?")) { setPhase('home'); setIsPaused(false); } }} className="text-sm text-red-400 hover:text-red-300 mt-4">
              Cancelar Treino
            </button>
          </div>
        )}

        {/* TELA DE CONCLUSÃO */}
        {phase === 'done' && (
          <div className="flex flex-col flex-1 p-6 items-center justify-center text-center">
            <CheckCircle2 className="w-32 h-32 text-emerald-500 mb-6 animate-bounce" />
            <h2 className="text-4xl font-black text-emerald-400 mb-2">Parabéns!</h2>
            <p className="text-xl text-white mb-6">Treino concluído com sucesso.</p>
            
            <div className="bg-slate-900 w-full p-6 rounded-2xl border border-slate-800 mb-8">
              <p className="text-sm text-slate-400 mb-2">Tempo total:</p>
              <p className="text-4xl font-bold text-white font-mono">{formatTime(totalSeconds)}</p>
            </div>

            <button onClick={() => setPhase('home')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-lg font-bold py-4 rounded-2xl active:scale-95 transition-transform">
              Voltar ao Início
            </button>
          </div>
        )}
      </main>

      {/* MODAL DE CONFIGURAÇÕES DO TREINO */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-800 text-white max-h-[85vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Configurar Treino</h3>
                  <p className="text-xs text-slate-400">Personalize a lista de exercícios e tempos</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SEÇÃO 1: AJUSTAR TEMPOS DE TRABALHO E DESCANSO */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ajuste de Tempos (Segundos)</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Nível Leve:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customTimings.beginnerWork}
                      onChange={(e) => handleSaveTimings({ ...customTimings, beginnerWork: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Trabalho (s)"
                    />
                    <input
                      type="number"
                      value={customTimings.beginnerRest}
                      onChange={(e) => handleSaveTimings({ ...customTimings, beginnerRest: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Descanso (s)"
                    />
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Nível Médio:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customTimings.intermediateWork}
                      onChange={(e) => handleSaveTimings({ ...customTimings, intermediateWork: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Trabalho (s)"
                    />
                    <input
                      type="number"
                      value={customTimings.intermediateRest}
                      onChange={(e) => handleSaveTimings({ ...customTimings, intermediateRest: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Descanso (s)"
                    />
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Nível Intenso:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customTimings.advancedWork}
                      onChange={(e) => handleSaveTimings({ ...customTimings, advancedWork: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Trabalho (s)"
                    />
                    <input
                      type="number"
                      value={customTimings.advancedRest}
                      onChange={(e) => handleSaveTimings({ ...customTimings, advancedRest: Number(e.target.value) })}
                      className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                      placeholder="Descanso (s)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ADICIONAR NOVO EXERCÍCIO */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Exercício ao Circuito
              </h4>
              <form onSubmit={handleAddExercise} className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ícone Emoji (ex: 🤸🏻‍♂️)"
                    value={newExIcon}
                    onChange={(e) => setNewExIcon(e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-center text-base"
                  />
                  <input
                    type="text"
                    placeholder="Nome do Exercício (ex: Polichinelos)"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Instrução ou descrição curta"
                  value={newExDesc}
                  onChange={(e) => setNewExDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl transition-colors mt-1"
                >
                  Adicionar Exercício
                </button>
              </form>
            </div>

            {/* SEÇÃO 3: LISTA E EDIÇÃO DE EXERCÍCIOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exercícios Cadastrados ({exercises.length})</h4>
                <button
                  onClick={handleResetDefaultExercises}
                  className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {exercises.map((ex) => (
                  <div key={ex.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    {editingEx?.id === ex.id ? (
                      <form onSubmit={handleUpdateExercise} className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingEx.icon}
                            onChange={(e) => setEditingEx({ ...editingEx, icon: e.target.value })}
                            className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-white"
                          />
                          <input
                            type="text"
                            value={editingEx.name}
                            onChange={(e) => setEditingEx({ ...editingEx, name: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={editingEx.desc}
                          onChange={(e) => setEditingEx({ ...editingEx, desc: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white"
                        />
                        <div className="flex justify-end gap-1">
                          <button type="submit" className="px-2 py-1 bg-emerald-500 text-slate-950 font-bold rounded">Salvar</button>
                          <button type="button" onClick={() => setEditingEx(null)} className="px-2 py-1 bg-slate-800 text-slate-400 rounded">Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-xl flex-shrink-0">{ex.icon}</span>
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{ex.name}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{ex.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditingEx(ex)} className="p-1 text-slate-400 hover:text-white rounded" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteExercise(ex.id)} className="p-1 text-slate-400 hover:text-red-400 rounded" title="Excluir">
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
    </div>
  )
}
