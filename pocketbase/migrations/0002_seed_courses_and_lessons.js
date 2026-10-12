migrate(
  (app) => {
    const courseRows = [
      {
        title: 'Mentoria de Liderança',
        slug: 'mentoria-de-lideranca',
        description:
          'Autoliderança, inteligência emocional e gestão de pessoas para líderes completos.',
        status: 'ativo',
        students: 87,
        order: 1,
        lessons: [
          ['Autoliderança e inteligência emocional', 42],
          ['Gestão de tempo, prioridades e pessoas', 38],
          ['Feedbacks e comunicação assertiva', 45],
          ['Ferramentas: DISC e Matriz de Planejamento', 52],
          ['Liderança situacional na prática', 36],
          ['Construção de times de alta performance', 48],
          ['Delegação com confiança e clareza', 34],
          ['Gestão de conflitos e conversas difíceis', 44],
          ['Cultura, valores e segurança psicológica', 40],
          ['Metas, indicadores e acompanhamento', 39],
          ['Tomada de decisão estratégica', 41],
          ['Plano de desenvolvimento da liderança', 50],
        ],
      },
      {
        title: 'Vendas Estratégicas',
        slug: 'vendas-estrategicas',
        description:
          'Funil, prospecção e negociação com inteligência emocional para previsibilidade comercial.',
        status: 'ativo',
        students: 64,
        order: 2,
        lessons: [
          ['Funil de vendas e rotina comercial', 40],
          ['Prospecção, follow-up e fechamento', 46],
          ['Lidando com objeções', 35],
          ['Comunicação estratégica na negociação', 44],
          ['Perfil ideal de cliente e proposta de valor', 38],
          ['Escuta ativa e perguntas poderosas', 32],
          ['Inteligência emocional em vendas', 41],
          ['Organização do pipeline comercial', 37],
          ['Negociação ganha-ganha', 43],
          ['Plano de ação para previsibilidade', 48],
        ],
      },
      {
        title: 'Atendimento ao Cliente',
        slug: 'atendimento-ao-cliente',
        description:
          'Comunicação, empatia e protagonismo para um atendimento humanizado e orientado à solução.',
        status: 'ativo',
        students: 51,
        order: 3,
        lessons: [
          ['Autorresponsabilidade e protagonismo', 35],
          ['Atendimento com empatia e foco em solução', 42],
          ['Ferramentas: Roda da Vida e SWOT', 46],
          ['Comunicação não violenta no atendimento', 39],
          ['Jornada e expectativas do cliente', 37],
          ['Como lidar com clientes desafiadores', 43],
          ['Experiência, encantamento e fidelização', 40],
          ['Plano de melhoria do atendimento', 45],
        ],
      },
      {
        title: 'Inteligência Emocional Integrativa',
        slug: 'inteligencia-emocional-integrativa',
        description:
          'A tríade pensar, sentir e agir como base de toda transformação real e sustentável.',
        status: 'inativo',
        students: 38,
        order: 4,
        lessons: [
          ['A tríade pensar, sentir e agir', 44],
          ['Autorresponsabilidade e autoliderança', 39],
          ['Resultados consistentes e sustentáveis', 41],
          ['Consciência emocional e presença', 36],
          ['Crenças, escolhas e novos comportamentos', 47],
          ['Plano integrativo de transformação', 50],
        ],
      },
    ]

    const courses = app.findCollectionByNameOrId('courses')
    const lessons = app.findCollectionByNameOrId('lessons')

    courseRows.forEach((item) => {
      try {
        app.findFirstRecordByData('courses', 'slug', item.slug)
      } catch (_) {
        const course = new Record(courses)
        course.set('title', item.title)
        course.set('slug', item.slug)
        course.set('description', item.description)
        course.set('thumbnail', '')
        course.set('status', item.status)
        course.set('students_count', item.students)
        course.set('order', item.order)
        app.save(course)
      }

      const course = app.findFirstRecordByData('courses', 'slug', item.slug)
      item.lessons.forEach((lessonItem, index) => {
        const found = app.findRecordsByFilter(
          'lessons',
          "course = '" + course.id + "' && title = '" + lessonItem[0].replace(/'/g, "\\'") + "'",
          'order',
          1,
          0,
        )
        if (found.length === 0) {
          const lesson = new Record(lessons)
          lesson.set('title', lessonItem[0])
          lesson.set('course', course.id)
          lesson.set('duration_min', lessonItem[1])
          lesson.set('order', index + 1)
          app.save(lesson)
        }
      })
    })
  },
  (app) => {
    const slugs = [
      'mentoria-de-lideranca',
      'vendas-estrategicas',
      'atendimento-ao-cliente',
      'inteligencia-emocional-integrativa',
    ]
    slugs.forEach((slug) => {
      try {
        const course = app.findFirstRecordByData('courses', 'slug', slug)
        app.delete(course)
      } catch (_) {}
    })
  },
)
