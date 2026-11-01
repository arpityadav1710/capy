// Friends of Capy: each night you tuck Capy in, a little animal comes to sit on its head
// (real capybaras let birds, monkeys and ducklings ride on them). Rare ones arrive on streak milestones.
// Also Chill Days: earned every 7-day streak, they quietly cover a day you forgot.
import { dayKey, prevDay, startOfDay } from './stats';
import { getSetting, setSetting } from './storage';

export type Visitor = { id: string; emoji: string; name: string; story: string; rareAt?: number };

export const VISITORS: Visitor[] = [
  { id: 'duckling', emoji: '🐥', name: 'Dumpling the duckling', story: 'Followed Capy home and never left.' },
  { id: 'sparrow', emoji: '🐦', name: 'Pip the sparrow', story: 'Just wanted a warm head to sit on.' },
  { id: 'kitten', emoji: '🐱', name: 'Miso the kitten', story: 'Naps anywhere soft. Capy counts.' },
  { id: 'turtle', emoji: '🐢', name: 'Tortellini', story: 'Took three days to arrive. Worth it.' },
  { id: 'frog', emoji: '🐸', name: 'Ribbit Ravi', story: 'Came for the hot spring, stayed for Capy.' },
  { id: 'snail', emoji: '🐌', name: 'Shelly', story: 'Slow and steady, like your streak.' },
  { id: 'ladybug', emoji: '🐞', name: 'Lucky Lado', story: 'Seven spots, seven good days.' },
  { id: 'butterfly', emoji: '🦋', name: 'Titli', story: 'Only lands on very calm capybaras.' },
  { id: 'bunny', emoji: '🐰', name: 'Gajar the bunny', story: 'Brought a carrot. Did not share.' },
  { id: 'hamster', emoji: '🐹', name: 'Laddoo', story: 'Saves seeds in its cheeks, like you save rupees.' },
  { id: 'chick', emoji: '🐤', name: 'Chirpy', story: 'Says one thing all day: cheep!' },
  { id: 'owl', emoji: '🦉', name: 'Professor Hoot', story: 'Up late to check your numbers.' },
  { id: 'squirrel', emoji: '🐿️', name: 'Nutmeg', story: 'Buries snacks. Forgets where. Relatable.' },
  { id: 'hedgehog', emoji: '🦔', name: 'Prickles', story: 'Spiky outside, very soft inside.' },
  { id: 'parrot', emoji: '🦜', name: 'Mithu', story: 'Repeats everything you tell Capy.' },
  { id: 'mouse', emoji: '🐭', name: 'Chutki', story: 'Tiny. Brave. Loves chai crumbs.' },
  { id: 'puppy', emoji: '🐶', name: 'Bruno', story: 'Very excited to meet Capy. Very.' },
  { id: 'monkey', emoji: '🐒', name: 'Bandar Bunty', story: 'Rides Capy like a little bus.' },
  { id: 'bee', emoji: '🐝', name: 'Buzz', story: 'Busy all day, resting on Capy at night.' },
  { id: 'penguin', emoji: '🐧', name: 'Pengu', story: 'Lost on the way to the snow. Happy here.' },
  { id: 'koala', emoji: '🐨', name: 'Kiki the koala', story: 'Second calmest animal. After Capy.' },
  { id: 'crab', emoji: '🦀', name: 'Sideways Sid', story: 'Walks sideways onto Capy every time.' },
  { id: 'duck', emoji: '🦆', name: 'Quackers', story: 'Shares the hot spring politely.' },
  { id: 'otter', emoji: '🦦', name: 'Ollie the otter', story: 'Holds Capy’s paw while floating.' },
  // Rare: only on streak milestones.
  { id: 'peacock', emoji: '🦚', name: 'Mor the peacock', story: 'Arrives only after a week of showing up.', rareAt: 7 },
  { id: 'panda', emoji: '🐼', name: 'Bao the panda', story: 'Two whole weeks! Bao had to see.', rareAt: 14 },
  { id: 'fox', emoji: '🦊', name: 'Saffron the fox', story: 'A month of evenings with Capy. Legendary.', rareAt: 30 },
  { id: 'dragon', emoji: '🐉', name: 'Little dragon', story: '100 days. The dragon bows to you.', rareAt: 100 },
];

const byId = Object.fromEntries(VISITORS.map((v) => [v.id, v]));
const COMMON = VISITORS.filter((v) => !v.rareAt);
const MAX_CHILL = 3;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = getSetting(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** day ("2026-11-01") -> visitor id, for every night Capy was tucked in. */
export const visitLog = (): Record<string, string> => read('visits', {});
export const visitorOn = (day: string): Visitor | null => byId[visitLog()[day]] ?? null;
export const foundIds = (): Set<string> => new Set(Object.values(visitLog()));

/** The rare visitor waiting at the next milestone, so it can be teased. */
export function nextRare(streak: number): Visitor | null {
  return VISITORS.find((v) => v.rareAt && v.rareAt > streak) ?? null;
}

/**
 * Picks tonight's visitor: the milestone's rare one if you just reached it, otherwise
 * someone you haven't met yet (or an old friend once you've met everyone).
 */
export function welcomeVisitor(day: string, streak: number): { visitor: Visitor; isNew: boolean } {
  const log = visitLog();
  if (log[day]) return { visitor: byId[log[day]], isNew: false };
  const found = new Set(Object.values(log));
  const rare = VISITORS.find((v) => v.rareAt === streak && !found.has(v.id));
  const fresh = COMMON.filter((v) => !found.has(v.id));
  const pool = fresh.length > 0 ? fresh : COMMON;
  const visitor = rare ?? pool[Math.floor(Math.random() * pool.length)];
  setSetting('visits', JSON.stringify({ ...log, [day]: visitor.id }));
  return { visitor, isNew: !found.has(visitor.id) };
}

// ---- Chill Days ----

export const chillDays = (): number => read('chillDays', 0);
/** Days a Chill Day covered; they count as active for the streak. */
export const chillUsed = (): string[] => read('chillUsed', []);

/** Called after tucking Capy in: every 7-day streak earns a Chill Day (up to 3 saved). */
export function maybeEarnChill(streak: number): boolean {
  if (streak === 0 || streak % 7 !== 0) return false;
  const earnedFor = read<number[]>('chillEarnedFor', []);
  if (earnedFor.includes(streak)) return false;
  setSetting('chillEarnedFor', JSON.stringify([...earnedFor, streak]));
  if (chillDays() >= MAX_CHILL) return false;
  setSetting('chillDays', JSON.stringify(chillDays() + 1));
  return true;
}

/**
 * On opening the app: if you missed days since you were last active, spend Chill Days to
 * cover them, so long as there are enough for the whole gap. Returns how many were used.
 */
export function applyChillDays(active: Set<string>, now = Date.now()): number {
  let have = chillDays();
  if (have === 0) return 0;
  const gap: string[] = [];
  let day = prevDay(startOfDay(now));
  while (!active.has(dayKey(day)) && gap.length <= have) {
    gap.push(dayKey(day));
    day = prevDay(day);
  }
  // Nothing missed, the gap is too long to cover, or there was no streak to protect.
  if (gap.length === 0 || gap.length > have || !active.has(dayKey(day))) return 0;
  have -= gap.length;
  setSetting('chillDays', JSON.stringify(have));
  setSetting('chillUsed', JSON.stringify([...chillUsed(), ...gap]));
  return gap.length;
}
