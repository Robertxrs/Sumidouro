'use client'

import { useState } from 'react'
import { toggleTask, updateTask, deleteTask, createTask } from '@/app/actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import {
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Flag,
  Tag
} from 'lucide-react'

interface TaskItemProps {
  task: any
  lists?: any[]
  sections?: any[]
  onRefresh: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string; badge: string }> = {
  P1: { color: 'border-red-500 text-red-500', label: 'P1 - Urgente', badge: 'bg-red-950/80 text-red-400 border-red-900/50' },
  P2: { color: 'border-orange-500 text-orange-500', label: 'P2 - Alta', badge: 'bg-orange-950/80 text-orange-400 border-orange-900/50' },
  P3: { color: 'border-blue-500 text-blue-500', label: 'P3 - Média', badge: 'bg-blue-950/80 text-blue-400 border-blue-900/50' },
  P4: { color: 'border-slate-500 text-slate-400', label: 'P4 - Baixa', badge: 'bg-slate-900 text-slate-400 border-slate-800' },
}

export default function TaskItem({
  task,
  lists = [],
  sections = [],
  onRefresh,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description || '')
  const [editPriority, setEditPriority] = useState(task.priority || 'P4')
  const [selectedListId, setSelectedListId] = useState<string>(task.listId || '')
  const [isDeleting, setIsDeleting] = useState(false)

  // Subtasks state
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  // Audio completion effect
  const playCompletionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5 note
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
      priority: editPriority,
      listId: selectedListId || null,
    })
    setIsEditing(false)
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
      priority: task.priority
    })
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
    notifyWidgetRefresh()
    onRefresh()
  }

  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.P4
  const currentList = lists.find((l) => l.id === task.listId) || task.list
  const currentSection = sections.find((s) => s.id === task.sectionId) || task.section
  const subtasksCount = task.subtasks?.length || 0

  return (
    <div className="group border-b border-slate-800/80 last:border-0 transition-colors">
      <div className="flex items-start gap-3 p-3.5 hover:bg-slate-800/60 transition-colors">
        
        {/* Toggle Conclusão com Cor de Prioridade */}
        <button
          onClick={handleToggle}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
          title={`Marcar como concluída - ${pCfg.label}`}
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20 animate-in zoom-in duration-200" />
          ) : (
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${pCfg.color} hover:bg-slate-800`}
            />
          )}
        </button>

        {/* Conteúdo ou Formulário de Edição */}
        {isEditing ? (
          <div className="flex-1 space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="text-xs py-1 px-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-300 outline-none"
                >
                  <option value="P1">🚩 P1 - Urgente</option>
                  <option value="P2">🚩 P2 - Alta</option>
                  <option value="P3">🚩 P3 - Média</option>
                  <option value="P4">🚩 P4 - Baixa</option>
                </select>

                {lists.length > 0 && (
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="text-xs py-1 px-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-300 outline-none"
                  >
                    <option value="">Sem projeto</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-start justify-between min-w-0">
            <div className="flex flex-col min-w-0 pr-2 space-y-1">
              
              {/* Título da Tarefa */}
              <span
                className={`text-sm font-semibold leading-tight transition-colors ${
                  task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                {task.title}
              </span>

              {/* Descrição */}
              {task.description && (
                <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadados: Data, Projeto, Seção, Prioridade */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {task.dueDate && (
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/40">
                    <CalendarIcon className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                )}

                {currentList && (
                  <span className="text-[10px] text-slate-300 font-semibold uppercase flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    <div className={`w-1.5 h-1.5 rounded-full ${currentList.color || 'bg-slate-500'}`} />
                    {currentList.name}
                  </span>
                )}

                {currentSection && (
                  <span className="text-[10px] text-purple-300 font-medium bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-900/40">
                    /{currentSection.name}
                  </span>
                )}

                {task.priority && task.priority !== 'P4' && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${pCfg.badge}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
                  setEditPriority(task.priority || 'P4')
                  setSelectedListId(task.listId || '')
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

      {/* SUBTAREFAS ANINHADAS (SUBTASKS) */}
      {(subtasksCount > 0 || isAddingSubtask) && (
        <div className="ml-8 pl-4 border-l-2 border-slate-800/80 pb-3 space-y-2">
          {subtasksCount > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1 hover:text-slate-200"
              >
                {showSubtasks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>{subtasksCount} subtarefa(s)</span>
              </button>
            </div>
          )}

          {showSubtasks && task.subtasks && (
            <div className="space-y-1">
              {task.subtasks.map((st: any) => (
                <div key={st.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await toggleTask(st.id, !st.isCompleted)
                        onRefresh()
                      }}
                    >
                      {st.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 hover:text-slate-300" />
                      )}
                    </button>
                    <span className={st.isCompleted ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteTask(st.id)
                      onRefresh()
                    }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* FORMULÁRIO DE NOVA SUBTAREFA */}
          {isAddingSubtask && (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Nome da subtarefa..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubtask(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              >
                X
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
