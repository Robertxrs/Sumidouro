'use client'

import { useState } from 'react'
import { toggleTask, updateTask, deleteTask } from '@/app/actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import { CheckCircle2, Circle, Edit3, Trash2, Check, X } from 'lucide-react'

interface TaskItemProps {
  task: any
  lists?: any[]
  onRefresh: () => void
}

export default function TaskItem({ task, lists = [], onRefresh }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [selectedListId, setSelectedListId] = useState<string>(task.listId || '')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async () => {
    await toggleTask(task.id, !task.isCompleted)
    notifyWidgetRefresh()
    onRefresh()
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    await updateTask(task.id, {
      title: editTitle.trim(),
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

  const currentList = lists.find((l) => l.id === task.listId) || task.list

  return (
    <div className="flex items-center gap-3 p-3.5 hover:bg-slate-50 group transition-colors border-b border-gray-100 last:border-0">
      {/* Toggle Conclusão */}
      <button
        onClick={handleToggle}
        className="flex-shrink-0 transition-transform active:scale-95"
        title={task.isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
      >
        {task.isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
        )}
      </button>

      {/* Conteúdo ou Formulário de Edição */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            autoFocus
            className="flex-1 px-3 py-1.5 text-sm border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 bg-white text-slate-800"
          />
          {lists.length > 0 && (
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="text-xs py-1.5 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
            >
              <option value="">Sem lista</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSaveEdit}
            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            title="Salvar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex flex-col min-w-0 pr-2">
            <span
              className={`text-sm font-medium transition-colors ${
                task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
              }`}
            >
              {task.title}
            </span>
            {currentList && (
              <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${currentList.color || 'bg-slate-400'}`}></div>
                {currentList.name}
              </span>
            )}
          </div>

          {/* Ações: Editar e Excluir */}
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditTitle(task.title)
                setSelectedListId(task.listId || '')
                setIsEditing(true)
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar tarefa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Excluir tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
