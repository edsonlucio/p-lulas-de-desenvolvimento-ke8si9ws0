/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar a collection 'lessons' com os novos campos de materiais e thumbnail
    const lessons = app.findCollectionByNameOrId('lessons')

    // thumbnail: file para capa da aula (PNG, JPG, WEBP até 5MB)
    if (!lessons.fields.getByName('thumbnail')) {
      lessons.fields.add(
        new FileField({
          name: 'thumbnail',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          thumbs: ['640x360'],
        }),
      )
    }

    // video_upload: arquivo de vídeo gravado (mp4, webm, quicktime, x-matroska até 250MB)
    if (!lessons.fields.getByName('video_upload')) {
      lessons.fields.add(
        new FileField({
          name: 'video_upload',
          maxSelect: 1,
          maxSize: 262144000,
          mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
        }),
      )
    }

    // pdf_file: arquivo PDF para visualização e download
    if (!lessons.fields.getByName('pdf_file')) {
      lessons.fields.add(
        new FileField({
          name: 'pdf_file',
          maxSelect: 1,
          maxSize: 52428800, // 50MB
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    // pdf_url: texto/url alternativa para PDF hospedado externamente
    if (!lessons.fields.getByName('pdf_url')) {
      lessons.fields.add(
        new TextField({
          name: 'pdf_url',
          required: false,
          max: 1000,
        }),
      )
    }

    // ppt_file: arquivo PowerPoint (.ppt, .pptx)
    if (!lessons.fields.getByName('ppt_file')) {
      lessons.fields.add(
        new FileField({
          name: 'ppt_file',
          maxSelect: 1,
          maxSize: 104857600, // 100MB
          mimeTypes: [
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ],
        }),
      )
    }

    // ppt_url: texto/url alternativa para PPT hospedado externamente
    if (!lessons.fields.getByName('ppt_url')) {
      lessons.fields.add(
        new TextField({
          name: 'ppt_url',
          required: false,
          max: 1000,
        }),
      )
    }

    app.save(lessons)

    // 2. Criar a collection 'lesson_progress' para registrar o progresso do aluno
    // Regras:
    // list/view: aluno vê o próprio progresso, adm/coordenador vê todos
    // create: aluno cria se user for ele mesmo (@request.body.user = @request.auth.id), adm/coord também pode
    // update: aluno edita se user for ele mesmo (@request.body.user = @request.auth.id && user = @request.auth.id), adm/coord também pode
    // delete: aluno deleta o próprio, adm/coord pode
    const progressListRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')"
    const progressCreateRule =
      "@request.auth.id != '' && (@request.body.user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')"
    const progressUpdateRule =
      "@request.auth.id != '' && ((user = @request.auth.id && @request.body.user = @request.auth.id) || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')"
    const progressDeleteRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')"

    const progressCollection = new Collection({
      name: 'lesson_progress',
      type: 'base',
      listRule: progressListRule,
      viewRule: progressListRule,
      createRule: progressCreateRule,
      updateRule: progressUpdateRule,
      deleteRule: progressDeleteRule,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        },
        {
          name: 'lesson',
          type: 'relation',
          required: true,
          collectionId: lessons.id,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        },
        {
          name: 'completed',
          type: 'bool',
          required: false,
        },
        {
          name: 'completed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_progress_user_lesson ON lesson_progress (user, lesson)',
        'CREATE INDEX idx_progress_user ON lesson_progress (user)',
        'CREATE INDEX idx_progress_lesson ON lesson_progress (lesson)',
      ],
    })

    app.save(progressCollection)
  },
  (app) => {
    try {
      const progressCollection = app.findCollectionByNameOrId('lesson_progress')
      app.delete(progressCollection)
    } catch (_) {}

    try {
      const lessons = app.findCollectionByNameOrId('lessons')
      if (lessons.fields.getByName('thumbnail')) lessons.fields.removeByName('thumbnail')
      if (lessons.fields.getByName('video_upload')) lessons.fields.removeByName('video_upload')
      if (lessons.fields.getByName('pdf_file')) lessons.fields.removeByName('pdf_file')
      if (lessons.fields.getByName('pdf_url')) lessons.fields.removeByName('pdf_url')
      if (lessons.fields.getByName('ppt_file')) lessons.fields.removeByName('ppt_file')
      if (lessons.fields.getByName('ppt_url')) lessons.fields.removeByName('ppt_url')
      app.save(lessons)
    } catch (_) {}
  },
)
