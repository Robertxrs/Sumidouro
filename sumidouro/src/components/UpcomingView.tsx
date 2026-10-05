'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Sparkles, AlertTriangle, ArrowDown, Plus } from 'lucide-react'
import TaskItem from './TaskItem'
import { setTaskDueDate } from '@/app/actions'
import { notifyWidgetRefresh } from '@/lib/widget'

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
  // Drag over tracking
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [isProcessingDrop, setIsProcessingDrop] = useState(false)
  const [extraCustomDates, setExtraCustomDates] = useState<string[]>([])
  const [selectedCustomDateInput, setSelectedCustomDateInput] = useState('')

  // Normaliza o início do dia de hoje (00:00:00)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(today.getDate() + 2)

  // Tarefas Atrasadas (data anterior a hoje)
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.isCompleted) return false
    const taskDate = new Date(t.dueDate)
    taskDate.setHours(0, 0, 0, 0)
    return taskDate.getTime() < today.getTime()
  })

  // Encontrar todas as outras datas com tarefas agendadas (após amanhã)
  const customDateKeysSet = new Set<string>(extraCustomDates)

  tasks.forEach((t) => {
    if (!t.dueDate) return
    const taskDate = new Date(t.dueDate)
    taskDate.setHours(0, 0, 0, 0)
    if (taskDate.getTime() >= dayAfterTomorrow.getTime()) {
      const year = taskDate.getFullYear()
      const month = String(taskDate.getMonth() + 1).padStart(2, '0')
      const day = String(taskDate.getDate()).padStart(2, '0')
      customDateKeysSet.add(`${year}-${month}-${day}`)
    }
  })

  // Ordena as outras datas cronologicamente
  const sortedCustomDateKeys = Array.from(customDateKeysSet).sort()

  // Constrói a lista de dias: Sempre Hoje, Sempre Amanhã, e os dias com tarefas marcadas
  const daysList: Array<{ date: Date; key: string; label: string; weekday: string; isToday: boolean; isTomorrow: boolean; tasks: any[] }> = []

  // 1. Hoje
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0)
  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    const td = new Date(t.dueDate)
    return (
      td.getFullYear() === today.getFullYear() &&
      td.getMonth() === today.getMonth() &&
      td.getDate() === today.getDate()
    )
  })
  daysList.push({
    date: todayDate,
    key: `day-today-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`,
    label: `Hoje • ${todayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
    weekday: 'Hoje',
    isToday: true,
    isTomorrow: false,
    tasks: todayTasks,
  })

  // 2. Amanhã
  const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0, 0)
  const tomorrowTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    const td = new Date(t.dueDate)
    return (
      td.getFullYear() === tomorrow.getFullYear() &&
      td.getMonth() === tomorrow.getMonth() &&
      td.getDate() === tomorrow.getDate()
    )
  })
  daysList.push({
    date: tomorrowDate,
    key: `day-tomorrow-${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`,
    label: `Amanhã • ${tomorrowDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
    weekday: 'Amanhã',
    isToday: false,
    isTomorrow: true,
    tasks: tomorrowTasks,
  })

  // 3. Dias com tarefas agendadas (ex: quinta-feira, 08/10)
  sortedCustomDateKeys.forEach((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const specificDate = new Date(y, m - 1, d, 12, 0, 0)

    const weekday = specificDate.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dayMonth = specificDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const label = `${weekday}, ${dayMonth}`

    const dayTasks = tasks.filter((t) => {
      if (!t.dueDate) return false
      const td = new Date(t.dueDate)
      return (
        td.getFullYear() === y &&
        td.getMonth() === m - 1 &&
        td.getDate() === d
      )
    })

    daysList.push({
      date: specificDate,
      key: `day-custom-${dateStr}`,
      label,
      weekday,
      isToday: false,
      isTomorrow: false,
      tasks: dayTasks,
    })
  })

  // Tarefas sem data definida
  const noDateTasks = tasks.filter((t) => !t.dueDate)

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId)
    }
  }

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (dragOverTarget === targetId) {
      setDragOverTarget(null)
    }
  }

  const handleDropOnDay = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    setDragOverTarget(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    setIsProcessingDrop(true)
    try {
      await setTaskDueDate(taskId, targetDate)
      notifyWidgetRefresh()
      onRefresh()
    } catch (err) {
      console.error('Erro ao mover tarefa para data:', err)
    } finally {
      setIsProcessingDrop(false)
    }
  }

  const handleDropOnNoDate = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverTarget(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    setIsProcessingDrop(true)
    try {
      await setTaskDueDate(taskId, null)
      notifyWidgetRefresh()
      onRefresh()
    } catch (err) {
      console.error('Erro ao remover data da tarefa:', err)
    } finally {
      setIsProcessingDrop(false)
    }
  }

  const handleQuickAssign = async (taskId: string, targetDate: Date | null) => {
    await setTaskDueDate(taskId, targetDate)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleAddCustomDate = () => {
    if (!selectedCustomDateInput) return
    if (!extraCustomDates.includes(selectedCustomDateInput)) {
      setExtraCustomDates([...extraCustomDates, selectedCustomDateInput])
    }
    setSelectedCustomDateInput('')
  }

  return (
    <div className="space-y-6">
      
      {/* Banner Informativo */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            Exibindo <strong>Hoje</strong>, <strong>Amanhã</strong> e os dias com tarefas agendadas. Arraste para o dia desejado.
          </span>
        </div>

        {/* Input para Abrir/Planejar Outra Data */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="date"
            value={selectedCustomDateInput}
            onChange={(e) => setSelectedCustomDateInput(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-purple-500"
          />
          <button
            onClick={handleAddCustomDate}
            disabled={!selectedCustomDateInput}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Dia
          </button>
        </div>
      </div>

      {/* Tarefas Atrasadas (se houver) */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-950/30 rounded-2xl border border-red-900/50 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Tarefas Atrasadas
            </h3>
            <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2.5 py-0.5 rounded-full font-bold">
              {overdueTasks.length}
            </span>
          </div>

          <div className="divide-y divide-red-900/30">
            {overdueTasks.map((task) => (
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

      {/* Lista de Dias Ativos (Hoje, Amanhã e Dias com Tarefas) */}
      <div className="space-y-4">
        {daysList.map((day) => {
          const isOver = dragOverTarget === day.key

          return (
            <div
              key={day.key}
              onDragOver={(e) => handleDragOver(e, day.key)}
              onDragLeave={(e) => handleDragLeave(e, day.key)}
              onDrop={(e) => handleDropOnDay(e, day.date)}
              className={`rounded-2xl border p-4 shadow-lg transition-all ${
                isOver
                  ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/50 scale-[1.01]'
                  : day.isToday
                  ? 'bg-slate-900 border-amber-900/50'
                  : day.isTomorrow
                  ? 'bg-slate-900 border-blue-900/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-sm font-bold capitalize flex items-center gap-2 text-white">
                  <CalendarIcon
                    className={`w-4 h-4 ${
                      day.isToday ? 'text-amber-400' : day.isTomorrow ? 'text-blue-400' : 'text-purple-400'
                    }`}
                  />
                  <span>{day.label}</span>
                </h3>

                <div className="flex items-center gap-2">
                  {isOver && (
                    <span className="text-[11px] font-bold text-purple-400 animate-pulse flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" /> Solte aqui
                    </span>
                  )}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      day.isToday
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        : day.isTomorrow
                        ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                        : 'bg-slate-950 text-purple-300 border-purple-900/50'
                    }`}
                  >
                    {day.tasks.length}
                  </span>
                </div>
              </div>

              {day.tasks.length === 0 ? (
                <div
                  className={`text-xs italic py-3 px-2 rounded-xl text-center transition-colors ${
                    isOver
                      ? 'bg-purple-900/20 text-purple-300 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {isOver
                    ? 'Solte a tarefa para agendá-la para este dia!'
                    : 'Nenhuma tarefa para este dia. Arraste uma tarefa aqui para agendar.'}
                </div>
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
          )
        })}
      </div>

      {/* Seção: Tarefas Sem Data Agendada */}
      <div
        onDragOver={(e) => handleDragOver(e, 'no-date')}
        onDragLeave={(e) => handleDragLeave(e, 'no-date')}
        onDrop={handleDropOnNoDate}
        className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
          dragOverTarget === 'no-date'
            ? 'border-slate-500 bg-slate-900/90 ring-2 ring-slate-600/50'
            : 'bg-slate-900/70 border-slate-800/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" />
              Tarefas Sem Data Definida
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Arraste para um dos dias acima ou use os botões rápidos para agendar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {dragOverTarget === 'no-date' && (
              <span className="text-[11px] font-bold text-slate-300 animate-pulse flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> Solte para remover data
              </span>
            )}
            <span className="text-xs bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-full font-bold">
              {noDateTasks.length}
            </span>
          </div>
        </div>

        {noDateTasks.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            Excelente! Todas as suas tarefas estão agendadas com datas definidas.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60 mt-1">
            {noDateTasks.map((task) => (
              <div key={task.id} className="relative group/row">
                <TaskItem
                  task={task}
                  lists={lists}
                  sections={sections}
                  onRefresh={onRefresh}
                />

                {/* Ações Rápidas de Agendamento Touch/Mobile */}
                <div className="hidden group-hover/row:flex sm:flex items-center gap-1.5 absolute right-24 top-3 text-[10px]">
                  <button
                    onClick={() => {
                      const d = new Date()
                      d.setHours(12, 0, 0, 0)
                      handleQuickAssign(task.id, d)
                    }}
                    className="px-2 py-0.5 bg-amber-950/70 hover:bg-amber-900 text-amber-400 border border-amber-800/50 rounded-md font-medium transition-colors"
                    title="Alocar para Hoje"
                  >
                    + Hoje
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() + 1)
                      d.setHours(12, 0, 0, 0)
                      handleQuickAssign(task.id, d)
                    }}
                    className="px-2 py-0.5 bg-blue-950/70 hover:bg-blue-900 text-blue-400 border border-blue-800/50 rounded-md font-medium transition-colors"
                    title="Alocar para Amanhã"
                  >
                    + Amanhã
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
