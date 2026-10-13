migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id

    // 1. clube_books
    const books = new Collection({
      name: 'clube_books',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      fields: [
        { name: 'title', type: 'text', required: true, max: 250 },
        { name: 'author', type: 'text', required: true, max: 200 },
        { name: 'month', type: 'text', required: true, max: 20 }, // ex: "2025-11"
        { name: 'description', type: 'text' },
        {
          name: 'cover',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clube_books_status ON clube_books (status)',
        'CREATE INDEX idx_clube_books_month ON clube_books (month)',
      ],
    })
    app.save(books)
    const booksId = books.id

    // 2. clube_daily_posts
    const posts = new Collection({
      name: 'clube_daily_posts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      fields: [
        {
          name: 'book',
          type: 'relation',
          required: true,
          collectionId: booksId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['pergunta', 'resumo', 'provocacao'],
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true, max: 300 },
        { name: 'content', type: 'text', required: true },
        { name: 'pages_range', type: 'text', max: 100 },
        { name: 'order', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clube_daily_book_date ON clube_daily_posts (book, date)',
        'CREATE INDEX idx_clube_daily_type ON clube_daily_posts (type)',
      ],
    })
    app.save(posts)
    const postsId = posts.id

    // 3. clube_meetings
    const meetings = new Collection({
      name: 'clube_meetings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      fields: [
        {
          name: 'book',
          type: 'relation',
          required: false,
          collectionId: booksId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'title', type: 'text', required: true, max: 300 },
        { name: 'description', type: 'text' },
        { name: 'meeting_link', type: 'url' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendado', 'realizado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clube_meetings_date ON clube_meetings (date)',
        'CREATE INDEX idx_clube_meetings_status ON clube_meetings (status)',
      ],
    })
    app.save(meetings)

    // 4. clube_comments
    const comments = new Collection({
      name: 'clube_comments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.body.author = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      deleteRule:
        "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      fields: [
        {
          name: 'post',
          type: 'relation',
          required: true,
          collectionId: postsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'author',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'text', type: 'text', required: true, max: 2000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clube_comments_post ON clube_comments (post)',
        'CREATE INDEX idx_clube_comments_author ON clube_comments (author)',
      ],
    })
    app.save(comments)
  },
  (app) => {
    try {
      const comments = app.findCollectionByNameOrId('clube_comments')
      app.delete(comments)
    } catch (_) {}
    try {
      const meetings = app.findCollectionByNameOrId('clube_meetings')
      app.delete(meetings)
    } catch (_) {}
    try {
      const posts = app.findCollectionByNameOrId('clube_daily_posts')
      app.delete(posts)
    } catch (_) {}
    try {
      const books = app.findCollectionByNameOrId('clube_books')
      app.delete(books)
    } catch (_) {}
  },
)
