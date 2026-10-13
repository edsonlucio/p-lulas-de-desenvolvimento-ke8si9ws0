import pb from '@/lib/pocketbase/client'
import type { CommunityPost, CommunityPostStatus, CommunityReply } from '@/types/backoffice'

/**
 * Lista posts da comunidade.
 * Se courseId for fornecido, busca os posts daquele curso.
 * Se courseId for null ou 'geral', busca posts onde course = null ou vazio (comunidade geral).
 * Se includePendingForUser for passado (aluno), inclui posts onde author = userId mesmo se pendente.
 */
export async function listCommunityPosts(options?: {
  courseId?: string | null
  status?: CommunityPostStatus
  userId?: string
}): Promise<CommunityPost[]> {
  const filters: string[] = []

  if (options?.courseId === 'geral' || options?.courseId === null) {
    filters.push('course = null || course = ""')
  } else if (options?.courseId) {
    filters.push(pb.filter('course = {:c}', { c: options.courseId }))
  }

  if (options?.status) {
    filters.push(pb.filter('status = {:s}', { s: options.status }))
  }

  const queryOptions: Record<string, unknown> = {
    sort: '-created',
    expand: 'author,course,moderated_by',
  }
  if (filters.length > 0) {
    queryOptions.filter = filters.join(' && ')
  }

  const posts = await pb.collection<CommunityPost>('community_posts').getFullList(queryOptions)

  // Carregar contagem de respostas em paralelo para cada post
  const counts = await Promise.all(
    posts.map(async (p) => {
      try {
        const res = await pb.collection('community_replies').getList(1, 1, {
          filter: pb.filter('post = {:p}', { p: p.id }),
        })
        return { id: p.id, count: res.totalItems }
      } catch {
        return { id: p.id, count: 0 }
      }
    }),
  )
  const countMap = new Map(counts.map((c) => [c.id, c.count]))

  return posts.map((p) => ({
    ...p,
    replies_count: countMap.get(p.id) ?? 0,
  }))
}

export async function getCommunityPost(id: string): Promise<CommunityPost> {
  const post = await pb
    .collection<CommunityPost>('community_posts')
    .getOne(id, { expand: 'author,course,moderated_by' })
  try {
    const res = await pb.collection('community_replies').getList(1, 1, {
      filter: pb.filter('post = {:p}', { p: id }),
    })
    post.replies_count = res.totalItems
  } catch {
    post.replies_count = 0
  }
  return post
}

export async function createCommunityPost(data: {
  authorId: string
  courseId?: string | null
  title: string
  content: string
}): Promise<CommunityPost> {
  return pb.collection<CommunityPost>('community_posts').create({
    author: data.authorId,
    course: data.courseId && data.courseId !== 'geral' ? data.courseId : null,
    title: data.title.trim(),
    content: data.content.trim(),
    status: 'pendente', // Novo post sempre entra como pendente para moderação
  })
}

export async function moderateCommunityPost(
  postId: string,
  decision: {
    status: 'aprovado' | 'rejeitado'
    moderatorId: string
    rejectionReason?: string
  },
): Promise<CommunityPost> {
  return pb.collection<CommunityPost>('community_posts').update(postId, {
    status: decision.status,
    moderated_by: decision.moderatorId,
    moderated_at: new Date().toISOString(),
    rejection_reason:
      decision.status === 'rejeitado' ? (decision.rejectionReason || '').trim() : '',
  })
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  await pb.collection('community_posts').delete(postId)
}

export async function listCommunityReplies(postId: string): Promise<CommunityReply[]> {
  return pb.collection<CommunityReply>('community_replies').getFullList({
    filter: pb.filter('post = {:post}', { post: postId }),
    sort: 'created',
    expand: 'author',
  })
}

export async function createCommunityReply(data: {
  postId: string
  authorId: string
  content: string
}): Promise<CommunityReply> {
  return pb.collection<CommunityReply>('community_replies').create(
    {
      post: data.postId,
      author: data.authorId,
      content: data.content.trim(),
    },
    { expand: 'author' },
  )
}

export async function deleteCommunityReply(replyId: string): Promise<void> {
  await pb.collection('community_replies').delete(replyId)
}

export async function countPendingCommunityPosts(): Promise<number> {
  try {
    const res = await pb.collection('community_posts').getList(1, 1, {
      filter: 'status = "pendente"',
    })
    return res.totalItems
  } catch {
    return 0
  }
}
