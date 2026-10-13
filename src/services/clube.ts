import pb from '@/lib/pocketbase/client'
import type {
  ClubeBook,
  ClubeDailyPost,
  ClubeMeeting,
  ClubeComment,
  ClubePostType,
} from '@/types/backoffice'

export function getClubeBookCoverUrl(book: ClubeBook): string | null {
  if (!book.cover) return null
  return pb.files.getURL(book, book.cover)
}

export async function listClubeBooks(): Promise<ClubeBook[]> {
  return pb.collection<ClubeBook>('clube_books').getFullList({
    sort: '-month,-created',
  })
}

export async function getActiveClubeBook(): Promise<ClubeBook | null> {
  try {
    const list = await pb.collection<ClubeBook>('clube_books').getList(1, 1, {
      filter: "status = 'ativo'",
      sort: '-created',
    })
    return list.items[0] ?? null
  } catch {
    return null
  }
}

export async function createClubeBook(data: {
  title: string
  author: string
  month: string
  description?: string
  status: 'ativo' | 'inativo'
  cover?: File | null
}): Promise<ClubeBook> {
  const form = new FormData()
  form.append('title', data.title.trim())
  form.append('author', data.author.trim())
  form.append('month', data.month.trim())
  form.append('status', data.status)
  if (data.description) form.append('description', data.description)
  if (data.cover) form.append('cover', data.cover)

  // Se marcar como ativo, desativa os outros para manter 1 livro ativo por mês
  if (data.status === 'ativo') {
    try {
      const activeBooks = await pb.collection<ClubeBook>('clube_books').getFullList({
        filter: "status = 'ativo'",
      })
      for (const b of activeBooks) {
        await pb.collection('clube_books').update(b.id, { status: 'inativo' })
      }
    } catch {
      /* intentionally ignored */
    }
  }

  return pb.collection<ClubeBook>('clube_books').create(form)
}

export async function updateClubeBook(
  id: string,
  data: {
    title: string
    author: string
    month: string
    description?: string
    status: 'ativo' | 'inativo'
    cover?: File | null
    removeCover?: boolean
  },
): Promise<ClubeBook> {
  const form = new FormData()
  form.append('title', data.title.trim())
  form.append('author', data.author.trim())
  form.append('month', data.month.trim())
  form.append('status', data.status)
  form.append('description', data.description ?? '')
  if (data.removeCover) form.append('cover', '')
  else if (data.cover) form.append('cover', data.cover)

  if (data.status === 'ativo') {
    try {
      const activeBooks = await pb.collection<ClubeBook>('clube_books').getFullList({
        filter: `status = 'ativo' && id != '${id}'`,
      })
      for (const b of activeBooks) {
        await pb.collection('clube_books').update(b.id, { status: 'inativo' })
      }
    } catch {
      /* intentionally ignored */
    }
  }

  return pb.collection<ClubeBook>('clube_books').update(id, form)
}

export async function listClubeDailyPosts(bookId?: string): Promise<ClubeDailyPost[]> {
  const filter = bookId ? `book = '${bookId}'` : ''
  return pb.collection<ClubeDailyPost>('clube_daily_posts').getFullList({
    filter,
    sort: '-date,order',
    expand: 'book',
  })
}

export async function createClubeDailyPost(data: {
  book: string
  date: string
  type: ClubePostType
  title: string
  content: string
  pages_range?: string
  order?: number
}): Promise<ClubeDailyPost> {
  return pb.collection<ClubeDailyPost>('clube_daily_posts').create({
    book: data.book,
    date: data.date,
    type: data.type,
    title: data.title.trim(),
    content: data.content.trim(),
    pages_range: data.pages_range?.trim() || '',
    order: data.order ?? 1,
  })
}

export async function updateClubeDailyPost(
  id: string,
  data: {
    book: string
    date: string
    type: ClubePostType
    title: string
    content: string
    pages_range?: string
    order?: number
  },
): Promise<ClubeDailyPost> {
  return pb.collection<ClubeDailyPost>('clube_daily_posts').update(id, {
    book: data.book,
    date: data.date,
    type: data.type,
    title: data.title.trim(),
    content: data.content.trim(),
    pages_range: data.pages_range?.trim() || '',
    order: data.order ?? 1,
  })
}

export async function deleteClubeDailyPost(id: string): Promise<boolean> {
  return pb.collection('clube_daily_posts').delete(id)
}

export async function listClubeMeetings(bookId?: string): Promise<ClubeMeeting[]> {
  const filter = bookId ? `book = '${bookId}'` : ''
  return pb.collection<ClubeMeeting>('clube_meetings').getFullList({
    filter,
    sort: 'date',
    expand: 'book',
  })
}

export async function createClubeMeeting(data: {
  book?: string
  date: string
  title: string
  description?: string
  meeting_link?: string
  status: 'agendado' | 'realizado' | 'cancelado'
}): Promise<ClubeMeeting> {
  return pb.collection<ClubeMeeting>('clube_meetings').create({
    book: data.book || '',
    date: data.date,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    meeting_link: data.meeting_link?.trim() || '',
    status: data.status,
  })
}

export async function updateClubeMeeting(
  id: string,
  data: {
    book?: string
    date: string
    title: string
    description?: string
    meeting_link?: string
    status: 'agendado' | 'realizado' | 'cancelado'
  },
): Promise<ClubeMeeting> {
  return pb.collection<ClubeMeeting>('clube_meetings').update(id, {
    book: data.book || '',
    date: data.date,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    meeting_link: data.meeting_link?.trim() || '',
    status: data.status,
  })
}

export async function deleteClubeMeeting(id: string): Promise<boolean> {
  return pb.collection('clube_meetings').delete(id)
}

export async function listClubeComments(postId: string): Promise<ClubeComment[]> {
  return pb.collection<ClubeComment>('clube_comments').getFullList({
    filter: `post = '${postId}'`,
    sort: 'created',
    expand: 'author',
  })
}

export async function createClubeComment(postId: string, text: string): Promise<ClubeComment> {
  const currentUserId = pb.authStore.record?.id
  if (!currentUserId) throw new Error('Usuário não autenticado.')
  return pb.collection<ClubeComment>('clube_comments').create(
    {
      post: postId,
      author: currentUserId,
      text: text.trim(),
    },
    {
      expand: 'author',
    },
  )
}

export async function deleteClubeComment(commentId: string): Promise<boolean> {
  return pb.collection('clube_comments').delete(commentId)
}
