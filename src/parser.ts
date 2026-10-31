// Turns a spoken sentence like "chai with Rohit 40" into { amount: 40, category: Food, note: "Chai" }.
// Works fully offline with simple rules, so it costs nothing to run.

export type Category = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Fun' | 'Other';

export const CATEGORIES: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other'];

export type ParsedExpense = {
  amount: number | null;
  category: Category;
  /** A short label for what it was ("Chai", "Electricity bill"), not the whole sentence. */
  note: string;
};

/** Words you've taught Capy: word -> the category you saved it under. */
export type Learned = Record<string, Category>;

const KEYWORDS: Record<Exclude<Category, 'Other'>, string[]> = {
  Food: [
    'chai', 'tea', 'coffee', 'samosa', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'food',
    'pizza', 'biryani', 'snack', 'groceries', 'grocery', 'juice', 'maggi', 'restaurant', 'cafe',
    'burger', 'momos', 'dosa', 'idli', 'vada', 'pav', 'paratha', 'paneer', 'thali', 'chaat', 'lassi',
    'sweets', 'mithai', 'cake', 'icecream', 'kulfi', 'blinkit', 'zepto', 'instamart', 'bigbasket', 'kirana',
    'milk', 'bread', 'eggs', 'fruits', 'vegetables', 'sabzi', 'tiffin', 'canteen', 'mess', 'dominos',
    'mcdonalds', 'kfc', 'starbucks',
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'auto', 'rickshaw', 'metro', 'bus', 'local', 'petrol', 'diesel', 'fuel',
    'cng', 'cab', 'taxi', 'train', 'irctc', 'parking', 'toll', 'flight', 'fastag', 'bike', 'scooty',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'decathlon', 'croma', 'shoes', 'clothes',
    'shirt', 'tshirt', 'jeans', 'kurta', 'shopping', 'bought', 'gift', 'dress', 'watch', 'bag', 'headphones',
    'charger',
  ],
  Bills: [
    'rent', 'electricity', 'wifi', 'internet', 'broadband', 'recharge', 'bill', 'phone', 'mobile', 'gas',
    'cylinder', 'water', 'emi', 'insurance', 'maintenance', 'jio', 'airtel', 'dth', 'maid', 'laundry',
  ],
  Fun: [
    'movie', 'movies', 'netflix', 'spotify', 'prime', 'hotstar', 'party', 'game', 'games', 'concert',
    'drinks', 'beer', 'trip', 'bowling', 'club', 'pvr', 'bookmyshow', 'ipl',
  ],
};

/** Words worth listing for the speech recogniser, Indian names and brands first. */
export const SPEECH_HINTS: string[] = [
  'rupees', 'Swiggy', 'Zomato', 'Rapido', 'Uber', 'Ola', 'Blinkit', 'Zepto', 'Instamart', 'BigBasket',
  'Myntra', 'Flipkart', 'Ajio', 'Meesho', 'Nykaa', 'Jio', 'Airtel', 'IRCTC', 'FASTag', 'BookMyShow',
  'chai', 'samosa', 'biryani', 'momos', 'dosa', 'idli', 'vada pav', 'paratha', 'paneer', 'thali', 'chaat',
  'lassi', 'mithai', 'kulfi', 'sabzi', 'kirana', 'tiffin', 'auto', 'rickshaw', 'metro', 'petrol', 'CNG',
  'scooty', 'kurta', 'EMI', 'DTH', 'PVR', 'IPL',
];

// Words that pick a category but say nothing about what was bought, so they stay out of the note.
const NOT_A_NOTE = new Set(['bought', 'shopping', 'food']);

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000, k: 1000, lakh: 100000, lakhs: 100000 };

const CURRENCY_WORDS = new Set(['rs', 'rs.', 'inr', 'rupee', 'rupees', 'rupaye', 'rupay', 'bucks', '₹']);
const FILLERS = new Set([
  'i', 'just', 'spent', 'spend', 'paid', 'pay', 'gave', 'give', 'bought', 'got', 'had', 'purchased',
  'for', 'on', 'at', 'to', 'of', 'a', 'an', 'the', 'some', 'my', 'and', 'it', 'was', 'is',
]);
// Everything after these is who/where, not what: "chai with Rohit", "uber to office".
const CUT_WORDS = new Set(['with', 'for', 'to', 'from', 'at', 'on', 'in', 'by']);

const isNumberWord = (w: string) => w in ONES || w in TENS || w in SCALES || w === 'and';
const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9₹.]/g, '');
const word = (t: string) => t.toLowerCase().replace(/[^a-z]/g, '');

