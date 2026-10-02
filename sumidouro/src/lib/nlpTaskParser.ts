export interface ParsedTaskInput {
  cleanTitle: string
  title: string
  description?: string
  dueDate: Date | null
  hasTime: boolean
  listName: string | null
  listId: string | null
  sectionName: string | null
  sectionId: string | null
  priority: 'P1' | 'P2' | 'P3' | 'P4'
}

export function parseTaskInput(
  rawText: string,
  availableLists: { id: string; name: string }[] = [],
  availableSections: { id: string; name: string }[] = []
): ParsedTaskInput {
  let text = rawText.trim()
  let priority: 'P1' | 'P2' | 'P3' | 'P4' = 'P4'
  let listName: string | null = null
  let listId: string | null = null
  let sectionName: string | null = null
  let sectionId: string | null = null
  let dueDate: Date | null = null

  // 1. Detect priority (p1, p2, p3, p4)
  const priorityMatch = text.match(/(?:^|\s)p([1-4])(?:\s|$)/i)
  if (priorityMatch) {
    const pNum = priorityMatch[1]
    priority = `P${pNum}` as any
    text = text.replace(priorityMatch[0], ' ')
  }

  // 2. Detect project/list (#nome)
  const listMatch = text.match(/(?:^|\s)#([a-zA-Z0-9_\-áàâãéèêíïóôõöúçÑñ]+)(?:\s|$)/i)
  if (listMatch) {
    const matchedTag = listMatch[1]
    const foundList = availableLists.find(
      (l) =>
        l.name.toLowerCase().includes(matchedTag.toLowerCase()) ||
        matchedTag.toLowerCase().includes(l.name.toLowerCase())
    )
    if (foundList) {
      listName = foundList.name
      listId = foundList.id
    } else {
      listName = matchedTag
    }
    text = text.replace(listMatch[0], ' ')
  }

  // 3. Detect section (/secao)
  const sectionMatch = text.match(/(?:^|\s)\/([a-zA-Z0-9_\-áàâãéèêíïóôõöúçÑñ\s]+?)(?=#|\sp[1-4]|\shoje|\samanhã|$)/i)
  if (sectionMatch) {
    const matchedSection = sectionMatch[1].trim()
    const foundSection = availableSections.find(
      (s) =>
        s.name.toLowerCase().includes(matchedSection.toLowerCase()) ||
        matchedSection.toLowerCase().includes(s.name.toLowerCase())
    )
    if (foundSection) {
      sectionName = foundSection.name
      sectionId = foundSection.id
    } else {
      sectionName = matchedSection
    }
    text = text.replace(sectionMatch[0], ' ')
  }

  // 4. Detect time (às HH:mm or HH:mm or HHh)
  let timeHour = 9
  let timeMin = 0
  let hasTime = false
  const timeMatch = text.match(/(?:às\s+)?(\d{1,2})(?::(\d{2})|h)(?:\s|$)/i)
  if (timeMatch) {
    timeHour = parseInt(timeMatch[1], 10)
    timeMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    hasTime = true
    text = text.replace(timeMatch[0], ' ')
  }

  // 5. Detect Date keywords
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (/(?:^|\s)hoje(?:\s|$)/i.test(text)) {
    dueDate = new Date(today)
    if (hasTime) dueDate.setHours(timeHour, timeMin, 0, 0)
    else dueDate.setHours(23, 59, 59, 999)
    text = text.replace(/(?:^|\s)hoje(?:\s|$)/i, ' ')
  } else if (/(?:^|\s)amanhã(?:\s|$)/i.test(text)) {
    dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 1)
    if (hasTime) dueDate.setHours(timeHour, timeMin, 0, 0)
    else dueDate.setHours(23, 59, 59, 999)
    text = text.replace(/(?:^|\s)amanhã(?:\s|$)/i, ' ')
  } else {
    // Weekday match
    const weekdaysMap: Record<string, number> = {
      segunda: 1, ter: 2, terca: 2, terça: 2, qua: 3, quarta: 3, qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6, sábado: 6, dom: 0, domingo: 0
    }
    const weekdayMatch = text.match(/(?:^|\s)(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(?:\s|$)/i)
    if (weekdayMatch) {
      const targetDay = weekdaysMap[weekdayMatch[1].toLowerCase()]
      if (targetDay !== undefined) {
        dueDate = new Date(today)
        let currentDay = dueDate.getDay()
        let distance = (targetDay + 7 - currentDay) % 7
        if (distance === 0) distance = 7
        dueDate.setDate(dueDate.getDate() + distance)
        if (hasTime) dueDate.setHours(timeHour, timeMin, 0, 0)
        else dueDate.setHours(23, 59, 59, 999)
        text = text.replace(weekdayMatch[0], ' ')
      }
    } else {
      // Date DD/MM or DD/MM/YYYY format
      const dateMatch = text.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s|$)/)
      if (dateMatch) {
        const dayNum = parseInt(dateMatch[1], 10)
        const monthNum = parseInt(dateMatch[2], 10) - 1
        const yearNum = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear()
        dueDate = new Date(yearNum < 100 ? 2000 + yearNum : yearNum, monthNum, dayNum)
        if (hasTime) dueDate.setHours(timeHour, timeMin, 0, 0)
        else dueDate.setHours(23, 59, 59, 999)
        text = text.replace(dateMatch[0], ' ')
      }
    }
  }

  const cleanTitle = text.replace(/\s+/g, ' ').trim() || rawText.trim()

  return {
    cleanTitle,
    title: cleanTitle,
    dueDate,
    hasTime,
    listName,
    listId,
    sectionName,
    sectionId,
    priority
  }
}
