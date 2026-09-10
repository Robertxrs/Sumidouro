'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getNotesData() {
  const groups = await prisma.noteGroup.findMany({ 
    include: { 
      notes: {
        orderBy: { createdAt: 'desc' }
      } 
    },
    orderBy: { createdAt: 'desc' }
  })
  const standaloneNotes = await prisma.note.findMany({ 
    where: { groupId: null },
    orderBy: { createdAt: 'desc' }
  })
  return { groups, standaloneNotes }
}

export async function createGroup(name: string, color?: string) {
  if (!name.trim()) return;
  await prisma.noteGroup.create({ data: { name, color: color || 'bg-red-500' } })
  revalidatePath('/notes')
}

export async function updateGroup(id: string, name: string) {
  if (!name.trim()) return;
  await prisma.noteGroup.update({ where: { id }, data: { name } })
  revalidatePath('/notes')
}

export async function deleteGroup(id: string) {
  // First disassociate notes or cascade delete
  await prisma.note.deleteMany({ where: { groupId: id } })
  await prisma.noteGroup.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function createNote(title: string, content: string, groupId?: string) {
  if (!title.trim()) return;
  await prisma.note.create({ data: { title, content, groupId: groupId || null } })
  revalidatePath('/notes')
}

export async function updateNote(id: string, title: string, content: string) {
  if (!title.trim()) return;
  await prisma.note.update({ where: { id }, data: { title, content } })
  revalidatePath('/notes')
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/notes')
}
