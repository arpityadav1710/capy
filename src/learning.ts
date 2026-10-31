// Capy learns from what you save: each item's word remembers the category you chose,
// and your own words are passed to the speech recogniser as hints next time.
import { type Category, type Learned, learnKey, SPEECH_HINTS } from './parser';
import { getSetting, setSetting } from './storage';

const MAX_WORDS = 300;
// iOS works best with up to about 100 hint phrases.
const MAX_HINTS = 100;

export function getLearned(): Learned {
  try {
    return JSON.parse(getSetting('learned') || '{}') as Learned;
  } catch {
    return {};
  }
}

export function learn(note: string, category: Category): void {
  const key = learnKey(note);
  if (!key) return;
  const learned = getLearned();
  delete learned[key]; // re-insert so the most recent words stay at the end
  learned[key] = category;
  const keys = Object.keys(learned);
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_WORDS))) delete learned[old];
  setSetting('learned', JSON.stringify(learned));
}

/** Your most recent words first, then Capy's built-in list. */
export function speechHints(): string[] {
  const mine = Object.keys(getLearned()).reverse().slice(0, 40);
  return [...new Set([...mine, ...SPEECH_HINTS])].slice(0, MAX_HINTS);
}
