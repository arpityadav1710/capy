// Quick check of the sentence parser. Run with: node scripts/test-parser.ts
import { parseExpense } from '../src/parser.ts';

const cases: [string, number | null, string, string][] = [
  ['Chai with Rohit 40', 40, 'Food', 'Chai'],
  ['Chai and samosa with Rohit 250', 250, 'Food', 'Chai, samosa'],
  ['uber 180 to office', 180, 'Transport', 'Uber'],
  ['spent ₹1,200 on shoes', 1200, 'Shopping', 'Shoes'],
  ['paid 1.5k for electricity bill', 1500, 'Bills', 'Electricity bill'],
  ['netflix 649', 649, 'Fun', 'Netflix'],
  ['two fifty for coffee', 250, 'Food', 'Coffee'],
  ['gave two hundred and fifty rupees to the auto', 250, 'Transport', 'Auto'],
  ['fifteen hundred for a gift', 1500, 'Shopping', 'Gift'],
  ['rent 2 lakh', 200000, 'Bills', 'Rent'],
  ['250 rs swiggy dinner', 250, 'Food', 'Swiggy dinner'],
  ['bought a plant for 300', 300, 'Shopping', 'Plant'],
  ['Snacks 60.', 60, 'Food', 'Snacks'],
  ['recharged my phone 299 rupees', 299, 'Bills', 'Phone'],
  ['haircut 200 at the salon', 200, 'Other', 'Haircut'],
  ['lent money to a friend', null, 'Other', 'Lent money'],
  ['business lunch 900', 900, 'Food', 'Lunch'],
];

let failed = 0;
for (const [text, amount, category, note] of cases) {
  const r = parseExpense(text);
  const ok = r.amount === amount && r.category === category && r.note === note;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${text}"  ->  ${r.amount} | ${r.category} | "${r.note}"${ok ? '' : `   (expected ${amount} | ${category} | "${note}")`}`);
}

// Learned words: after you save "haircut" as Fun once, it stays Fun.
const learned = parseExpense('haircut 200', { haircut: 'Fun' });
const learnedOk = learned.category === 'Fun';
if (!learnedOk) failed++;
console.log(`${learnedOk ? 'PASS' : 'FAIL'}  learned "haircut" -> ${learned.category}`);

console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
