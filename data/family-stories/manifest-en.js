/* English family stories. Parallel to the Chinese family storybook; reuses Chinese scene art. */
window.FAMILY_STORIES_EN = [
  {
    id: 'rainbow-umbrella',
    title: 'The Rain Stops',
    place: 'Going Home',
    characters: ['HeiHei', 'Froggie'],
    summary: 'In autumn rain, HeiHei and Froggie share an orange umbrella, then fold it when the sun comes out.',
    pages: [
      {
        sentence: 'In autumn, it starts to rain.',
        focusWords: ['autumn', 'rain'],
        distractors: ['summer', 'snow'],
        dialogue: { speaker: 'Froggie', text: "It's raining. Let's walk together." }
      },
      {
        sentence: 'Froggie holds an orange umbrella.',
        focusWords: ['orange', 'umbrella'],
        distractors: ['purple', 'balloon'],
        dialogue: { speaker: 'Froggie', text: 'I brought an orange umbrella.' }
      },
      {
        sentence: 'HeiHei and Froggie walk together.',
        focusWords: ['walk', 'together'],
        distractors: ['sleep', 'alone'],
        dialogue: { speaker: 'HeiHei', text: 'I will hold the umbrella.' }
      },
      {
        sentence: 'There is one little puddle.',
        focusWords: ['one', 'puddle'],
        distractors: ['two', 'boat'],
        dialogue: { speaker: 'HeiHei', text: 'Look! There is a little puddle ahead!' }
      },
      {
        sentence: 'The rain stops. The sun comes out.',
        focusWords: ['sun', 'out'],
        distractors: ['moon', 'in'],
        dialogue: { speaker: 'Froggie', text: 'The rain stopped. The sun is out!' }
      },
      {
        sentence: 'They fold the umbrella and go home.',
        focusWords: ['fold', 'home'],
        distractors: ['fly', 'school'],
        dialogue: { speaker: 'HeiHei', text: "Let's put the umbrella away and go home." }
      }
    ]
  },
  {
    id: 'park-kite',
    title: 'The Kite',
    place: 'Hong Kong Park',
    characters: ['Karl', 'HeiHei'],
    summary: 'Karl and HeiHei fly a kite at Hong Kong Park, then pack it away after a park worker helps.',
    pages: [
      {
        sentence: 'Karl and HeiHei come to the park.',
        focusWords: ['come', 'park'],
        distractors: ['leave', 'beach'],
        dialogue: { speaker: 'HeiHei', text: "Let's find an open space for the kite!" }
      },
      {
        sentence: 'Karl holds the kite. HeiHei holds the spool.',
        focusWords: ['holds', 'spool'],
        distractors: ['drops', 'bag'],
        dialogue: { speaker: 'Karl', text: 'You take the spool. I will hold the kite.' }
      },
      {
        sentence: 'The wind lifts the kite.',
        focusWords: ['lifts', 'kite'],
        distractors: ['drops', 'ball'],
        dialogue: { speaker: 'Karl', text: 'The kite is flying!' }
      },
      {
        sentence: 'Karl holds the long string.',
        focusWords: ['long', 'string'],
        distractors: ['short', 'stick'],
        dialogue: { speaker: 'HeiHei', text: 'Let\'s let out the string slowly. I will watch the kite.' }
      },
      {
        sentence: 'A park worker helps them get the kite down.',
        focusWords: ['helps', 'get'],
        distractors: ['hides', 'lose'],
        dialogue: { speaker: 'HeiHei', text: 'Excuse me, can you help us get the kite down?' }
      },
      {
        sentence: 'Karl and HeiHei pack the kite.',
        focusWords: ['pack', 'kite'],
        distractors: ['throw', 'balloon'],
        dialogue: { speaker: 'Karl', text: 'Next time, shall we switch jobs?' }
      }
    ]
  }
];
