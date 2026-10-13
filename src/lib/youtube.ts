/**
 * Extrai o ID do vídeo do YouTube e retorna a URL de embed segura (ex: https://www.youtube.com/embed/VIDEO_ID).
 * Aceita:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - youtube.com/watch?v=...
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null
  const trimmed = url.trim()

  try {
    // Caso 1: youtu.be/ID
    const shortMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i)
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`
    }

    // Caso 2: shorts/ID
    const shortsMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    )
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0&modestbranding=1`
    }

    // Caso 3: embed/ID
    const embedMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    )
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/embed/${embedMatch[1]}?rel=0&modestbranding=1`
    }

    // Caso 4: watch?v=ID
    const watchMatch = trimmed.match(/(?:v=|vi=|\/v\/|\/vi\/)([a-zA-Z0-9_-]{11})/i)
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`
    }

    // Se já é um ID puro de 11 caracteres
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return `https://www.youtube.com/embed/${trimmed}?rel=0&modestbranding=1`
    }

    return null
  } catch {
    return null
  }
}
