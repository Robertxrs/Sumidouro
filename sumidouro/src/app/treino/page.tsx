'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, CheckCircle2 } from 'lucide-react'

const exercises = [
  { id: 1, name: 'Pular Corda', icon: '🪢', desc: 'Ótimo aquecimento e cardio intenso. Pule em ritmo constante.' },
  { id: 2, name: 'Alpinista', icon: '🏔️', desc: 'Na posição de flexão, traga os joelhos em direção ao peito.' },
  { id: 3, name: 'Bike Ergométrica', icon: '🚲', desc: 'Pedalada em alta intensidade para acelerar a queima calórica.' },
  { id: 4, name: 'Prancha Isométrica', icon: '🪵', desc: 'Apoie-se nos antebraços e pontas dos pés. Contraia muito o abdômen.' },
  { id: 5, name: 'Burpees', icon: '🔥', desc: 'Agache, jogue os pés para trás, volte e dê um salto.' },
  { id: 6, name: 'Elevação de Pernas', icon: '📐', desc: 'Deitado de costas, suba as pernas retas e desça devagar.' }
]

export default function TreinoPage() {
  const [phase, setPhase] = useState<'home' | 'prep' | 'work' | 'rest' | 'done'>('home')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<any>(null)

  const workTime = difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 40 : 50
  const restTime = difficulty === 'beginner' ? 20 : difficulty === 'intermediate' ? 20 : 15
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
    initAudio()
    requestWakeLock()
    setPhase('prep')
    setCurrentExIndex(0)
    setTotalSeconds(0)
    setTimeLeft(prepTime)
    setIsPaused(false)
  }

  // Lógica do Cronômetro
  useEffect(() => {
    if (phase === 'home' || phase === 'done' || isPaused) return
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
      setTotalSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, isPaused])

  // Lógica de Transição de Fases e Bipes
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
  }, [timeLeft, phase, currentExIndex, workTime, restTime])

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

  const activeEx = exercises[currentExIndex]
  const progressPercent = (currentExIndex / exercises.length) * 100

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-slate-900 text-slate-50 font-sans">
      <header className="bg-slate-800 p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-xl font-bold text-emerald-400">Circuito</h1>
        </div>
        <div className="text-sm font-semibold text-slate-400">Rotina Ativa</div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-md mx-auto relative min-h-[100dvh] pb-28 overflow-y-auto">
        {/* TELA INICIAL */}
        {phase === 'home' && (
          <div className="flex flex-col flex-1 p-6 space-y-6">
            <div className="text-center mt-4">
              <h2 className="text-3xl font-bold mb-2">Pronto para suar?</h2>
              <p className="text-slate-400 text-sm">Circuito focado em queima calórica e condicionamento.</p>
            </div>
            
            <div className="bg-slate-800 p-5 rounded-2xl shadow-inner border border-slate-700">
              <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">⚙️ Configuração</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                  <button key={level} onClick={() => setDifficulty(level)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors border-2 ${difficulty === level ? 'bg-emerald-600 border-emerald-400' : 'bg-slate-700 border-transparent hover:bg-slate-600'}`}>
                    {level === 'beginner' ? 'Leve' : level === 'intermediate' ? 'Médio' : 'Intenso'}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 px-1">
                <span>Trabalho: {workTime}s</span>
                <span>Descanso: {restTime}s</span>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl shadow-inner border border-slate-700 flex-1 overflow-y-auto">
              <h3 className="font-semibold text-emerald-400 mb-3 text-sm uppercase tracking-wider">Exercícios ({exercises.length})</h3>
              <ul className="space-y-3">
                {exercises.map(ex => (
                  <li key={ex.id} className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-lg">
                    <span className="text-2xl">{ex.icon}</span>
                    <span className="text-sm font-semibold text-slate-200">{ex.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={startWorkout} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xl font-bold py-4 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)] mt-auto active:scale-95 transition-transform">
              COMEÇAR TREINO
            </button>
          </div>
        )}

        {/* TELA DE TREINO */}
        {(phase === 'prep' || phase === 'work' || phase === 'rest') && (
          <div className="flex flex-col flex-1 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide border ${phase === 'prep' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : phase === 'work' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50'}`}>
                {phase === 'prep' ? 'Prepare-se' : phase === 'work' ? 'Valendo!' : 'Descanso'}
              </div>
              <div className="text-sm font-semibold text-slate-400">
                {currentExIndex + 1} / {exercises.length}
              </div>
            </div>

            <div className="bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
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
                <div className="mt-4 bg-slate-800 p-3 rounded-xl border border-slate-700 animate-fade-in">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">A Seguir</p>
                  <p className="font-semibold text-white">{exercises[currentExIndex + 1].name} {exercises[currentExIndex + 1].icon}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center gap-6 mt-auto pb-4">
              <button onClick={() => skip(-1)} className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700">
                <SkipBack className="w-6 h-6" />
              </button>
              <button onClick={() => setIsPaused(!isPaused)} className={`w-20 h-20 flex items-center justify-center rounded-full text-slate-900 shadow-lg ${isPaused ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}>
                {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
              </button>
              <button onClick={() => skip(1)} className="p-4 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700">
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
            
            <div className="bg-slate-800 w-full p-6 rounded-2xl border border-slate-700 mb-8">
              <p className="text-sm text-slate-400 mb-2">Tempo total:</p>
              <p className="text-4xl font-bold text-white">{formatTime(totalSeconds)}</p>
            </div>

            <button onClick={() => setPhase('home')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-lg font-bold py-4 rounded-2xl active:scale-95 transition-transform">
              Voltar ao Início
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
