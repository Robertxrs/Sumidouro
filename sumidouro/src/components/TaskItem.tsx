'use client'

import { useState, useRef, useEffect } from 'react'
import { toggleTask, updateTask, deleteTask, createTask, setTaskDueDate } from '@/app/actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import {
  CheckCircle2,
  Edit3,
  Trash2,
  Check,
  X,
  Plus,
  Calendar as CalendarIcon,
  Layers,
  GripVertical,
  Clock
} from 'lucide-react'

interface TaskItemProps {
  task: any
  lists?: any[]
  sections?: any[]
  onRefresh: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isDraggable?: boolean
}

const formatDateForInput = (d?: Date | string | null) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TaskItem({
  task,
  lists = [],
  sections = [],
  onRefresh,
  isDraggable = true,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description || '')
  const [selectedListId, setSelectedListId] = useState<string>(task.listId || '')
  const [selectedSectionId, setSelectedSectionId] = useState<string>(task.sectionId || '')
  const [editDueDate, setEditDueDate] = useState<string>(formatDateForInput(task.dueDate))
  const [isDeleting, setIsDeleting] = useState(false)

  // Date picker popover state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Section quick selector state
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false)
  const sectionPickerRef = useRef<HTMLDivElement>(null)

  // Subtasks state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
      if (sectionPickerRef.current && !sectionPickerRef.current.contains(event.target as Node)) {
        setIsSectionPickerOpen(false)
      }
    }
    if (isDatePickerOpen || isSectionPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDatePickerOpen, isSectionPickerOpen])

  // Audio completion effect
  const playCompletionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch (e) {}
  }

  const handleToggle = async () => {
    if (!task.isCompleted) {
      playCompletionSound()
    }
    await toggleTask(task.id, !task.isCompleted)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    await updateTask(task.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      listId: selectedListId || null,
      sectionId: selectedSectionId || null,
      dueDate: editDueDate ? new Date(editDueDate + 'T12:00:00') : null,
    })
    setIsEditing(false)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleQuickSchedule = async (targetDate: Date | null) => {
    await setTaskDueDate(task.id, targetDate)
    setIsDatePickerOpen(false)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleQuickMoveSection = async (sectionId: string | null) => {
    await updateTask(task.id, { sectionId })
    setIsSectionPickerOpen(false)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteTask(task.id)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    await createTask({
      title: newSubtaskTitle.trim(),
      parentId: task.id,
      listId: task.listId,
    })
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
    notifyWidgetRefresh()
    onRefresh()
  }

  const currentList = lists.find((l) => l.id === task.listId) || task.list
  const currentSection = sections.find((s) => s.id === task.sectionId) || task.section

  return (
    <div
      draggable={isDraggable && !isEditing}
      onDragStart={(e) => {
        setIsDragging(true)
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }))
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`group border-b border-slate-800/80 last:border-0 transition-all ${
        isDatePickerOpen || isSectionPickerOpen ? 'relative z-50' : 'relative z-0'
      } ${isDragging ? 'opacity-40 bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 transition-colors">
        
        {/* Grip Icon for Drag & Drop */}
        {isDraggable && !isEditing && (
          <div
            className="hidden sm:flex text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing mt-1 flex-shrink-0"
            title="Arraste para agendar ou mover para uma seção"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Toggle Conclusão Simples e Moderno (sem P1..P4) */}
        <button
          onClick={handleToggle}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
          title="Marcar como concluída"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20 animate-in zoom-in duration-200" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-blue-400 hover:bg-slate-800 transition-all flex items-center justify-center" />
          )}
        </button>

        {/* Conteúdo ou Formulário de Edição */}
        {isEditing ? (
          <div className="flex-1 space-y-3 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 w-full min-w-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-800 rounded-lg outline-none focus:border-blue-500 bg-slate-900 text-slate-100 font-semibold"
              placeholder="Título da tarefa"
              autoFocus
            />
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-800 rounded-lg outline-none focus:border-blue-500 bg-slate-900 text-slate-300 resize-none"
              placeholder="Descrição ou observações..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              {/* Data de Vencimento */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Data</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-300 outline-none text-xs"
                />
              </div>

              {/* Projeto */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Projeto</label>
                <select
                  value={selectedListId}
                  onChange={(e) => {
                    setSelectedListId(e.target.value)
                    setSelectedSectionId('')
                  }}
                  className="w-full py-1.5 px-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-300 outline-none"
                >
                  <option value="">📥 Caixa de Entrada</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      #{l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Seção</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-300 outline-none"
                >
                  <option value="">Sem seção</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      /{s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium leading-relaxed truncate transition-all ${
                    task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {task.description && (
                <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Metadados: Data, Projeto, Seção */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 relative">
                
                {/* Botão de Agendamento Rápido de Data com Popover Sobreposto */}
                <div className="relative" ref={datePickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className={`text-[10px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all ${
                      task.dueDate
                        ? 'text-amber-400 bg-amber-950/70 border-amber-800/70 hover:bg-amber-900/60'
                        : 'text-slate-400 bg-slate-900/80 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Clique para agendar ou alterar data"
                  >
                    <CalendarIcon className="w-3 h-3 text-amber-400" />
                    {task.dueDate ? (
                      <span className="font-semibold">
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    ) : (
                      <span>+ Data</span>
                    )}
                  </button>

                  {/* Popover de Seleção Rápida de Data com Alta Elevação */}
                  {isDatePickerOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-2 z-[9999] w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95"
                    >
                      <div className="text-[11px] font-bold text-slate-300 px-1 uppercase tracking-wider flex items-center justify-between">
                        <span>Agendar Tarefa</span>
                        {task.dueDate && (
                          <button
                            type="button"
                            onClick={() => handleQuickSchedule(null)}
                            className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setHours(12, 0, 0, 0)
                            handleQuickSchedule(d)
                          }}
                          className="text-left px-2.5 py-2 text-xs text-amber-400 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 rounded-xl flex flex-col transition-colors"
                        >
                          <span className="font-bold flex items-center gap-1">☀️ Hoje</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setDate(d.getDate() + 1)
                            d.setHours(12, 0, 0, 0)
                            handleQuickSchedule(d)
                          }}
                          className="text-left px-2.5 py-2 text-xs text-blue-400 bg-slate-950 hover:bg-blue-950/60 border border-slate-800 rounded-xl flex flex-col transition-colors"
                        >
                          <span className="font-bold flex items-center gap-1">🌅 Amanhã</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(Date.now() + 86400000).toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                          Escolher data no calendário:
                        </label>
                        <input
                          type="date"
                          defaultValue={formatDateForInput(task.dueDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleQuickSchedule(new Date(e.target.value + 'T12:00:00'))
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Projeto */}
                {currentList && (
                  <span className="text-[10px] text-slate-300 font-semibold uppercase flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    <div className={`w-1.5 h-1.5 rounded-full ${currentList.color || 'bg-slate-500'}`} />
                    {currentList.name}
                  </span>
                )}

                {/* Seção com Popover Rápido de Mudança de Seção */}
                {sections.length > 0 && (
                  <div className="relative" ref={sectionPickerRef}>
                    <button
                      type="button"
                      onClick={() => setIsSectionPickerOpen(!isSectionPickerOpen)}
                      className={`text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all ${
                        currentSection
                          ? 'text-purple-300 bg-purple-950/60 border-purple-900/40 hover:bg-purple-900/50'
                          : 'text-slate-400 bg-slate-900/80 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Mover tarefa para outra seção"
                    >
                      <Layers className="w-2.5 h-2.5 text-purple-400" />
                      <span>{currentSection ? currentSection.name : '+ Seção'}</span>
                    </button>

                    {isSectionPickerOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full mt-2 z-[9999] w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95"
                      >
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                          Mover para Seção
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickMoveSection(null)}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded-xl transition-colors ${
                            !task.sectionId
                              ? 'bg-purple-950/60 text-purple-300 font-bold'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          Sem Seção
                        </button>
                        {sections.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleQuickMoveSection(s.id)}
                            className={`w-full text-left px-2 py-1.5 text-xs rounded-xl transition-colors truncate ${
                              task.sectionId === s.id
                                ? 'bg-purple-950/60 text-purple-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            /{s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-1 self-end sm:self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Adicionar subtarefa"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditTitle(task.title)
                  setEditDesc(task.description || '')
                  setSelectedListId(task.listId || '')
                  setSelectedSectionId(task.sectionId || '')
                  setEditDueDate(formatDateForInput(task.dueDate))
                  setIsEditing(true)
                }}
                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Editar tarefa"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                title="Excluir tarefa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Formulário de Adicionar Subtarefa Inline */}
      {isAddingSubtask && (
        <form onSubmit={handleAddSubtask} className="px-4 pb-3 pl-12 flex gap-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Nova subtarefa..."
            className="flex-1 px-3 py-1 text-xs border border-slate-800 rounded-lg outline-none focus:border-blue-500 bg-slate-950 text-slate-200"
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => setIsAddingSubtask(false)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Subtarefas */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="pl-10 pr-4 pb-3 space-y-1.5 border-t border-slate-800/40 pt-2">
          {task.subtasks.map((sub: any) => (
            <div key={sub.id} className="flex items-center gap-2 text-xs group/sub">
              <button
                onClick={async () => {
                  await toggleTask(sub.id, !sub.isCompleted)
                  notifyWidgetRefresh()
                  onRefresh()
                }}
                className="flex-shrink-0"
              >
                {sub.isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 hover:border-blue-400" />
                )}
              </button>
              <span
                className={`flex-1 truncate ${
                  sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'
                }`}
              >
                {sub.title}
              </span>
              <button
                onClick={async () => {
                  await deleteTask(sub.id)
                  notifyWidgetRefresh()
                  onRefresh()
                }}
                className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
