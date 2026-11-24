import { moodBand } from './engine'
import type { CareItem, GameData, MoodBand, Session, Settings } from './types'

export const FRUITS: CareItem[] = [
  {
    id: 'berry',
    name: 'Berry',
    icon: 'berry',
    cost: 15,
    mood: 7,
    note: 'A tiny tart snack.',
    reactions: {
      happy: 'A berry! Tiny, but it is mine!',
      bored: 'A berry. One whole berry. Thanks.',
      mad: 'A berry? Do I look like a bird?',
    },
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: 'apple',
    cost: 30,
    mood: 11,
    note: 'Crisp and reliable.',
    reactions: {
      happy: 'An apple! Crunchy and perfect!',
      bored: 'An apple. Fine. Thanks.',
      mad: 'An apple? Better than another berry, I suppose.',
    },
  },
  {
    id: 'cherry',
    name: 'Cherries',
    icon: 'cherry',
    cost: 45,
    mood: 16,
    note: 'A sweet little pair.',
    reactions: {
      happy: 'Cherries! Two of them! One for each cheek!',
      bored: 'Cherries. Two is nicer than one, I guess.',
      mad: 'Cherries. Are you trying to bribe me one fruit at a time?',
    },
  },
  {
    id: 'melon',
    name: 'Melon',
    icon: 'melon',
    cost: 70,
    mood: 22,
    note: 'Juicy and refreshing.',
    reactions: {
      happy: 'Melon! It is like a swimming pool for my face!',
      bored: 'Melon. That is a lot of melon.',
      mad: 'A melon? Are you trying to bury me in fruit?',
    },
  },
  {
    id: 'starfruit',
    name: 'Star Fruit',
    icon: 'starfruit',
    cost: 110,
    mood: 32,
    note: 'Rare. Slightly magical.',
    reactions: {
      happy: 'Star fruit! I am holding a tiny star!',
      bored: 'Star fruit. Rare. Still just fruit.',
      mad: 'Star fruit? Shiny does not fix anything.',
    },
  },
]

export const GIFTS: CareItem[] = [
  {
    id: 'ball',
    name: 'Bouncy Ball',
    icon: 'ball',
    cost: 120,
    mood: 20,
    note: 'Boing. Boing. Boing.',
    gift: true,
    reactions: {
      happy: 'A bouncy ball! Best gift ever!',
      bored: 'A ball. Thanks, I guess.',
      mad: 'A ball? That is supposed to fix this?',
    },
  },
  {
    id: 'music',
    name: 'Music Box',
    icon: 'music',
    cost: 180,
    mood: 30,
    note: 'It hums along.',
    gift: true,
    reactions: {
      happy: 'Ohh, a music box! I love it!',
      bored: 'Music box. Cool. I guess.',
      mad: 'Do not try to bribe me with music.',
    },
  },
  {
    id: 'hat',
    name: 'Pom Hat',
    icon: 'hat',
    cost: 260,
    mood: 42,
    note: 'Extremely cozy.',
    gift: true,
    reactions: {
      happy: 'Thanks for the hat! I look amazing!',
      bored: 'Thanks for the hat… I guess.',
      mad: 'A hat? Thanks. Whatever.',
    },
  },
  {
    id: 'box',
    name: 'Gift Box',
    icon: 'gift',
    cost: 340,
    mood: 55,
    note: 'Something nice inside.',
    gift: true,
    reactions: {
      happy: 'A gift box! For me?! Thank you!',
      bored: 'A box. Thanks, I guess.',
      mad: 'A box. Wow. Thanks for nothing.',
    },
  },
  {
    id: 'bed',
    name: 'Cozy Bed',
    icon: 'bed',
    cost: 480,
    mood: 75,
    note: 'Nap heaven.',
    gift: true,
    reactions: {
      happy: 'A cozy bed! Thank you, thank you!',
      bored: 'A bed. Sure. Thanks, I guess.',
      mad: 'I am not sleepy. Take it back.',
    },
  },
]

/** The line the pet says when handed an item, coloured by how it felt beforehand. */
export function reactionFor(item: CareItem, mood: number): string {
  return item.reactions[moodBand(mood)]
}

const PET_LINES: Record<MoodBand, string[]> = {
  happy: ['Yay! More pets!', 'Hehe, that tickles!', 'Purr. Do that again.', 'Best human!'],
  bored: ['Finally, attention!', 'Oh! A pet. Nice.', 'I was waiting for that.', 'Hmm. Keep going.'],
  mad: [
    '...Fine. One pet.',
    'Hmph. You remembered me.',
    'Do not think this fixes everything.',
    'Petting me now? Bold.',
  ],
}

/** A short comment for being petted, coloured by current mood. */
export function petLine(mood: number): string {
  const lines = PET_LINES[moodBand(mood)]
  return lines[Math.floor(Math.random() * lines.length)]
}

export const ALL_ITEMS: CareItem[] = [...FRUITS, ...GIFTS]

export function createInitialSession(goalMinutes = 25): Session {
  return {
    status: 'idle',
    goalSeconds: goalMinutes * 60,
    elapsed: 0,
    awaySeconds: 0,
    noNoSeconds: 0,
    sessionPoints: 0,
    startedAt: null,
    breakReason: null,
    autoPaused: false,
  }
}

export function defaultSettings(): Settings {
  return {
    goalMinutes: 25,
    graceSeconds: 20,
    idleLimitSeconds: 60,
    noNoApps: ['discord', 'steam', 'tiktok'],
    noNoSites: ['youtube', 'tiktok', 'netflix', 'instagram', 'twitter', 'reddit'],
  }
}

export function createInitialData(now = Date.now()): GameData {
  const settings = defaultSettings()
  return {
    pet: {
      name: 'Tomodoro',
      mood: 72,
      points: 60,
      alive: true,
      bornAt: now,
      lastCareAt: now,
      totalFocusSeconds: 0,
      timesLeft: 0,
      leaveWarned: false,
    },
    session: createInitialSession(settings.goalMinutes),
    settings,
    log: [
      {
        id: `welcome-${now}`,
        at: now,
        text: 'A Tomodoro hatched. Start a focus session to earn points together.',
        kind: 'info',
      },
    ],
    lastTick: now,
  }
}
