migrate(
  (app) => {
    // 1. Seed do livro do mês "Metanoia — a chave está sem sua cabeça" de JK Carvalho
    const booksCol = app.findCollectionByNameOrId('clube_books')
    const postsCol = app.findCollectionByNameOrId('clube_daily_posts')
    const meetingsCol = app.findCollectionByNameOrId('clube_meetings')
    const commentsCol = app.findCollectionByNameOrId('clube_comments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const coursesCol = app.findCollectionByNameOrId('courses')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')

    let bookRecord = null
    try {
      bookRecord = app.findFirstRecordByData(
        'clube_books',
        'title',
        'Metanoia — a chave está sem sua cabeça',
      )
    } catch (_) {
      bookRecord = new Record(booksCol)
      bookRecord.set('title', 'Metanoia — a chave está sem sua cabeça')
      bookRecord.set('author', 'JK Carvalho')
      bookRecord.set('month', '2025-11')
      bookRecord.set(
        'description',
        'Uma jornada profunda de renovação da mente, autoconsciência e expansão de potencial. Um livro para transformar crenças limitantes em atitudes de alto impacto.',
      )
      bookRecord.set('status', 'ativo')
      app.save(bookRecord)
    }

    const bookId = bookRecord.id

    // Encontrar admin ou primeiro usuário para autor de comentários do seed
    let seedAuthorId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'edsonlucio@gmail.com')
      seedAuthorId = admin.id
    } catch (_) {
      try {
        const anyUser = app.findRecordsByFilter('_pb_users_auth_', "id != ''", 'created', 1, 0)
        if (anyUser.length > 0) seedAuthorId = anyUser[0].id
      } catch (_) {}
    }

    // 2. Posts diários de leitura dirigida de exemplo
    // Três tipos por dia: resumo (com pages_range), pergunta e provocacao
    const sampleDays = [
      {
        dateStr: '2025-10-28 09:00:00.000Z',
        resumo: {
          title: 'Resumo do Dia · O Poder do Ponto Cego',
          content:
            'A metanoia começa quando reconhecemos que as maiores travas do nosso crescimento estão exatamente nas certezas que nunca questionamos. Ao encarar nossos pontos cegos com humildade, abrimos espaço para uma liderança autêntica e conectada.',
          pages_range: 'páginas 01 a 22',
        },
        pergunta: {
          title: 'Pergunta do Dia · Autoanálise',
          content:
            'Qual foi a última certeza absoluta que você teve e que, ao ser confrontada com a realidade, revelou-se um simples ponto cego da sua rotina?',
        },
        provocacao: {
          title: 'Provocação · A Chave na Cabeça',
          content:
            'Você está esperando uma oportunidade externa abrir as portas ou já percebeu que a fechadura só se destranca pelo lado de dentro da sua própria mente?',
        },
      },
      {
        dateStr: '2025-10-29 09:00:00.000Z',
        resumo: {
          title: 'Resumo do Dia · Desconstruindo Crenças Limitantes',
          content:
            'O autor JK Carvalho destaca como narrativas antigas ditam nossos comportamentos atuais no piloto automático. A chave está em identificar a raiz de cada medo antes de reagir impulsivamente aos desafios.',
          pages_range: 'páginas 23 a 48',
        },
        pergunta: {
          title: 'Pergunta do Dia · Crença Raiz',
          content:
            'Qual crença sobre si mesmo você repetiu tantas vezes que passou a acreditar que é uma verdade imutável da sua personalidade?',
        },
        provocacao: {
          title: 'Provocação · O Custo da Inércia',
          content:
            'Permanecer na zona de conforto mental não é seguro: é apenas o jeito mais lento e doloroso de se arrepender lá na frente.',
        },
      },
      {
        dateStr: '2025-10-30 09:00:00.000Z',
        resumo: {
          title: 'Resumo do Dia · Relações e Espelhamento',
          content:
            'Toda convivência humana é um espelho. O que nos incomoda profundamente no outro revela exatamente a área interna que ainda precisa de metanoia e maturidade emocional.',
          pages_range: 'páginas 49 a 76',
        },
        pergunta: {
          title: 'Pergunta do Dia · O Espelho do Outro',
          content:
            'Que atitude de um colega ou liderado tem gerado irritação em você ultimamente, e o que isso pode estar espelhando sobre a sua própria postura?',
        },
        provocacao: {
          title: 'Provocação · Julgamento vs. Empatia',
          content:
            'É muito fácil apontar falhas nos outros; o desafio dos grandes líderes é aplicar a mesma régua rigorosa à sua própria consciência diária.',
        },
      },
      {
        dateStr: '2025-11-01 09:00:00.000Z',
        resumo: {
          title: 'Resumo do Dia · A Ação Alinhada à Nova Mente',
          content:
            'Metanoia não é filosofia passiva: é intenção colocada em prática. A mudança de mentalidade só se consolida quando os microcomportamentos diários passam a refletir o novo padrão.',
          pages_range: 'páginas 77 a 115',
        },
        pergunta: {
          title: 'Pergunta do Dia · Prática Real',
          content:
            'Se a sua nova mentalidade começasse a valer 100% hoje, qual seria a primeira decisão difícil que você tomaria sem hesitar?',
        },
        provocacao: {
          title: 'Provocação · Pensar não basta',
          content:
            'Pensar diferente sem agir diferente é apenas ilusão sofisticada. A chave que gira a fechadura precisa de movimento na mão.',
        },
      },
    ]

    for (let i = 0; i < sampleDays.length; i++) {
      const day = sampleDays[i]

      // Card 1: Resumo
      try {
        app.findFirstRecordByData('clube_daily_posts', 'title', day.resumo.title)
      } catch (_) {
        const post = new Record(postsCol)
        post.set('book', bookId)
        post.set('date', day.dateStr)
        post.set('type', 'resumo')
        post.set('title', day.resumo.title)
        post.set('content', day.resumo.content)
        post.set('pages_range', day.resumo.pages_range)
        post.set('order', 1)
        app.save(post)
      }

      // Card 2: Pergunta
      let perguntaRecord = null
      try {
        perguntaRecord = app.findFirstRecordByData('clube_daily_posts', 'title', day.pergunta.title)
      } catch (_) {
        const post = new Record(postsCol)
        post.set('book', bookId)
        post.set('date', day.dateStr)
        post.set('type', 'pergunta')
        post.set('title', day.pergunta.title)
        post.set('content', day.pergunta.content)
        post.set('pages_range', '')
        post.set('order', 2)
        app.save(post)
        perguntaRecord = post
      }

      // Card 3: Provocação
      try {
        app.findFirstRecordByData('clube_daily_posts', 'title', day.provocacao.title)
      } catch (_) {
        const post = new Record(postsCol)
        post.set('book', bookId)
        post.set('date', day.dateStr)
        post.set('type', 'provocacao')
        post.set('title', day.provocacao.title)
        post.set('content', day.provocacao.content)
        post.set('pages_range', '')
        post.set('order', 3)
        app.save(post)
      }

      // Adicionar um comentário de exemplo no primeiro card de pergunta se houver autor
      if (i === 0 && seedAuthorId && perguntaRecord) {
        try {
          app.findFirstRecordByData('clube_comments', 'post', perguntaRecord.id)
        } catch (_) {
          const comment = new Record(commentsCol)
          comment.set('post', perguntaRecord.id)
          comment.set('author', seedAuthorId)
          comment.set(
            'text',
            'Excelente reflexão! Para mim o ponto cego era achar que delegar significava não acompanhar mais. Mudei a postura e o time respondeu muito melhor.',
          )
          app.save(comment)
        }
      }
    }

    // 3. Encontro Virtual de Discussão — Metanoia em 03 de Novembro
    try {
      app.findFirstRecordByData(
        'clube_meetings',
        'title',
        'Encontro Virtual de Discussão — Metanoia',
      )
    } catch (_) {
      const meeting = new Record(meetingsCol)
      meeting.set('book', bookId)
      meeting.set('date', '2025-11-03 20:00:00.000Z')
      meeting.set('title', 'Encontro Virtual de Discussão — Metanoia')
      meeting.set(
        'description',
        'Grande roda de debate virtual dos membros do Clube das Pílulas sobre as transformações, aprendizados práticos e insights extraídos da leitura de Metanoia — a chave está sem sua cabeça, com mediação ao vivo.',
      )
      meeting.set('meeting_link', 'https://meet.google.com/pilulas-clube-metanoia')
      meeting.set('status', 'agendado')
      app.save(meeting)
    }

    // Encontro anterior de exemplo para histórico
    try {
      app.findFirstRecordByData('clube_meetings', 'title', 'Encontro Virtual de Abertura do Ciclo')
    } catch (_) {
      const pastMeeting = new Record(meetingsCol)
      pastMeeting.set('book', bookId)
      pastMeeting.set('date', '2025-10-25 19:30:00.000Z')
      pastMeeting.set('title', 'Encontro Virtual de Abertura do Ciclo')
      pastMeeting.set(
        'description',
        'Alinhamento do cronograma de leitura dirigida, apresentação dos participantes e primeiras impressões.',
      )
      pastMeeting.set('meeting_link', 'https://meet.google.com/pilulas-abertura')
      pastMeeting.set('status', 'realizado')
      app.save(pastMeeting)
    }

    // 4. Seed de matrícula de exemplo para o usuário de teste (se existir)
    // Permite que nos testes tenhamos um curso matriculado e outros bloqueados para o aluno
    try {
      const testStudent = app.findAuthRecordByEmail('_pb_users_auth_', 'edson_lucio@hotmail.com')
      const firstCourse = app.findFirstRecordByData('courses', 'slug', 'mentoria-de-lideranca')
      if (testStudent && firstCourse) {
        try {
          app.findFirstRecordByData('enrollments', 'user', testStudent.id)
        } catch (_) {
          const enroll = new Record(enrollmentsCol)
          enroll.set('user', testStudent.id)
          enroll.set('course', firstCourse.id)
          enroll.set('status', 'ativo')
          enroll.set('purchased_at', '2025-10-15 14:00:00.000Z')
          app.save(enroll)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Reverter seeds se necessário
    try {
      const meeting = app.findFirstRecordByData(
        'clube_meetings',
        'title',
        'Encontro Virtual de Discussão — Metanoia',
      )
      app.delete(meeting)
    } catch (_) {}
    try {
      const book = app.findFirstRecordByData(
        'clube_books',
        'title',
        'Metanoia — a chave está sem sua cabeça',
      )
      app.delete(book)
    } catch (_) {}
  },
)
