// Quick check of the sentence parser. Run with: node scripts/test-parser.ts
import { parseExpense } from '../src/parser.ts';

const cases: [string, number | null, string][] = [
  ['Chai and samosa with Rohit 250', 250, 'Food'],
  ['uber 180 to office', 180, 'Transport'],
  ['spent ₹1,200 on shoes', 1200, 'Shopping'],
  ['paid 1.5k for electricity bill', 1500, 'Bills'],
  ['netflix 649', 649, 'Fun'],
  ['two fifty for coffee', 250, 'Food'],
  ['gave two hundred and fifty rupees to the auto', 250, 'Transport'],
  ['fifteen hundred for a gift', 1500, 'Shopping'],
  ['rent 2 lakh', 200000, 'Bills'],
  ['250 rs swiggy dinner', 250, 'Food'],
  ['bought a plant for 300', 300, 'Shopping'],
  ['lent money to a friend', null, 'Other'],
];

let failed = 0;
for (const [text, amount, category] of cases) {
  const r = parseExpense(text);
  const ok = r.amount === amount && r.category === category;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${text}"  ->  ${r.amount} | ${r.category} | "${r.note}"`);
}
console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
