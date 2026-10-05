'use client'

import { useState, useEffect } from 'react'
import {
  getTasks,
  getTaskLists,
  createTask,
  updateTask,
  createTaskList,
  deleteTaskList,
  getSections,
  createSection,
  updateSection,
  deleteSection
} from './actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import TaskItem from '@/components/TaskItem'
import QuickAddModal from '@/components/QuickAddModal'
import KanbanView from '@/components/KanbanView'
import UpcomingView from '@/components/UpcomingView'
import { parseTaskInput } from '@/lib/nlpTaskParser'
import {
  CheckCircle2,
  Plus,
  Inbox,
  Sun,
  Calendar as CalendarIcon,
  Filter,
  Flag,
  Repeat,
  Tags,
  LayoutGrid,
  List,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Trash2,
  FolderPlus,
  X,
  Layers,
  Edit2
} from 'lucide-react'

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])

  // State de Navegação e Filtros
  const [filter, setFilter] = useState<string>('INBOX') // INBOX, TODAY, UPCOMING, HABITS, P1, P2, P3, P4, or listId
  const [selectedListId, setSelectedListId] = useState<string>('')
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Criar nova lista
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  // Section CRUD states
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')
  const [activeQuickSectionId, setActiveQuickSectionId] = useState<string | null>(null)
  const [quickSectionTaskInput, setQuickSectionTaskInput] = useState('')
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null)

  // Drag and drop handler para mover tarefas entre seções na visualização em lista
  const handleDropOnSection = async (e: React.DragEvent, sectionId: string | null) => {
    e.preventDefault()
    setDragOverSectionId(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return
    await updateTask(taskId, { sectionId })
    notifyWidgetRefresh()
    loadData()
  }

  // Form Inline Input
  const [newTaskInput, setNewTaskInput] = useState('')

  // Open sidebar on desktop by default
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true)
    }
  }, [])

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedLists] = await Promise.all([
        getTasks(),
        getTaskLists()
      ])
      setTasks(fetchedTasks || [])
      setLists(fetchedLists || [])

      // Carrega seções: da lista específica OU da Caixa de Entrada
      if (selectedListId) {
        const fetchedSections = await getSections(selectedListId)
        setSections(fetchedSections || [])
      } else if (filter === 'INBOX') {
        const fetchedSections = await getSections(null)
        setSections(fetchedSections || [])
      } else {
        setSections([])
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedListId, filter])

  // Atalho de Teclado Global: Pressionar 'q' para abrir Adição Rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'q' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setIsQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Seleção de Filtro / Lista
  const handleSelectFilter = async (filterKey: string, listId: string = '') => {
    setFilter(filterKey)
    setSelectedListId(listId)

    // Se estiver em mobile, fecha a sidebar ao selecionar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }

    if (listId) {
      const sec = await getSections(listId)
      setSections(sec || [])
    } else if (filterKey === 'INBOX') {
      const sec = await getSections(null)
      setSections(sec || [])
    } else {
      setSections([])
    }
  }

  // Criar Projeto / Lista
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const created = await createTaskList(newListName.trim(), randomColor)
    setNewListName('')
    setIsAddingList(false)
    if (created) {
      await handleSelectFilter(created.id, created.id)
    }
    await loadData()
  }

  const handleDeleteList = async (listId: string) => {
    if (confirm('Tem certeza que deseja excluir esta lista e suas seções?')) {
      await deleteTaskList(listId)
      handleSelectFilter('INBOX')
      await loadData()
    }
  }

  // Section CRUD Handlers
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionName.trim()) return
    await createSection(newSectionName.trim(), selectedListId || null)
    setNewSectionName('')
    setIsAddingSection(false)
    await loadData()
  }

  const handleUpdateSectionName = async (sectionId: string) => {
    if (!editingSectionName.trim()) return
    await updateSection(sectionId, editingSectionName.trim())
    setEditingSectionId(null)
    setEditingSectionName('')
    await loadData()
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta seção? As tarefas nela não serão apagadas, mas ficarão sem seção.')) {
      await deleteSection(sectionId)
      await loadData()
    }
  }

  const handleQuickAddInSection = async (sectionId: string | null) => {
    if (!quickSectionTaskInput.trim()) return
    await createTask({
      title: quickSectionTaskInput.trim(),
      listId: selectedListId || null,
      sectionId
    })
    setQuickSectionTaskInput('')
    setActiveQuickSectionId(null)
    notifyWidgetRefresh()
    await loadData()
  }

  // Submit Inline Task Add (com NLP)
  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskInput.trim()) return

    const parsed = parseTaskInput(newTaskInput, lists, sections)
    const finalListId = parsed.listId || selectedListId || (filter !== 'INBOX' && filter !== 'TODAY' && filter !== 'UPCOMING' && filter !== 'HABITS' && !filter.startsWith('P') ? filter : null)

    await createTask({
      title: parsed.cleanTitle,
      priority: parsed.priority || 'P4',
      dueDate: parsed.dueDate || (filter === 'TODAY' ? new Date() : null),
      listId: finalListId,
      sectionId: parsed.sectionId || null,
      isHabit: filter === 'HABITS'
    })

    setNewTaskInput('')
    notifyWidgetRefresh()
    await loadData()
  }

  // Filtragem de Tarefas com tratamento de datas local robusto
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'HABITS') return t.isHabit
    if (filter === 'TODAY') {
      if (t.isHabit) return false
      if (!t.dueDate) return false
      const today = new Date()
      const taskDate = new Date(t.dueDate)
      return (
        taskDate.getFullYear() === today.getFullYear() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getDate() === today.getDate()
      )
    }
    if (filter === 'UPCOMING') {
      return !t.isHabit
    }
    if (filter === 'INBOX') return !t.isHabit && !t.listId

    // Filtro por ID de lista específica
    return t.listId === filter
  })

  const selectedListObj = lists.find((l) => l.id === filter)
  const parsedInline = parseTaskInput(newTaskInput, lists, sections)
  const isInboxOrProject = filter === 'INBOX' || !!selectedListObj

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 md:px-8 flex flex-col max-w-7xl mx-auto min-w-0 overflow-x-hidden">
      
      {/* BARRA SUPERIOR DE AÇÕES & BOTÃO GLOBAL + */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
            title={isSidebarOpen ? 'Ocultar Menu Lateral' : 'Abrir Menu Lateral'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          <div className="min-w-0 truncate">
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 truncate">
              {filter === 'INBOX' && '📥 Caixa de Entrada'}
              {filter === 'TODAY' && '☀️ Hoje'}
              {filter === 'UPCOMING' && '📅 Em Breve'}
              {filter === 'HABITS' && '🔄 Hábitos Diários'}
              {selectedListObj && (
                <>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedListObj.color || 'bg-blue-500'}`} />
                  <span className="truncate">{selectedListObj.name}</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {filter === 'UPCOMING' ? 'Próximos 7 dias de atividades' : 'Organize suas tarefas com atalhos, datas e seções'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 self-end sm:self-auto flex-shrink-0">
          {/* Toggle de Modo Lista / Modo Quadro Kanban */}
          {filter !== 'UPCOMING' && (
            <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Quadro</span>
              </button>
            </div>
          )}

          {/* BOTÃO GLOBAL DE ADIÇÃO RÁPIDA (RED + BUTTON) */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-3 sm:px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/40 active:scale-95 transition-all flex items-center gap-1.5"
            title="Adicionar Tarefa Rápida (Atalho: Q)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Adicionar Tarefa</span>
            <span className="text-[10px] bg-red-800/80 px-1.5 py-0.5 rounded font-mono">Q</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (SIDEBAR + ÁREA DE CONTEÚDO) */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 min-w-0">
        
        {/* Mobile Drawer Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* BARRA LATERAL RESPONSIVA */}
        <aside className={`
          fixed md:static top-0 left-0 h-full md:h-auto z-50 md:z-auto
          w-72 md:w-64 bg-slate-950 md:bg-transparent p-5 md:p-0
          border-r md:border-0 border-slate-800 space-y-6 flex-shrink-0
          transition-transform duration-200 overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 hidden md:block'}
        `}>
          {/* Header Mobile para fechar Sidebar */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <PanelLeft className="w-4 h-4 text-purple-400" /> Menu de Tarefas
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visualizações Principais */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-3">
              Visualização
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleSelectFilter('INBOX')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'INBOX'
                    ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-800/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-blue-400" /> Caixa de Entrada
                </div>
                <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter((t) => !t.isHabit && !t.listId).length}
                </span>
              </button>

              <button
                onClick={() => handleSelectFilter('TODAY')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'TODAY'
                    ? 'bg-amber-950/60 text-amber-400 font-semibold border border-amber-800/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-amber-400" /> Hoje
                </div>
                <span className="text-xs bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter((t) => {
                    if (t.isHabit || !t.dueDate) return false
                    const today = new Date()
                    const d = new Date(t.dueDate)
                    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
                  }).length}
                </span>
              </button>

              <button
                onClick={() => handleSelectFilter('UPCOMING')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'UPCOMING'
                    ? 'bg-purple-950/60 text-purple-400 font-semibold border border-purple-800/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-purple-400" /> Em Breve
                </div>
                <span className="text-xs bg-purple-950/80 text-purple-400 border border-purple-800/60 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter((t) => !t.isHabit && t.dueDate).length}
                </span>
              </button>

              <button
                onClick={() => handleSelectFilter('HABITS')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'HABITS'
                    ? 'bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-800/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Repeat className="w-4 h-4 text-emerald-400" /> Hábitos
                </div>
                <span className="text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter((t) => t.isHabit).length}
                </span>
              </button>
            </div>
          </div>

          {/* Projetos / Listas */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Tags className="w-3.5 h-3.5" /> Projetos
              </h3>
              <button
                onClick={() => setIsAddingList(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
                title="Criar novo projeto"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Form de Criar Nova Lista */}
            {isAddingList && (
              <form onSubmit={handleCreateList} className="mb-2 p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome do projeto..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-white outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="text-[11px] text-slate-400 px-2 py-1 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] bg-blue-600 text-white px-2.5 py-1 rounded-md font-semibold hover:bg-blue-500"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {lists.map((list) => {
                const isActive = filter === list.id
                const count = tasks.filter((t) => t.listId === list.id).length
                return (
                  <div
                    key={list.id}
                    className="group/item flex items-center justify-between"
                  >
                    <button
                      onClick={() => handleSelectFilter(list.id, list.id)}
                      className={`flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold border border-slate-800'
                          : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${list.color || 'bg-blue-500'}`} />
                        <span className="truncate">{list.name}</span>
                      </div>
                      {count > 0 && (
                        <span className="text-xs text-slate-500 font-semibold">{count}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                      title="Excluir lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

        </aside>

        {/* ÁREA PRINCIPAL DE CONTEÚDO */}
        <div className="flex-1 min-w-0">
          
          {/* VISUALIZAÇÃO "EM BREVE" (PRÓXIMOS 7 DIAS) */}
          {filter === 'UPCOMING' ? (
            <UpcomingView
              tasks={filteredTasks}
              lists={lists}
              sections={sections}
              onRefresh={loadData}
            />
          ) : viewMode === 'kanban' ? (
            /* VISUALIZAÇÃO QUADRO (KANBAN) */
            <KanbanView
              tasks={filteredTasks}
              sections={sections}
              lists={lists}
              currentListId={selectedListId}
              onRefresh={loadData}
            />
          ) : (
            /* VISUALIZAÇÃO LISTA VERTICAL TRADICIONAL COM SUPORTE A SEÇÕES */
            <div className="space-y-6">
              
              {/* CAMPO DE CRIAÇÃO RÁPIDA INLINE COM RECONHECIMENTO NLP */}
              <form
                onSubmit={handleInlineAdd}
                className="bg-slate-900 p-3 sm:p-3.5 rounded-2xl shadow-lg border border-slate-800 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all space-y-3"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Plus className="text-slate-500 w-5 h-5 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder='Digite uma tarefa (ex: "Comprar leite amanhã p1 #Pessoal /Mercado")...'
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    className="w-full outline-none text-slate-100 bg-transparent placeholder-slate-500 text-xs sm:text-sm font-medium min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>

                {/* Badges de Feedback de Reconhecimento NLP Inline */}
                {newTaskInput.trim() && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> NLP:
                    </span>

                    {parsedInline.dueDate && (
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/40">
                        📅 {parsedInline.dueDate.toLocaleDateString('pt-BR')}
                      </span>
                    )}

                    {parsedInline.listId && (
                      <span className="text-[10px] text-slate-200 font-semibold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        #{lists.find(l => l.id === parsedInline.listId)?.name}
                      </span>
                    )}

                    {parsedInline.sectionId && (
                      <span className="text-[10px] text-purple-300 font-semibold bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-900/40">
                        /{sections.find(s => s.id === parsedInline.sectionId)?.name}
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      🚩 {parsedInline.priority || 'P4'}
                    </span>
                  </div>
                )}
              </form>

              {/* SEÇÃO CRUD BAR (Disponível na Caixa de Entrada e nos Projetos) */}
              {isInboxOrProject && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>
                      {selectedListObj ? 'Seções do Projeto' : 'Seções da Caixa de Entrada'} ({sections.length})
                    </span>
                  </div>

                  {isAddingSection ? (
                    <form onSubmit={handleCreateSection} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="Nome da Seção (ex: Prioridades)..."
                        className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-white outline-none focus:border-purple-500 w-full sm:w-auto"
                        autoFocus
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                        >
                          Salvar Seção
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
                      <Plus className="w-3.5 h-3.5" /> Adicionar Seção
                    </button>
                  )}
                </div>
              )}

              {/* LISTAGEM DE TAREFAS (COM AGRUPAMENTO POR SEÇÕES SE HOUVER SEÇÕES) */}
              {isLoading ? (
                <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-10 text-center text-slate-400 text-sm">
                  Carregando tarefas...
                </div>
              ) : filteredTasks.length === 0 && sections.length === 0 ? (
                <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-12 text-center flex flex-col items-center text-slate-400">
                  <Sparkles className="w-12 h-12 mb-3 text-slate-600 opacity-60" />
                  <p className="text-sm font-semibold text-slate-300">Tudo limpo por aqui!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Nenhuma tarefa encontrada para a visualização selecionada.
                  </p>
                </div>
              ) : isInboxOrProject && sections.length > 0 ? (
                /* EXIBIÇÃO AGRUPADA POR SEÇÕES */
                <div className="space-y-6">
                  {/* Bloco de Tarefas Sem Seção com Dropzone */}
                  {filteredTasks.filter(t => !t.sectionId).length > 0 && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        if (dragOverSectionId !== 'no-section') setDragOverSectionId('no-section')
                      }}
                      onDragLeave={() => setDragOverSectionId(null)}
                      onDrop={(e) => handleDropOnSection(e, null)}
                      className={`bg-slate-900 rounded-2xl shadow-lg border transition-all ${
                        dragOverSectionId === 'no-section'
                          ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-950/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" /> Sem Seção
                        </span>
                        <div className="flex items-center gap-2">
                          {dragOverSectionId === 'no-section' && (
                            <span className="text-[10px] text-purple-400 font-bold animate-pulse">
                              Solte aqui para mover para Sem Seção
                            </span>
                          )}
                          <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-800">
                            {filteredTasks.filter(t => !t.sectionId).length}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-800/60">
                        {filteredTasks
                          .filter(t => !t.sectionId)
                          .map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              lists={lists}
                              sections={sections}
                              onRefresh={loadData}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Cada Seção Criada com Dropzone, CRUD e Adição Rápida */}
                  {sections.map((section) => {
                    const sectionTasks = filteredTasks.filter(t => t.sectionId === section.id)
                    const isEditingThisSection = editingSectionId === section.id
                    const isAddingTaskToThisSection = activeQuickSectionId === section.id
                    const isOverThisSection = dragOverSectionId === section.id

                    return (
                      <div
                        key={section.id}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          if (dragOverSectionId !== section.id) setDragOverSectionId(section.id)
                        }}
                        onDragLeave={() => setDragOverSectionId(null)}
                        onDrop={(e) => handleDropOnSection(e, section.id)}
                        className={`bg-slate-900 rounded-2xl shadow-lg border transition-all ${
                          isOverThisSection
                            ? 'border-purple-500 ring-2 ring-purple-500/50 bg-purple-950/20 scale-[1.005]'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Header da Seção com Rename e Delete */}
                        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                          {isEditingThisSection ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingSectionName}
                                onChange={(e) => setEditingSectionName(e.target.value)}
                                className="bg-slate-900 border border-purple-500 text-xs px-2.5 py-1 rounded-lg text-white outline-none w-full max-w-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateSectionName(section.id)
                                  if (e.key === 'Escape') setEditingSectionId(null)
                                }}
                              />
                              <button
                                onClick={() => handleUpdateSectionName(section.id)}
                                className="text-[11px] bg-purple-600 text-white px-2.5 py-1 rounded-lg font-bold"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingSectionId(null)}
                                className="text-[11px] text-slate-400 hover:text-white px-1.5"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate">
                                <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                <span className="text-sm font-bold text-slate-100 truncate">
                                  {section.name}
                                </span>
                                <span className="text-xs bg-slate-900 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-900/50">
                                  {sectionTasks.length}
                                </span>
                                {isOverThisSection && (
                                  <span className="text-[10px] text-purple-400 font-bold animate-pulse ml-1">
                                    Solte para mover para esta seção
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setActiveQuickSectionId(section.id)}
                                  className="text-xs text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Adicionar tarefa nesta seção"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSectionId(section.id)
                                    setEditingSectionName(section.name)
                                  }}
                                  className="text-xs text-slate-400 hover:text-purple-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Renomear seção"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(section.id)}
                                  className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Excluir seção"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Inline input para adicionar tarefa nesta seção */}
                        {isAddingTaskToThisSection && (
                          <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
                            <input
                              type="text"
                              value={quickSectionTaskInput}
                              onChange={(e) => setQuickSectionTaskInput(e.target.value)}
                              placeholder={`Adicionar tarefa em "${section.name}"...`}
                              className="bg-slate-900 border border-slate-800 text-xs px-3 py-1.5 rounded-xl text-white outline-none focus:border-purple-500 flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickAddInSection(section.id)
                                if (e.key === 'Escape') setActiveQuickSectionId(null)
                              }}
                            />
                            <button
                              onClick={() => handleQuickAddInSection(section.id)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-xl font-semibold"
                            >
                              Adicionar
                            </button>
                            <button
                              onClick={() => setActiveQuickSectionId(null)}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1.5"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}

                        {/* Lista de tarefas da seção com dropzone vazio convidativo */}
                        {sectionTasks.length === 0 ? (
                          <div className={`p-4 text-center text-xs transition-colors rounded-xl m-2.5 border-2 border-dashed ${
                            isOverThisSection
                              ? 'border-purple-500 bg-purple-900/30 text-purple-300 font-semibold'
                              : 'border-slate-800/60 text-slate-500'
                          }`}>
                            {isOverThisSection
                              ? 'Solte a tarefa para movê-la para esta seção!'
                              : 'Nenhuma tarefa nesta seção. Arraste tarefas aqui ou clique em "+" acima.'}
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-800/60">
                            {sectionTasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                lists={lists}
                                sections={sections}
                                onRefresh={loadData}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* EXIBIÇÃO TRADICIONAL PLANA SE NÃO HOUVER SEÇÕES CRIADAS */
                <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 divide-y divide-slate-800/60">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      lists={lists}
                      sections={sections}
                      onRefresh={loadData}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL GLOBAL DE ADIÇÃO RÁPIDA (TECLA Q OU BOTÃO RED +) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        lists={lists}
        sections={sections}
        onTaskCreated={loadData}
        defaultListId={selectedListId}
      />

    </main>
  )
}

