'use client'

import { Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import TaskItem from './TaskItem'

interface UpcomingViewProps {
  tasks: any[]
  lists: any[]
  sections: any[]
  onRefresh: () => void
}

export default function UpcomingView({
  tasks,
  lists,
  sections,
  onRefresh
}: UpcomingViewProps) {
  // Gera os próximos 7 dias a partir de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysList: Array<{ date: Date; label: string; tasks: any[] }> = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)

    let label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
    if (i === 0) label = `Hoje • ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    if (i === 1) label = `Amanhã • ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

    const dayTasks = tasks.filter((t) => {
      if (!t.dueDate) return false
      const taskDate = new Date(t.dueDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === d.getTime()
    })

    daysList.push({ date: d, label, tasks: dayTasks })
  }

  // Tarefas sem data definida
  const noDateTasks = tasks.filter((t) => !t.dueDate)

  return (
    <div className="space-y-6">
      {daysList.map((day, idx) => (
        <div key={idx} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-100 capitalize flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              {day.label}
            </h3>
            <span className="text-xs bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
              {day.tasks.length}
            </span>
          </div>

          {day.tasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 px-1">
              Nenhuma tarefa agendada para este dia.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {day.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  lists={lists}
                  sections={sections}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Tarefas Sem Data */}
      {noDateTasks.length > 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              Sem Data Agendada
            </h3>
            <span className="text-xs bg-slate-950 text-slate-500 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
              {noDateTasks.length}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {noDateTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                lists={lists}
                sections={sections}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
