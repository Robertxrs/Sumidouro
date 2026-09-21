import { prisma } from '@/lib/prisma'
import { getCurrentAndNextBlock, TAG_CONFIG } from '@/lib/routine'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WidgetPage() {
  const tasks = await prisma.task.findMany({
    where: { isCompleted: false, isHabit: false },
    orderBy: { createdAt: 'asc' },
    take: 3, // Mostra até 3 tarefas na parte superior
  })

  const { modeLabel, currentBlock, nextBlock } = getCurrentAndNextBlock(new Date())

  return (
    <main className="fixed inset-0 z-50 bg-[#0f172a] p-4 flex flex-col font-sans gap-3 overflow-hidden text-slate-100">
      {/* SEÇÃO SUPERIOR: TAREFAS */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <span>☑️ Tarefas</span>
          </h1>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {tasks.length} pendentes
          </span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-hidden flex-1 justify-start">
          {tasks.length === 0 ? (
            <div className="text-slate-500 text-xs flex h-full items-center justify-center">
              Tudo limpo! ✨
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-800/80 p-2.5 rounded-xl flex items-center gap-2.5 border border-slate-700/60"
              >
                <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 flex-shrink-0"></div>
                <span className="text-xs font-medium text-slate-200 truncate">{task.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SEÇÃO INFERIOR: ROTINA SEMANAL */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            <span>⏰ Rotina</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{modeLabel}</span>
        </div>

        {currentBlock ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white truncate">{currentBlock.title}</span>
              {(() => {
                const tagCfg = TAG_CONFIG[currentBlock.tag]
                return (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagCfg?.badgeBg}`}>
                    {currentBlock.tag}
                  </span>
                )
              })()}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
              {currentBlock.startTime} - {currentBlock.endTime} (Agora)
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Nenhum bloco em andamento</div>
        )}

        {nextBlock && (
          <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800 truncate">
            Próximo: <span className="text-slate-300 font-medium">{nextBlock.startTime} • {nextBlock.title}</span>
          </div>
        )}
      </div>

      {/* Link invisível que cobre toda a tela para abrir o app */}
      <Link href="/dashboard" className="absolute inset-0 z-10" aria-label="Abrir App" />
    </main>
  )
}
