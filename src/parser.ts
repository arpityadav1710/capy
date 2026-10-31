// Turns a spoken sentence like "chai with Rohit 250" into { amount, category, note }.
// Works fully offline with simple rules, so it costs nothing to run.

export type Category = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Fun' | 'Other';

export const CATEGORIES: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other'];

export type ParsedExpense = {
  amount: number | null;
  category: Category;
  note: string;
};

const KEYWORDS: Record<Exclude<Category, 'Other'>, string[]> = {
  Food: [
    'chai', 'tea', 'coffee', 'samosa', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'food',
    'pizza', 'biryani', 'snack', 'groceries', 'grocery', 'juice', 'maggi', 'restaurant', 'cafe',
    'burger', 'momos', 'dosa', 'thali', 'blinkit', 'zepto', 'instamart', 'milk', 'fruits', 'vegetables',
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'auto', 'metro', 'bus', 'petrol', 'diesel', 'fuel', 'cab', 'taxi',
    'train', 'parking', 'toll', 'flight', 'fastag',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'shoes', 'clothes', 'shirt', 'tshirt', 'jeans',
    'shopping', 'bought', 'gift', 'dress', 'watch', 'bag',
  ],
  Bills: [
    'rent', 'electricity', 'wifi', 'internet', 'broadband', 'recharge', 'bill', 'phone', 'gas',
    'water', 'emi', 'insurance', 'maintenance',
  ],
  Fun: [
    'movie', 'movies', 'netflix', 'spotify', 'prime', 'hotstar', 'party', 'game', 'games', 'concert',
    'drinks', 'beer', 'trip', 'bowling', 'club', 'pvr',
  ],
};

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000, k: 1000, lakh: 100000, lakhs: 100000 };

const CURRENCY_WORDS = new Set(['rs', 'rs.', 'inr', 'rupee', 'rupees', 'bucks', '₹']);
const FILLER_START = /^(i\s+)?(just\s+)?(spent|paid|gave|spend|pay|for|on|at|to|of|a|an|the)\b\s*/i;
const FILLER_END = /\s*\b(for|on|at|to|of|and|rupees|rs)$/i;

const isNumberWord = (w: string) => w in ONES || w in TENS || w in SCALES || w === 'and';

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
  const lower = tokens.map((t) => t.toLowerCase());

  // 1) Digits: "250", "₹250", "1,200", "1.5k", "2k", "250rs"
  for (let i = 0; i < lower.length; i++) {
    const m = lower[i].match(/^(?:₹|rs\.?|inr)?(\d[\d,]*(?:\.\d+)?)(k|rs|rupees)?$/);
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

export function parseExpense(text: string): ParsedExpense {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const found = findAmount(tokens);

  const lower = text.toLowerCase();
  let category: Category = 'Other';
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    if (words.some((w) => new RegExp(`\\b${w}`, 'i').test(lower))) {
      category = cat;
      break;
    }
  }

  const noteTokens = tokens.filter((t, i) => {
    if (found && i >= found.start && i <= found.end) return false;
    return !CURRENCY_WORDS.has(t.toLowerCase());
  });
  let note = noteTokens.join(' ').replace(/[.,!?]+$/, '').trim();
  for (let i = 0; i < 4; i++) note = note.replace(FILLER_START, '').replace(FILLER_END, '').trim();
  if (note) note = note[0].toUpperCase() + note.slice(1);

  const amount = found ? Math.round(found.amount * 100) / 100 : null;
  return { amount, category, note };
}

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}
