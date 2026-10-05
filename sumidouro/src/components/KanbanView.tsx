'use client'

import { useState } from 'react'
import TaskItem from './TaskItem'
import { updateTask, createSection, updateSection, deleteSection, createTask } from '@/app/actions'
import { Plus, Trash2, Layers, Flag } from 'lucide-react'

interface KanbanViewProps {
  tasks: any[]
  sections: any[]
  lists: any[]
  currentListId?: string
  onRefresh: () => void
}

export default function KanbanView({
  tasks,
  sections,
  lists,
  currentListId,
  onRefresh
}: KanbanViewProps) {
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionName.trim()) return
    await createSection(newSectionName.trim(), currentListId || null)
    setNewSectionName('')
    setIsAddingSection(false)
    onRefresh()
  }

  const handleUpdateSection = async (sectionId: string) => {
    if (!editingSectionName.trim()) return
    await updateSection(sectionId, editingSectionName.trim())
    setEditingSectionId(null)
    setEditingSectionName('')
    onRefresh()
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta seção? As tarefas nela não serão apagadas, mas ficarão sem seção.')) {
      await deleteSection(sectionId)
      onRefresh()
    }
  }

  const handleQuickTaskInSection = async (sectionId: string | null, title: string) => {
    if (!title.trim()) return
    await createTask({
      title: title.trim(),
      listId: currentListId || null,
      sectionId
    })
    onRefresh()
  }

  const handleDropOnColumn = async (targetSectionId: string | null, e?: React.DragEvent) => {
    const taskId = e?.dataTransfer?.getData('text/plain') || draggedTaskId
    if (!taskId) return
    await updateTask(taskId, { sectionId: targetSectionId })
    setDraggedTaskId(null)
    onRefresh()
  }

  // Prepara as colunas: 'Sem Seção' + seções existentes
  const columns = [
    { id: null, name: 'Sem Seção', isDefault: true },
    ...sections.map(s => ({ id: s.id, name: s.name, isDefault: false }))
  ]

  return (
    <div className="space-y-4">
      {/* Botão e Gerenciador de Seções (funciona na Caixa de Entrada e nos Projetos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/70 p-3 sm:p-4 rounded-2xl border border-slate-800/80 gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>
            {currentListId ? 'Seções do Projeto' : 'Seções da Caixa de Entrada'} ({sections.length})
          </span>
        </div>

        {isAddingSection ? (
          <form onSubmit={handleAddSection} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Nome da Seção (ex: Prioridades, A Fazer)..."
              className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-white outline-none focus:border-purple-500 w-full sm:w-auto"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
              >
                Criar Seção
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 bg-purple-950/60 border border-purple-900/60 px-3 py-1.5 rounded-xl hover:bg-purple-900/50 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Nova Seção
          </button>
        )}
      </div>

      {/* Kanban Columns Overflow Horizontal Container com Snap no Mobile */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start snap-x snap-mandatory sm:snap-none scrollbar-thin">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => (t.sectionId || null) === col.id)
          const isEditingThisCol = editingSectionId === col.id

          return (
            <div
              key={col.id || 'default'}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnColumn(col.id, e)}
              className="w-[85vw] sm:w-80 flex-shrink-0 snap-center bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col max-h-[75vh]"
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-800/80">
                {isEditingThisCol ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      className="bg-slate-950 border border-purple-500 text-xs px-2 py-1 rounded text-white outline-none w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateSection(col.id!)
                        if (e.key === 'Escape') setEditingSectionId(null)
                      }}
                    />
                    <button
                      onClick={() => handleUpdateSection(col.id!)}
                      className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-bold"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-bold text-slate-100 truncate">
                        {col.name}
                      </span>
                      <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-800">
                        {colTasks.length}
                      </span>
                    </div>

                    {!col.isDefault && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSectionId(col.id!)
                            setEditingSectionName(col.name)
                          }}
                          className="text-slate-500 hover:text-purple-400 p-1 rounded-lg transition-colors text-xs"
                          title="Renomear seção"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteSection(col.id!)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors"
                          title="Excluir seção"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Lista de Tarefas da Coluna */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium text-center p-2">
                    Arraste tarefas para cá ou adicione abaixo
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task.id)}
                      className="cursor-grab active:cursor-grabbing rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                    >
                      <TaskItem
                        task={task}
                        lists={lists}
                        sections={sections}
                        onRefresh={onRefresh}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Botão Rápido de Criar na Coluna */}
              <QuickTaskInColumnInput
                onAdd={(title) => handleQuickTaskInSection(col.id, title)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuickTaskInColumnInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-2 py-2 px-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium border border-dashed border-slate-800"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Título da tarefa..."
        className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-white outline-none focus:border-blue-500"
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-400 hover:text-white px-2 py-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded-lg font-semibold"
        >
          Adicionar
        </button>
      </div>
    </form>
  )
}
