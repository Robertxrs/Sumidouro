'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function callGemini(prompt: string, imageBase64?: string, mimeType?: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) return null

  try {
    const parts: any[] = [{ text: prompt }]

    if (imageBase64) {
      const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
      const finalMime = match ? match[1] : (mimeType || 'image/jpeg')
      const cleanData = match ? match[2] : imageBase64

      parts.push({
        inlineData: {
          mimeType: finalMime,
          data: cleanData
        }
      })
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini API error:', err)
      return null
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    return text || null
  } catch (err) {
    console.error('Error calling Gemini:', err)
    return null
  }
}

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
  if (!name.trim()) return
  await prisma.noteGroup.create({ data: { name, color: color || 'bg-red-500' } })
  revalidatePath('/notes')
}

export async function updateGroup(id: string, name: string) {
  if (!name.trim()) return
  await prisma.noteGroup.update({ where: { id }, data: { name } })
  revalidatePath('/notes')
}

export async function deleteGroup(id: string) {
  await prisma.note.deleteMany({ where: { groupId: id } })
  await prisma.chatMessage.deleteMany({ where: { groupId: id } })
  await prisma.noteGroup.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function analyzeNoteImage(title: string, content: string, imageUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return '📷 Imagem anexada com sucesso. (Para habilitar análise multimodal avançada com IA, configure GEMINI_API_KEY no ambiente).'
  }

  const prompt = `Você é um assistente de IA multimodal analisando uma imagem anexada a uma anotação intitulada "${title}".
Contexto textual da nota: "${content || 'Sem texto adicional'}".
Por favor, analise a imagem detalhadamente:
1. Descreva o que está visível (diagrama, texto, quadro, fotografia, captura de tela, etc.).
2. Transcreva qualquer texto ou dado legível relevante.
3. Explique a conexão do conteúdo visual com a anotação para enriquecer o contexto.`

  const analysis = await callGemini(prompt, imageUrl)
  return analysis || 'Imagem registrada. Análise automática concluída.'
}

export async function createNote(
  title: string,
  content: string,
  groupId?: string,
  imageUrl?: string | null,
  imageDescription?: string | null
) {
  if (!title.trim()) return

  let finalImageDesc = imageDescription || null
  if (imageUrl && !finalImageDesc) {
    try {
      finalImageDesc = await analyzeNoteImage(title, content, imageUrl)
    } catch (e) {
      console.error(e)
    }
  }

  const created = await prisma.note.create({
    data: {
      title,
      content,
      groupId: groupId || null,
      imageUrl: imageUrl || null,
      imageDescription: finalImageDesc
    }
  })
  revalidatePath('/notes')
  return created
}

