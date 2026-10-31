# Waterllama → Capy: what we're borrowing

Source: Waterllama on Refero (https://refero.design/apps/274), a daily water-intake tracker with collectible animal characters.
We borrow **patterns and habit mechanics**, not their artwork, characters, or copy.

## The one big difference

Waterllama's goal is to drink **more**: filling up is good, and 100% is a celebration.
For money, spending more is not a win. So in Capy:

- **The habit is logging, not spending.** The streak and celebrations reward *checking in with Capy every day*, including a "Nothing spent today" check-in.
- **Spending fills an optional daily budget.** Capy fills up with colour as you spend. Near the limit Capy looks worried; under budget at day's end, Capy celebrates.

## Patterns to borrow

### 1. Home: one big number + mascot that fills with colour (P1)
Waterllama: [nearing goal](https://refero.design/screens/649325ce-2f60-422d-8971-7cd54877c359)
- Big number at the top, with one quiet line under it: `₹1,240 today · 62% of your ₹2,000 budget`.
- Large Capy silhouette in the centre. **Each expense adds a band in its category's colour**, stacked bottom-up, so today's mix is visible at a glance.
- Top-left: a round streak badge with a progress ring around it and the streak number inside. Top-right: a button that opens the summary.

### 2. Quick-add category bar (P1)
- A row of category icons above the bottom edge: Food, Transport, Shopping, Bills, Fun, Other.
- Tap one → amount pad → save. This is the **silent fallback** for when you can't talk (meetings, metro).
- Voice stays the main way; the mic button sits next to the bar.

### 3. Day-complete celebration (P1)
Waterllama: [goal reached](https://refero.design/screens/6edfd3f1-add0-459b-a2b2-40696934efd2)
- Confetti, a playful day headline ("Thrifty Tuesday!"), and the totals line underneath.
- It triggers on your evening check-in, not on hitting a spending number.
- A dark pill button, "Celebrate my day", makes a shareable card (P2).

### 4. Summary screen (P1)
Waterllama: [hydration summary](https://refero.design/screens/62815ae0-ea48-4331-a813-87832d3e4a90)
- A big circular KPI at the top: today's % of budget on the Days tab, and the **day streak** on the Weeks tab.
- A Days / Weeks / Months segmented control.
- Stacked bars per day, coloured by category, with the total above each bar, plus a legend with % chips (`32% Food`).
- A month calendar underneath, with dots on days you logged. Tapping a day opens its detail.

### 5. Day detail: fix mistakes safely (P1)
Waterllama: [day log](https://refero.design/screens/08e7b84c-dd7f-4f34-ac64-45cbe0c741fa), [add missed entry](https://refero.design/screens/ef4f43cb-eb75-4af8-9d98-20dd4d46b3a7)
- A chronological list with icon, note, amount, time and a round **−** delete button, which asks "Are you sure?" first.
- **"Add a missed expense"** at the bottom opens a sheet with a time picker, category and amount, for things you forgot to say.
- Totals recalculate immediately after any change.

### 6. Friendly reminders, asked for at the right moment (P1)
Waterllama: [Smart Reminders intro](https://refero.design/screens/9b090ae7-37a6-475e-b26e-d673f9c5e418)
- Show our own explainer screen (Capy illustration plus a sample notification) **before** iPhone's permission popup. One clear button: "Remind me to log". Include a Skip.
- Free local notifications, e.g. after lunch ("Lunch money? Tell Capy") and in the evening ("Anything spent today? Capy's waiting").
- If you already checked in today, skip the evening reminder.

### 7. Onboarding that ends with your first entry (P2)
Waterllama: [onboarding and first sip](https://refero.design/flows/11511)
1. Two or three playful intro screens with a single "Get started" button.
2. Optional daily budget, with a quick picker and "Skip, no budget".
3. **Log your first expense** as a guided tutorial, using voice or a quick-add tap.
4. Show how to set up Back Tap, with the screenshots from SETUP.md.
5. The reminders explainer, then iPhone's permission popup.
6. Land on home with Capy already showing one band of colour.

Leave out their paywall and premium screens.

### 8. Collectibles: Capy's wardrobe (P2)
Waterllama: [character collection](https://refero.design/screens/c2e8418c-d4fd-4285-9974-0ba7eca3aa5f)
- Keep your streak for a day → unlock a new Capy outfit the next day (chef hat, auto-driver cap, party hat…). Show "11 of 40 collected".
- A grid with unlocked items in colour and locked ones as outlines; tap one to dress Capy with it.
- This is the Duolingo-style "come back tomorrow" pull.

### 9. Challenges (P2)
Waterllama shows "Escape Caffeine Capuchin · 9d" as a card at the bottom of home.
- Money versions: "No-Swiggy week", "Chai under ₹300 this week", "7-day logging streak".
- One active challenge at a time, shown as a card with a day counter.

### 10. Later (P3)
- Home-screen widget with quick-add buttons. This needs extra Apple features that may not work with a free account.
- Short daily money tips as swipeable cards.

## Category colours for the bands and charts
Warm and distinct from each other, and they fit Capy's brown palette:

| Category  | Colour    |
|-----------|-----------|
| Food      | `#E8A33D` |
| Transport | `#4BA3C7` |
| Shopping  | `#D9677B` |
| Bills     | `#7B6CC2` |
| Fun       | `#6DBE6A` |
| Other     | `#A89A8C` |

## Visual notes
- A white or very light page with lots of space. Colour comes from the mascot and the categories, not from the background.
- Rounded, friendly sans-serif type, with heavy weight for the big number.
- One dark pill button for the main action on each screen. Small grey uppercase labels under the quick-add icons.
- Round close buttons, white with a soft shadow, in the top-right of sheets.
