import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        isCompleted: false,
        isHabit: false
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 5 // Limita às 5 tarefas mais antigas/urgentes
    });

    return NextResponse.json(tasks, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Permite que o app de widget do celular acesse
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
  }
}
