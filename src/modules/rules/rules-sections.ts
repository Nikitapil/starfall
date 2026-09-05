export interface RuleSectionInfo {
  id: string;
  number: string;
  title: string;
  label: string;
}

export const rulesSections = {
  description: {
    id: 'description',
    number: '01',
    title: 'Description',
    label: 'Description'
  },
  setup: {
    id: 'setup',
    number: '02',
    title: 'Set up the sector',
    label: 'Setup'
  },
  cards: {
    id: 'cards',
    number: '03',
    title: 'Cards and resources',
    label: 'Cards & resources'
  },
  turn: {
    id: 'turn',
    number: '04',
    title: 'Your turn',
    label: 'Your turn'
  },
  abilities: {
    id: 'abilities',
    number: '05',
    title: 'Card abilities',
    label: 'Abilities'
  },
  bases: {
    id: 'bases',
    number: '06',
    title: 'Bases, Defense, and Outposts',
    label: 'Bases & outposts'
  },
  factions: {
    id: 'factions',
    number: '07',
    title: 'The four factions',
    label: 'Factions'
  },
  deck: {
    id: 'deck',
    number: '08',
    title: 'Deck, discard pile, and Scrap Heap',
    label: 'Deck & scrap'
  },
  victory: {
    id: 'victory',
    number: '09',
    title: 'Winning the battle',
    label: 'Victory'
  },
  reference: {
    id: 'reference',
    number: '10',
    title: 'Quick reference',
    label: 'Quick reference'
  }
} as const satisfies Record<string, RuleSectionInfo>;
