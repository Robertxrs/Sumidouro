'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/app/actions'
import { parseTaskInput } from '@/lib/nlpTaskParser'
import { notifyWidgetRefresh } from '@/lib/widget'
import { Plus, X, Calendar, Flag, Hash, Sparkles, FolderPlus, AlignLeft } from 'lucide-react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  lists: any[]
  sections?: any[]
  onTaskCreated: () => void
  defaultListId?: string
  defaultSectionId?: string
}

export default function QuickAddModal({
  isOpen,
  onClose,
  lists,
  sections = [],
  onTaskCreated,
  defaultListId,
  defaultSectionId
}: QuickAddModalProps) {
  const [inputText, setInputText] = useState('')
  const [description, setDescription] = useState('')
  const [showDescField, setShowDescField] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Explicit overrides if user manually changes dropdowns
  const [overrideListId, setOverrideListId] = useState<string>('')
  const [overridePriority, setOverridePriority] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setInputText('')
      setDescription('')
      setShowDescField(false)
      setOverrideListId(defaultListId || '')
      setOverridePriority('')
    }
  }, [isOpen, defaultListId])

  if (!isOpen) return null

  // NLP Parse live
  const parsed = parseTaskInput(inputText, lists, sections)

  const finalPriority = overridePriority || parsed.priority || 'P4'
  const finalListId = overrideListId || parsed.listId || defaultListId || null
  const finalSectionId = parsed.sectionId || defaultSectionId || null
  const finalDueDate = parsed.dueDate || null

  const selectedListObj = lists.find(l => l.id === finalListId)
  const selectedSectionObj = sections.find(s => s.id === finalSectionId)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!parsed.cleanTitle.trim()) return

    setIsSubmitting(true)
    try {
      await createTask({
        title: parsed.cleanTitle.trim(),
        description: description.trim() || undefined,
        priority: finalPriority,
        dueDate: finalDueDate,
        listId: finalListId,
        sectionId: finalSectionId
      })

      notifyWidgetRefresh()
      onTaskCreated()
      onClose()
    } catch (err) {
      console.error('Erro ao criar tarefa rápida:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Adição Rápida de Tarefa
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">Atalho: Q</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Input com NLP */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder='Ex: "Comprar pão amanhã às 18h #Pessoal p1 /A Fazer"'
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base font-medium outline-none"
              autoFocus
            />

            {showDescField ? (
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicionar detalhes ou notas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-slate-700 resize-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowDescField(true)}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 pt-1"
              >
                <AlignLeft className="w-3.5 h-3.5" /> Adicionar descrição...
              </button>
            )}
          </div>

          {/* Badges de Reconhecimento NLP ao Vivo */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/50 min-h-[32px]">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> NLP:
            </span>

            {/* Badge de Data/Hora */}
            {finalDueDate && (
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-900/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <Calendar className="w-3 h-3" />
                {finalDueDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                {parsed.hasTime && ` às ${finalDueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            )}

            {/* Badge de Projeto */}
            {selectedListObj && (
              <span className="text-[11px] font-semibold text-slate-200 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <div className={`w-2 h-2 rounded-full ${selectedListObj.color || 'bg-blue-500'}`} />
                {selectedListObj.name}
              </span>
            )}

            {/* Badge de Seção */}
            {selectedSectionObj && (
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/80 border border-purple-900/60 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-in fade-in">
                /{selectedSectionObj.name}
              </span>
            )}
          </div>

          {/* Seletores manuais rápida */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {/* Lista/Projeto dropdown */}
              <select
                value={finalListId || ''}
                onChange={(e) => setOverrideListId(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl outline-none hover:bg-slate-900 transition-colors"
              >
                <option value="">Sem projeto (#CaixaDeEntrada)</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!parsed.cleanTitle.trim() || isSubmitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Adicionar Tarefa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
