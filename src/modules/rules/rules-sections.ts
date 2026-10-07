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
    title: 'rules.sections.description.title',
    label: 'rules.sections.description.label'
  },
  setup: {
    id: 'setup',
    number: '02',
    title: 'rules.sections.setup.title',
    label: 'rules.sections.setup.label'
  },
  cards: {
    id: 'cards',
    number: '03',
    title: 'rules.sections.cards.title',
    label: 'rules.sections.cards.label'
  },
  turn: {
    id: 'turn',
    number: '04',
    title: 'rules.sections.turn.title',
    label: 'rules.sections.turn.label'
  },
  abilities: {
    id: 'abilities',
    number: '05',
    title: 'rules.sections.abilities.title',
    label: 'rules.sections.abilities.label'
  },
  bases: {
    id: 'bases',
    number: '06',
    title: 'rules.sections.bases.title',
    label: 'rules.sections.bases.label'
  },
  factions: {
    id: 'factions',
    number: '07',
    title: 'rules.sections.factions.title',
    label: 'rules.sections.factions.label'
  },
  deck: {
    id: 'deck',
    number: '08',
    title: 'rules.sections.deck.title',
    label: 'rules.sections.deck.label'
  },
  victory: {
    id: 'victory',
    number: '09',
    title: 'rules.sections.victory.title',
    label: 'rules.sections.victory.label'
  },
  reference: {
    id: 'reference',
    number: '10',
    title: 'rules.sections.reference.title',
    label: 'rules.sections.reference.label'
  }
} as const satisfies Record<string, RuleSectionInfo>;
