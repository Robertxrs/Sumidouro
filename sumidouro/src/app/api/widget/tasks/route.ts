import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isCompleted: false, isHabit: false },
      select: { title: true },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    const textOutput = tasks.length > 0
      ? tasks.map(t => `• ${t.title}`).join('\n')
      : 'Tudo limpo por aqui! ✨';

    return new NextResponse(textOutput, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    return new NextResponse('Erro ao buscar tarefas', { status: 500 });
  }
}

