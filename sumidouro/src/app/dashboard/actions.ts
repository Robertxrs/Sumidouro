'use server'
import { prisma } from '@/lib/prisma'

export async function getDashboardSummary() {
  const pendingTasks = await prisma.task.count({ where: { isCompleted: false, isHabit: false } })
  
  const transactions = await prisma.transaction.findMany()
  let balance = 0
  transactions.forEach(t => {
    if (t.type === 'INCOME') balance += t.amount
    else balance -= t.amount
  })

  return { pendingTasks, balance }
}
