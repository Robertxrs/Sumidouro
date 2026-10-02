'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  createGroup, 
  createNote, 
  updateGroup, 
  deleteGroup, 
  updateNote, 
  deleteNote,
  getTopicMessages,
  sendTopicMessage,
  generateTopicSummary,
  generateStudyGuide
} from '@/app/notes/actions'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  FileText,
  Folder,
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  Headphones,
  BookOpen,
  Layers,
  ArrowLeft
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

type ChatMsg = {
  id: string
  role: string
  content: string
  createdAt: Date
}

interface NotesViewProps {
  groups: NoteGroup[]
  standaloneNotes: Note[]
}

export default function NotesView({ groups, standaloneNotes }: NotesViewProps) {
  // Selected Topic (Group) ID for NotebookLM view
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '')

  // View mode inside Topic: 'notes' (Fontes e Notas) | 'chat' (Conversa IA NotebookLM)
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes')

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<NoteGroup | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Form states
  const [groupName, setGroupName] = useState('')
  const [groupColor, setGroupColor] = useState('bg-blue-500')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0]

  // Fetch messages when topic changes
  useEffect(() => {
    if (selectedGroupId) {
      loadMessages(selectedGroupId)
    }
  }, [selectedGroupId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (groupId: string) => {
    try {
      const msgs = await getTopicMessages(groupId)
      setMessages(msgs || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!userQuery.trim() || !selectedGroupId || isSending) return

    const query = userQuery.trim()
    setUserQuery('')
    setIsSending(true)

    // Optimistic user message
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'user', content: query, createdAt: new Date() }])

    try {
      const updatedMsgs = await sendTopicMessage(selectedGroupId, query)
      if (updatedMsgs) setMessages(updatedMsgs)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickAction = async (type: 'summary' | 'study') => {
    if (!selectedGroupId || isSending) return
    setIsSending(true)
    setActiveTab('chat')

    try {
      let updatedMsgs: any
      if (type === 'summary') {
        updatedMsgs = await generateTopicSummary(selectedGroupId)
      } else {
        updatedMsgs = await generateStudyGuide(selectedGroupId)
      }
      if (updatedMsgs) setMessages(updatedMsgs)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  // Handlers for Group CRUD
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
    if (confirm('Tem certeza que deseja excluir este Tópico/Caderno e todas as suas notas?')) {
      await deleteGroup(id)
      if (selectedGroupId === id) {
        const remaining = groups.filter(g => g.id !== id)
        setSelectedGroupId(remaining[0]?.id || '')
      }
    }
  }

  // Handlers for Note CRUD
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteTitle.trim()) return
    await createNote(noteTitle, noteContent, selectedGroupId || undefined)
    setNoteTitle('')
    setNoteContent('')
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
    { label: 'Azul', value: 'bg-blue-500' },
    { label: 'Roxo', value: 'bg-purple-500' },
    { label: 'Verde', value: 'bg-emerald-500' },
    { label: 'Amarelo', value: 'bg-amber-500' },
    { label: 'Rosa', value: 'bg-pink-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER PRINCIPAL NO ESTILO NOTEBOOKLM */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs tracking-wider uppercase mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NotebookLM - Segundo Cérebro</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Tópicos & Conversas Inteligentes
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                setGroupName('')
                setGroupColor('bg-blue-500')
                setIsGroupModalOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Tópico / Caderno
            </button>
          </div>
        </div>

        {/* LAYOUT DUPLO: SIDEBAR DE TÓPICOS + PAINEL DO TÓPICO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR DE SELEÇÃO DE TÓPICOS (NOTEBOOKS) */}
          <aside className="lg:col-span-4 bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between px-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Seus Tópicos ({groups.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {groups.map((group) => {
                const isSelected = selectedGroupId === group.id
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border group relative flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-purple-500/80 shadow-lg ring-1 ring-purple-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${group.color || 'bg-blue-500'}`} />
                      <div className="truncate">
                        <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {group.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{group.notes.length} nota(s) / fontes</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingGroup(group)
                          setGroupName(group.name)
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Editar Tópico"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id)
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Excluir Tópico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {groups.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum tópico criado. Clique acima para criar seu primeiro caderno!
                </div>
              )}
            </div>
          </aside>

          {/* PAINEL PRINCIPAL DO TÓPICO SELECIONADO */}
          <main className="lg:col-span-8 space-y-6">
            {activeGroup ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
                
                {/* HEADER DO TÓPICO ATIVO */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${activeGroup.color}`} />
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {activeGroup.name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeGroup.notes.length} fontes e notas vinculadas a este tópico
                      </p>
                    </div>
                  </div>

                  {/* AÇÕES RÁPIDAS COM IA (NOTEBOOKLM) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleQuickAction('summary')}
                      className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Gerar áudio / podcast resumo com IA"
                    >
                      <Headphones className="w-3.5 h-3.5 text-purple-400" />
                      <span>Resumo de Áudio</span>
                    </button>

                    <button
                      onClick={() => handleQuickAction('study')}
                      className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Gerar guia de estudos e Q&A"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Guia de Estudos</span>
                    </button>

                    <button
                      onClick={() => {
                        setNoteTitle('')
                        setNoteContent('')
                        setIsNoteModalOpen(true)
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ml-auto md:ml-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova Nota +
                    </button>
                  </div>
                </div>

                {/* TABS DE ALTERNÂNCIA (FONTES & NOTAS VS CONVERSA COM IA) */}
                <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
                      activeTab === 'notes'
                        ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Fontes & Notas ({activeGroup.notes.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all ${
                      activeTab === 'chat'
                        ? 'bg-purple-950/90 text-purple-200 border border-purple-800/60 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>Conversa com IA ({messages.length})</span>
                  </button>
                </div>

                {/* CONTEÚDO DA ABA 1: FONTES & NOTAS */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {activeGroup.notes.length === 0 ? (
                      <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
                        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-slate-300 font-semibold mb-1">Nenhuma nota neste tópico</h4>
                        <p className="text-xs text-slate-500 mb-4">Adicione notas para conversar com a IA sobre este conteúdo.</p>
                        <button
                          onClick={() => {
                            setNoteTitle('')
                            setNoteContent('')
                            setIsNoteModalOpen(true)
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                        >
                          Adicionar Nota
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeGroup.notes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-white text-sm line-clamp-2">
                                  {note.title}
                                </h4>
                                <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingNote(note)
                                      setNoteTitle(note.title)
                                      setNoteContent(note.content || '')
                                    }}
                                    className="p-1 text-slate-400 hover:text-white rounded"
                                    title="Editar nota"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1 text-slate-400 hover:text-red-400 rounded"
                                    title="Excluir nota"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {note.content && (
                                <p className="text-slate-300 text-xs leading-relaxed line-clamp-5 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              )}
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                              <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                              <FileText className="w-3 h-3 text-slate-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CONTEÚDO DA ABA 2: CONVERSA COM IA (CHAT NOTEBOOKLM) */}
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {/* ÁREA DE MENSAGENS */}
                    <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 h-[400px] overflow-y-auto space-y-4 flex flex-col">
                      {messages.length === 0 ? (
                        <div className="my-auto text-center p-6 text-slate-500 text-xs">
                          <Bot className="w-10 h-10 text-purple-500/40 mx-auto mb-2" />
                          <p className="font-semibold text-slate-400">Faça uma pergunta sobre as notas deste tópico!</p>
                          <p className="mt-1">A IA do NotebookLM responderá com base exclusivamente no conteúdo do caderno **{activeGroup.name}**.</p>
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex flex-col ${
                              m.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                                m.role === 'user'
                                  ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                  : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-none shadow-md'
                              }`}
                            >
                              {m.content}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-1">
                              {m.role === 'user' ? 'Você' : 'NotebookLM Assistente'}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* INPUT DO CHAT */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Pergunte algo sobre o tópico "${activeGroup.name}"...`}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <button
                        type="submit"
                        disabled={!userQuery.trim() || isSending}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Folder className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <h3 className="text-lg font-bold text-white mb-1">Selecione ou crie um Tópico</h3>
                <p className="text-xs text-slate-500 mb-4">Gerencie seu conhecimento agrupando notas e conversas em tópicos.</p>
                <button
                  onClick={() => setIsGroupModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Criar Tópico
                </button>
              </div>
            )}
          </main>

        </div>

      </div>

      {/* MODAL: CRIAR TÓPICO / CADERNO */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Criar Novo Tópico</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Tópico / Caderno</label>
                <input
                  type="text"
                  placeholder="Ex: Projeto Dale, Treinos, Ideias..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-slate-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Cor de Identificação</label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGroupColor(opt.value)}
                      className={`w-7 h-7 rounded-full ${opt.value} transition-transform ${
                        groupColor === opt.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-sm">
                  Salvar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TÓPICO */}
      {editingGroup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Editar Tópico</h3>
              <button onClick={() => setEditingGroup(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Tópico</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingGroup(null)} className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-sm">
                  Atualizar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOTA NO TÓPICO */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Adicionar Nova Nota ao Tópico</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título da Nota *</label>
                <input
                  type="text"
                  placeholder="Ex: Reunião com equipe, Ideia de arquitetura..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Conteúdo da Nota</label>
                <textarea
                  rows={5}
                  placeholder="Escreva detalhes, pontos importantes, links ou resumos..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-sm">
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NOTA */}
      {editingNote && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Editar Nota</h3>
              <button onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título da Nota</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Conteúdo</label>
                <textarea
                  rows={5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingNote(null)} className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-sm">
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
