/* Space Patrol pilot: Mission to Blue Moon 1–3.
 * Every book, page and target word keeps a trace back to the local source
 * library. The website consumes only the selected derived assets.
 */

export const SPACE_PATROL_BLUE_MOON_ARC = {
  id: 'blue-moon-arc-1',
  title: 'Mission to Blue Moon',
  level: 'Level 2',
  sourceSet: 'Space Patrol',
  status: 'pilot',
  books: [
    {
      id: 'blue-moon-1',
      episode: 1,
      title: 'The First Day',
      sourcePdf: 'source-materials/Space Patrol/Space Patrol故事書制作/001. Space Patrol, Mission to Blue Moon 1 - The First Day.pdf',
      sourceAudio: 'source-materials/Space Patrol/Space Patrol音频/1-54/Space Patrol 01.mp3',
      derivedAudio: './assets/space-patrol/blue-moon-arc/audio/blue-moon-1.mp3',
      pages: Array.from({ length: 6 }, (_, index) => ({
        pdfPage: index + 1,
        image: `./assets/space-patrol/blue-moon-arc/book-01/page-${String(index + 1).padStart(2, '0')}.webp`,
      })),
      wordSourcePdf: 'source-materials/Space Patrol/word/01、Mission to Blue Moon 1 The First Day.pdf',
      words: [
        { word: 'space', meaning: '太空', storyPage: 2, quote: 'Ugh. Space dust!' },
        { word: 'rookie', meaning: '新手', storyPage: 3, quote: "I'm finally a rookie!" },
        { word: 'captain', meaning: '隊長', storyPage: 3, quote: "Where's Captain Nova's office?" },
        { word: 'planet', meaning: '行星', storyPage: 4, quote: 'My planet has bugs bigger than you!' },
      ],
    },
    {
      id: 'blue-moon-2',
      episode: 2,
      title: 'A Big Mistake',
      sourcePdf: 'source-materials/Space Patrol/Space Patrol故事書制作/002. Space Patrol, Mission to Blue Moon 2 - A Big Mistake.pdf',
      sourceAudio: 'source-materials/Space Patrol/Space Patrol音频/1-54/Space Patrol 02.mp3',
      derivedAudio: './assets/space-patrol/blue-moon-arc/audio/blue-moon-2.mp3',
      pages: Array.from({ length: 6 }, (_, index) => ({
        pdfPage: index + 1,
        image: `./assets/space-patrol/blue-moon-arc/book-02/page-${String(index + 1).padStart(2, '0')}.webp`,
      })),
      wordSourcePdf: 'source-materials/Space Patrol/word/02、Mission to Blue Moon 2 A Big Mistake.pdf',
      words: [
        { word: 'mistake', meaning: '錯誤', storyPage: 2, quote: 'That message was a big mistake.' },
        { word: 'message', meaning: '消息', storyPage: 2, quote: 'But I got this message from Space Patrol.' },
        { word: 'robot', meaning: '機械人', storyPage: 5, quote: 'You two need robots.' },
        { word: 'rust', meaning: '鐵鏽', storyPage: 6, quote: 'It had dents and rust.' },
      ],
    },
    {
      id: 'blue-moon-3',
      episode: 3,
      title: 'Rusty Robot',
      sourcePdf: 'source-materials/Space Patrol/Space Patrol故事書制作/003. Space Patrol, Mission to Blue Moon 3 - Rusty Robot.pdf',
      sourceAudio: 'source-materials/Space Patrol/Space Patrol音频/1-54/Space Patrol 03.mp3',
      derivedAudio: './assets/space-patrol/blue-moon-arc/audio/blue-moon-3.mp3',
      pages: Array.from({ length: 6 }, (_, index) => ({
        pdfPage: index + 1,
        image: `./assets/space-patrol/blue-moon-arc/book-03/page-${String(index + 1).padStart(2, '0')}.webp`,
      })),
      wordSourcePdf: 'source-materials/Space Patrol/word/03、Mission to Blue Moon 3 Rusty Robot.pdf',
      words: [
        { word: 'rusty', meaning: '生鏽的', storyPage: 2, quote: 'There was lots of rust.' },
        { word: 'fix', meaning: '修理', storyPage: 2, quote: 'I can fix her.' },
        { word: 'mission', meaning: '任務', storyPage: 4, quote: 'Rookies, I have a mission for you.' },
        { word: 'tool', meaning: '工具', storyPage: 5, quote: 'Commander Cosmo lost his favorite tool.' },
      ],
    },
  ],
};

export const SPACE_PATROL_PILOT_QUESTIONS = [
  ['space', '太空', 'blue-moon-1'],
  ['rookie', '新手', 'blue-moon-1'],
  ['captain', '隊長', 'blue-moon-1'],
  ['planet', '行星', 'blue-moon-1'],
  ['mistake', '錯誤', 'blue-moon-2'],
  ['message', '消息', 'blue-moon-2'],
  ['robot', '機械人', 'blue-moon-2'],
  ['rust', '鐵鏽', 'blue-moon-2'],
  ['fix', '修理', 'blue-moon-3'],
  ['mission', '任務', 'blue-moon-3'],
].map(([answer, meaning, bookId]) => ({ answer, meaning, bookId }));
