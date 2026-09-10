'use client'

import { useState } from 'react'
import { 
  createGroup, 
  createNote, 
  updateGroup, 
  deleteGroup, 
  updateNote, 
  deleteNote 
} from '@/app/notes/actions'
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  X,
  FileText,
  Folder
} from 'lucide-react'

type Note = {
  id: string
  title: string
  content: string | null
  groupId: string | null
  createdAt: Date
  updatedAt: Date
}

type NoteGroup = {
  id: string
  name: string
  color: string
  notes: Note[]
  createdAt: Date
}

interface NotesViewProps {
  groups: NoteGroup[]
  standaloneNotes: Note[]
}

export default function NotesView({ groups, standaloneNotes }: NotesViewProps) {
  // Modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  
  // Edit states
  const [editingGroup, setEditingGroup] = useState<NoteGroup | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Form states
  const [groupName, setGroupName] = useState('')
  const [groupColor, setGroupColor] = useState('bg-red-500')
  
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteGroupId, setNoteGroupId] = useState<string>('')

  // Collapsible groups state (expanded by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    groups.forEach(g => { initial[g.id] = true })
    return initial
  })

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // Handlers for Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    await createGroup(groupName, groupColor)
    setGroupName('')
    setIsGroupModalOpen(false)
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup || !groupName.trim()) return
    await updateGroup(editingGroup.id, groupName)
    setEditingGroup(null)
    setGroupName('')
  }

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo e suas notas?')) {
      await deleteGroup(id)
    }
  }

  // Handlers for Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteTitle.trim()) return
    await createNote(noteTitle, noteContent, noteGroupId || undefined)
    setNoteTitle('')
    setNoteContent('')
    setNoteGroupId('')
    setIsNoteModalOpen(false)
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote || !noteTitle.trim()) return
    await updateNote(editingNote.id, noteTitle, noteContent)
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
  }

  const handleDeleteNote = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNote(id)
    }
  }

  const colorOptions = [
    { label: 'Vermelho', value: 'bg-red-500' },
    { label: 'Azul', value: 'bg-blue-500' },
    { label: 'Verde', value: 'bg-emerald-500' },
    { label: 'Amarelo', value: 'bg-amber-500' },
    { label: 'Roxo', value: 'bg-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            📝 Todas as Notas
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGroupName('')
                setGroupColor('bg-red-500')
                setIsGroupModalOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Grupo +
            </button>
            <button
              onClick={() => {
                setNoteTitle('')
                setNoteContent('')
                setNoteGroupId('')
                setIsNoteModalOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Nova Nota +
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-8">
          {/* Note Groups */}
          {groups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Grupos de Notas
              </h2>
              {groups.map((group) => {
                const isExpanded = expandedGroups[group.id] !== false
                return (
                  <div key={group.id} className="space-y-3">
                    {/* Group Header Card */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleGroupExpand(group.id)}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                          title={isExpanded ? "Recolher grupo" : "Expandir grupo"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <span className={`w-3.5 h-3.5 rounded-full ${group.color || 'bg-red-500'} inline-block`} />
                        <h3 className="font-semibold text-slate-800 text-base">
                          {group.name}
                        </h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {group.notes.length} {group.notes.length === 1 ? 'nota' : 'notas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingGroup(group)
                            setGroupName(group.name)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar nome do grupo"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Group Notes (Recessed/Indented) */}
                    {isExpanded && (
                      <div className="ml-6 pl-4 border-l-2 border-slate-200">
                        {group.notes.length === 0 ? (
                          <div className="bg-white/60 border border-dashed border-slate-200 rounded-xl p-4 text-slate-400 text-sm italic">
                            Nenhuma nota neste grupo ainda.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-4">
                            {group.notes.map((note) => (
                              <div
                                key={note.id}
                                className="bg-white border border-slate-200 rounded-xl p-4 w-64 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">
                                      {note.title}
                                    </h4>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingNote(note)
                                          setNoteTitle(note.title)
                                          setNoteContent(note.content || '')
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                        title="Editar nota"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                                        title="Excluir nota"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  {note.content && (
                                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap">
                                      {note.content}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                  <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                                  <FileText className="w-3 h-3 text-slate-300" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Standalone Notes Section */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Notas Sem Grupo ({standaloneNotes.length})
            </h2>
            {standaloneNotes.length === 0 && groups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <Folder className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-700 font-medium mb-1">Nenhuma nota cadastrada</h3>
                <p className="text-slate-400 text-sm mb-4">Comece criando um grupo ou adicionando uma nova nota.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsGroupModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg"
                  >
                    Novo Grupo +
                  </button>
                  <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg"
                  >
                    Nova Nota +
                  </button>
                </div>
              </div>
            ) : standaloneNotes.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-slate-200 rounded-xl p-4 text-slate-400 text-sm italic">
                Todas as notas estão organizadas em grupos.
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {standaloneNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 w-64 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">
                          {note.title}
                        </h4>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingNote(note)
                              setNoteTitle(note.title)
                              setNoteContent(note.content || '')
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="Editar nota"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Excluir nota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {note.content && (
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                      <FileText className="w-3 h-3 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Criar Novo Grupo</h3>
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Trabalho, Pessoal, Estudos..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Cor do Indicador
                </label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGroupColor(opt.value)}
                      className={`w-7 h-7 rounded-full ${opt.value} transition-transform ${
                        groupColor === opt.value ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Group */}
      {editingGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Editar Grupo</h3>
              <button 
                onClick={() => setEditingGroup(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Atualizar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Note */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Criar Nova Nota</h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Título da Nota *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de alinhamento"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Grupo (Opcional)
                </label>
                <select
                  value={noteGroupId}
                  onChange={(e) => setNoteGroupId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white"
                >
                  <option value="">Nenhum grupo (Nota Solta)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Conteúdo (Opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva os detalhes da nota aqui..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Note */}
      {editingNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Editar Nota</h3>
              <button 
                onClick={() => setEditingNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Título da Nota
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Conteúdo
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Atualizar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