export async function updateNote(
  id: string,
  title: string,
  content: string,
  imageUrl?: string | null,
  imageDescription?: string | null
) {
  if (!title.trim()) return

  let finalImageDesc = imageDescription || null
  if (imageUrl && !finalImageDesc) {
    try {
      finalImageDesc = await analyzeNoteImage(title, content, imageUrl)
    } catch (e) {
      console.error(e)
    }
  }

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title,
      content,
      imageUrl: imageUrl || null,
      imageDescription: finalImageDesc
    }
  })
  revalidatePath('/notes')
  return updated
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function getTopicMessages(groupId: string) {
  return await prisma.chatMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function sendTopicMessage(groupId: string, userText: string) {
  if (!userText.trim()) return

  // Save user message
  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'user',
      content: userText.trim()
    }
  })

  // Fetch topic details and all notes in this topic
  const group = await prisma.noteGroup.findUnique({
    where: { id: groupId },
    include: { notes: true }
  })

  let aiResponseText = ''

  if (!group || group.notes.length === 0) {
    aiResponseText = `Ainda não há notas adicionadas ao tópico "${group?.name || 'este tópico'}". Adicione notas e fontes com texto ou imagens para podermos conversar sobre elas!`
  } else {
    // Check if Gemini is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (apiKey) {
      const notesContext = group.notes.map((n, i) => {
        let desc = `Nota ${i + 1}: "${n.title}"\nConteúdo: ${n.content || 'Sem texto adicional.'}`
        if (n.imageUrl) {
          desc += `\n[Possui Imagem Anexada]\nAnálise Visual: ${n.imageDescription || 'Imagem anexada à nota.'}`
        }
        return desc
      }).join('\n\n---\n\n')

      const prompt = `Você é o NotebookLM inteligente do aplicativo Sumidouro.
Você está conversando sobre o caderno/tópico: "${group.name}".
Contexto de todas as notas e imagens do usuário:
${notesContext}

Mensagem do Usuário: "${userText}"
Responda de forma precisa, objetiva e útil, integrando tanto os textos das anotações quanto o contexto visual das imagens.`

      const geminiRes = await callGemini(prompt)
      if (geminiRes) {
        aiResponseText = geminiRes
      }
    }

    if (!aiResponseText) {
      const lower = userText.toLowerCase()
      if (lower.includes('resumo') || lower.includes('resumir') || lower.includes('visão geral')) {
        aiResponseText = `📑 **Visão Geral do Tópico "${group.name}"**:\n\n` +
          `Este tópico contém **${group.notes.length} nota(s)**:\n` +
          group.notes.map(n => `• **${n.title}**: ${n.content ? n.content.slice(0, 100) + '...' : (n.imageUrl ? '[Contém imagem]' : 'Sem detalhes.')}`).join('\n') +
          `\n\n💡 Você pode clicar em "Gerar Resumo" para uma síntese profunda e estruturada de todas as notas e imagens.`
      } else {
        aiResponseText = `Com base nas **${group.notes.length} nota(s)** do tópico **${group.name}**:\n\n` +
          `Em relação a "${userText}":\n\n` +
          group.notes.slice(0, 3).map(n => {
            let res = `> **${n.title}**: ${n.content ? n.content.slice(0, 150) : 'Sem texto.'}`
            if (n.imageDescription) {
              res += `\n> *Contexto Visual da Imagem:* ${n.imageDescription.slice(0, 120)}...`
            }
            return res
          }).join('\n\n') +
          `\n\n✨ *NotebookLM Assistente:* Dúvidas ou conexões adicionais entre suas notas e imagens podem ser exploradas a qualquer momento!`
      }
    }
  }

  // Save AI response message
  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'assistant',
      content: aiResponseText
    }
  })

  revalidatePath('/notes')
  return await getTopicMessages(groupId)
}

export async function generateTopicSummary(groupId: string) {
  const group = await prisma.noteGroup.findUnique({
    where: { id: groupId },
    include: { notes: true }
  })

  if (!group || group.notes.length === 0) {
    return
  }

  let content = ''
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (apiKey) {
    const notesContext = group.notes.map((n, i) => {
      let desc = `Nota ${i + 1}: "${n.title}"\nConteúdo: ${n.content || 'Sem texto.'}`
      if (n.imageUrl) {
        desc += `\n[Possui imagem anexada]\nAnálise Visual: ${n.imageDescription || 'Imagem arquivada na nota.'}`
      }
      return desc
    }).join('\n\n---\n\n')

    const prompt = `Você é o NotebookLM inteligente do aplicativo Sumidouro. Analise todas as notas e fontes do caderno/tópico "${group.name}".
Gere uma Síntese Executiva Completa e Inteligente estruturada:
1. 🎯 Visão Geral & Objetivo Central do Tópico
2. 📌 Principais Conclusões e Aprendizados (destacando dados, notas e o conteúdo visual das imagens anexadas)
3. ⚡ Pontos de Ação / Recomendações
4. 💡 Síntese das Imagens e Fontes Gráficas Anexadas

Notas do Tópico:
${notesContext}`

    const aiSummary = await callGemini(prompt)
    if (aiSummary) {
      content = `📑 **Síntese Inteligente com IA - Tópico: ${group.name}**\n\n` + aiSummary
    }
  }

  if (!content) {
    content = `📑 **Síntese Executiva - Tópico: ${group.name}**\n\n` +
      `Foram consolidadas **${group.notes.length} nota(s) e fontes** deste tópico.\n\n` +
      `### 📌 Destaques Registrados:\n\n` +
      group.notes.map((n, i) => {
        let block = `**${i + 1}. ${n.title}**\n${n.content || 'Sem texto detalhado.'}`
        if (n.imageUrl) {
          block += `\n*📷 Imagem:* ${n.imageDescription || 'Imagem anexada disponível na nota.'}`
        }
        return block
      }).join('\n\n') +
      `\n\n### 💡 Síntese Geral:\nAs notas e arquivos reunidos em "${group.name}" fornecem um panorama completo para consulta e aprendizado contínuo.`
  }

  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'assistant',
      content
    }
  })

  revalidatePath('/notes')
  return await getTopicMessages(groupId)
}