// "two hundred fifty" -> 250, "two fifty" -> 250, "fifteen hundred" -> 1500
function wordsToNumber(words: string[]): number | null {
  const vals = words.filter((w) => w !== 'and');
  if (vals.length === 0 || vals.every((w) => w in SCALES)) return null;

  // Colloquial "two fifty" / "three forty five": a small number followed by tens.
  if (vals.length >= 2 && vals[0] in ONES && ONES[vals[0]] < 10 && vals[1] in TENS && !vals.some((w) => w in SCALES)) {
    const rest = vals.slice(1).reduce((s, w) => s + (TENS[w] ?? ONES[w] ?? 0), 0);
    return ONES[vals[0]] * 100 + rest;
  }

  let total = 0;
  let current = 0;
  for (const w of vals) {
    if (w in ONES) current += ONES[w];
    else if (w in TENS) current += TENS[w];
    else if (w === 'hundred') current = (current || 1) * 100;
    else if (w in SCALES) {
      total += (current || 1) * SCALES[w];
      current = 0;
    }
  }
  return total + current;
}

type AmountMatch = { amount: number; start: number; end: number };

function findAmount(tokens: string[]): AmountMatch | null {
  const lower = tokens.map(clean);

  // 1) Digits: "250", "₹250", "1,200", "1.5k", "2k", "250rs"
  for (let i = 0; i < lower.length; i++) {
    const m = tokens[i].toLowerCase().replace(/[!?]+$/, '').match(/^(?:₹|rs\.?|inr)?(\d[\d,]*(?:\.\d+)?)(k|rs|rupees)?\.?$/);
    if (!m) continue;
    let amount = parseFloat(m[1].replace(/,/g, ''));
    let end = i;
    if (m[2] === 'k') amount *= 1000;
    const next = lower[i + 1];
    if (next && next in SCALES) {
      amount *= SCALES[next];
      end = i + 1;
    }
    return { amount, start: i, end };
  }

  // 2) Number words: "two hundred fifty", "two fifty"
  for (let i = 0; i < lower.length; i++) {
    if (!isNumberWord(lower[i]) || lower[i] === 'and') continue;
    let j = i;
    while (j + 1 < lower.length && isNumberWord(lower[j + 1])) j++;
    const amount = wordsToNumber(lower.slice(i, j + 1));
    if (amount && amount > 0) return { amount, start: i, end: j };
  }
  return null;
}

/**
 * The category a single word belongs to, if any. Allows plurals ("snacks") and past tense
 * ("recharged"); past-tense matches are verbs, so they name the category but not the item.
 */
function categoryOf(w: string, learned: Learned): { cat: Category; verb: boolean } | null {
  if (!w) return null;
  if (learned[w]) return { cat: learned[w], verb: false };
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    if (words.some((k) => w === k || w === `${k}s` || w === `${k}es`)) return { cat, verb: false };
    if (words.some((k) => w === `${k}d` || w === `${k}ed`)) return { cat, verb: true };
  }
  return null;
}

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function parseExpense(text: string, learned: Learned = {}): ParsedExpense {
  const tokens = text.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  const found = findAmount(tokens);
  const inAmount = (i: number) => !!found && i >= found.start && i <= found.end;

  // Category: the first word that belongs to one. Note: the words that named it ("chai", "electricity bill").
  let category: Category = 'Other';
  let hits: { i: number; w: string; verb: boolean }[] = [];
  tokens.forEach((t, i) => {
    if (inAmount(i)) return;
    const w = word(t);
    const match = categoryOf(w, learned);
    if (!match) return;
    if (category === 'Other') category = match.cat;
    if (!NOT_A_NOTE.has(w)) hits.push({ i, w, verb: match.verb });
  });
  if (hits.some((h) => !h.verb)) hits = hits.filter((h) => !h.verb);

  let note = '';
  if (hits.length > 0) {
    // Join neighbouring words ("electricity bill"), separate others ("chai, samosa"); at most two items.
    const groups: string[][] = [];
    hits.forEach((h, n) => {
      if (n > 0 && h.i === hits[n - 1].i + 1) groups[groups.length - 1].push(h.w);
      else groups.push([h.w]);
    });
    note = groups
      .slice(0, 2)
      .map((g) => g.join(' '))
      .join(', ');
  } else {
    // No known word: keep the first few words that describe the thing, before "with/for/to…".
    const words = tokens.filter((_, i) => !inAmount(i)).map(word).filter((w) => w && !CURRENCY_WORDS.has(w));
    let start = 0;
    while (start < words.length && FILLERS.has(words[start])) start++;
    const kept: string[] = [];
    for (const w of words.slice(start)) {
      if (CUT_WORDS.has(w) || kept.length === 3) break;
      if (!FILLERS.has(w)) kept.push(w);
    }
    note = kept.join(' ');
  }

  const amount = found ? Math.round(found.amount * 100) / 100 : null;
  return { amount, category, note: capitalise(note) };
}

/** The word to remember for this note, so next time it lands in the category you picked. */
export function learnKey(note: string): string | null {
  const first = word(note.split(/[ ,]/)[0] ?? '');
  return first.length >= 2 ? first : null;
}

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}
