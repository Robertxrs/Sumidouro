import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WidgetPage() {
  const tasks = await prisma.task.findMany({
    where: { isCompleted: false, isHabit: false },
    orderBy: { createdAt: 'asc' },
    take: 4 // Mostra apenas as 4 primeiras para caber bem no widget
  });

  return (
    <main className="fixed inset-0 z-50 bg-[#0f172a] p-4 flex flex-col font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-emerald-400">Sumidouro</h1>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full border border-slate-700">
          {tasks.length} pendentes
        </span>
      </div>
      
      <div className="flex flex-col gap-2 flex-1">
        {tasks.length === 0 ? (
          <div className="text-slate-500 text-sm flex h-full items-center justify-center">
            Tudo limpo!
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-700/50">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
              <span className="text-sm font-medium text-slate-200 truncate">{task.title}</span>
            </div>
          ))
        )}
      </div>

      {/* Link invisível que cobre toda a tela para abrir o app ao clicar */}
      <Link href="/dashboard" className="absolute inset-0 z-10" aria-label="Abrir App" />
    </main>
  );
}
