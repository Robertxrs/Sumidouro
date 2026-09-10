import { getNotesData } from '@/app/notes/actions'
import NotesView from '@/components/notes/NotesView'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const { groups, standaloneNotes } = await getNotesData()

  return (
    <NotesView 
      groups={groups} 
      standaloneNotes={standaloneNotes} 
    />
  )
}
