migrate(
  (app) => {
    // 1. Atualizar users com campo role (select: adm, coordenador, professor, aluno)
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: true,
          values: ['adm', 'coordenador', 'professor', 'aluno'],
          maxSelect: 1,
        }),
      )
    }

    // Permitir que usuários autenticados listem/vejam outros usuários (necessário para Adm/Coordenador gerenciar e exibir autores no chat)
    // Manter update seguro: Adm/Coordenador pode editar qualquer usuário ou o próprio usuário edita seu perfil (sem mudar role)
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'adm' || " +
      "@request.auth.role = 'coordenador' || " +
      '(id = @request.auth.id && @request.body.role:changed = false)' +
      ')'

    app.save(users)

    // Atualizar admin existente para ter role = 'adm' e demais para 'aluno'
    app
      .db()
      .newQuery("UPDATE users SET role = 'adm' WHERE email = 'edsonlucio@gmail.com'")
      .execute()
    app.db().newQuery("UPDATE users SET role = 'aluno' WHERE role IS NULL OR role = ''").execute()

    // 2. Atualizar lessons com description e video_url
    const lessons = app.findCollectionByNameOrId('lessons')
    if (!lessons.fields.getByName('description')) {
      lessons.fields.add(
        new TextField({
          name: 'description',
          required: false,
          max: 2000,
        }),
      )
    }
    if (!lessons.fields.getByName('video_url')) {
      lessons.fields.add(
        new TextField({
          name: 'video_url',
          required: false,
          max: 500,
        }),
      )
    }
    app.save(lessons)

    // Preencher descrição e exemplos de vídeos didáticos para algumas aulas
    app
      .db()
      .newQuery(`
      UPDATE lessons
      SET description = 'Nesta aula abordamos os principais conceitos de ' || title || ', com metodologia prática e aplicável para sua rotina profissional.'
      WHERE description IS NULL OR description = ''
    `)
      .execute()

    // Amostra de URLs do YouTube para enriquecer as primeiras aulas (vídeos institucionais/desenvolvimento)
    app
      .db()
      .newQuery(`
      UPDATE lessons
      SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      WHERE "order" = 1
    `)
      .execute()
    app
      .db()
      .newQuery(`
      UPDATE lessons
      SET video_url = 'https://youtu.be/M7lc1UVf-VE'
      WHERE "order" = 2
    `)
      .execute()
  },
  (app) => {
    const lessons = app.findCollectionByNameOrId('lessons')
    if (lessons.fields.getByName('description')) {
      lessons.fields.removeByName('description')
    }
    if (lessons.fields.getByName('video_url')) {
      lessons.fields.removeByName('video_url')
    }
    app.save(lessons)

    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    app.save(users)
  },
)
