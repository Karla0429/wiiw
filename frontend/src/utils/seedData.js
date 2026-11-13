import { supabase } from '../config/supabase';

const TEST_STORIES = [
  {
    title: 'Sombras del Pasado',
    genre: 'FANTASIA',
    description: 'Un antiguo secreto despierta en las calles de una ciudad olvidada.',
    cover_url: 'https://picsum.photos/seed/story1/400/600',
    language: 'ES',
    characters: 'Elena, Kael',
    audience: 'Joven adulto',
  },
  {
    title: 'Ecos en el Tiempo',
    genre: 'CIENCIA_FICCION',
    description: 'Una señal del futuro obliga a una científica a reescribir su presente.',
    cover_url: 'https://picsum.photos/seed/story2/400/600',
    language: 'ES',
    characters: 'Dra. Iris Vega, N-7',
    audience: 'Joven adulto',
  },
  {
    title: 'Diario de un Escritor',
    genre: 'ROMANCE',
    description: 'Dos escritores rivales descubren que sus historias siempre terminan juntas.',
    cover_url: 'https://picsum.photos/seed/story3/400/600',
    language: 'ES',
    characters: 'Mateo, Julia',
    audience: 'Adulto',
  },
];

const TEST_CHAPTERS = [
  {
    storyTitle: 'Sombras del Pasado',
    chapter_number: 1,
    title: 'El umbral',
    content: 'La llave giró y, por primera vez en veinte años, la puerta del sótano se abrió.',
  },
  {
    storyTitle: 'Sombras del Pasado',
    chapter_number: 2,
    title: 'Voces en la pared',
    content: 'Elena apoyó la mano sobre la pared y sintió que alguien respondía desde el otro lado.',
  },
  {
    storyTitle: 'Ecos en el Tiempo',
    chapter_number: 1,
    title: 'La señal',
    content: 'El mensaje llegó treinta y siete segundos antes de que la máquina lo emitiera.',
  },
];

const TEST_IDEAS = [
  {
    content: '¿Y si el villano tuviera razón y el héroe fuera el verdadero peligro?',
    image_url: 'https://picsum.photos/seed/idea1/500/500',
  },
  {
    content: 'Una historia de amor contada únicamente a través de cartas que nunca se enviaron.',
    image_url: 'https://picsum.photos/seed/idea2/500/500',
  },
];

let seedInProgress = false;

export async function seedTestData() {
  if (seedInProgress) {
    throw new Error('La carga de datos de prueba ya está en curso.');
  }

  seedInProgress = true;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('No hay un usuario autenticado.');

    const stories = TEST_STORIES.map((story) => ({
      ...story,
      author_id: user.id,
      status: 'published',
    }));

    const { data: insertedStories, error: storiesError } = await supabase
      .from('stories')
      .insert(stories)
      .select('id, title');
    if (storiesError) throw storiesError;
    if (!insertedStories?.length) throw new Error('No se pudieron crear las historias de prueba.');

    const storyIds = insertedStories.reduce((acc, story) => {
      acc[story.title] = story.id;
      return acc;
    }, {});

    const chapters = TEST_CHAPTERS.map(({ storyTitle, ...chapter }) => {
      const storyId = storyIds[storyTitle];
      if (!storyId) throw new Error(`No se encontró la historia "${storyTitle}".`);
      return { ...chapter, story_id: storyId, allow_comments: true };
    });

    const { error: chaptersError } = await supabase.from('chapters').insert(chapters);
    if (chaptersError) throw chaptersError;

    const ideas = TEST_IDEAS.map((idea) => ({ ...idea, author_id: user.id }));

    const { error: ideasError } = await supabase.from('ideas').insert(ideas);
    if (ideasError) throw ideasError;

    return {
      stories: insertedStories.length,
      chapters: chapters.length,
      ideas: ideas.length,
    };
  } finally {
    seedInProgress = false;
  }
}
