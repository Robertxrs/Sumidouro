'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTaskLists() {
  const lists = await prisma.taskList.findMany()
  // Cria listas padrão se não existirem
  if (lists.length === 0) {
    await prisma.taskList.createMany({
      data: [
        { name: 'Jud\'s Confeitaria', color: 'bg-amber-500' },
        { name: 'Unicesumar', color: 'bg-blue-600' },
        { name: 'Freelance / Dev', color: 'bg-purple-500' },
        { name: 'Pessoal', color: 'bg-emerald-500' }
      ]
    })
    return await prisma.taskList.findMany()
  }
  return lists
}

export async function getTasks() {
  return await prisma.task.findMany({
    where: { parentId: null },
    include: { subtasks: true, list: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createTask(data: { title: string, isHabit?: boolean, dueDate?: Date, listId?: string }) {
  if (!data.title.trim()) return;
  await prisma.task.create({ data })
  revalidatePath('/')
}

export async function toggleTask(id: string, isCompleted: boolean) {
  await prisma.task.update({ where: { id }, data: { isCompleted } })
  revalidatePath('/')
}
