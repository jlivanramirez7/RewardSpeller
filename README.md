# SummerSpellingApp

Welcome to the **SummerSpellingApp**! This is a comprehensive, gamified web-based educational platform designed specifically for 4th and 5th-grade students. It transitions children from basic phonetic spelling to true orthographic mastery using a structured "Building Blocks" pedagogical approach.

## 🚀 Project Overview

The app is split into two distinct interfaces:
1. **Student Portal:** A visually engaging, gamified interface where students take spelling assessments, earn points, and unlock rewards.
2. **Parent Portal:** A "command center" for parents to track progress, monitor struggle areas, adjust curriculum difficulty, and manage the reward economy.

## 🛠 Tech Stack

- **Frontend Framework:** React (via Vite)
- **Styling:** Vanilla CSS (Modern glassmorphism UI, CSS variables for theming, custom animations)
- **Routing:** React Router DOM
- **State Management:** React Context API (`AppContext`)
- **Persistence:** LocalStorage (for seamless cross-session saving without a backend)
- **Accessibility/Audio:** Web Speech API (for Text-to-Speech dictation)

---

## 📚 The Curriculum

The core of the application is a massive, curated word bank consisting of **150 words** (30 per tier). Every single word is equipped with a custom, 4th/5th-grade appropriate **definition** and an **example sentence**.

The curriculum is broken into 5 progressive Tiers:

1. **Tier 1: Complex Vowel Patterns**
   - *Rule:* Master sophisticated vowel combinations and R-controlled nuances (e.g., 'ei', 'ie').
   - *Example Words:* neighbor, drought, awkward, turquoise.
2. **Tier 2: Advanced Morphology**
   - *Rule:* Use word parts (Latin/Greek roots, prefixes, suffixes) to decode complex terms.
   - *Example Words:* biography, subterranean, trajectory.
3. **Tier 3: Multi-syllabic Structural Analysis**
   - *Rule:* Break down long words using standard syllable division patterns (VC/CV) and identify the schwa sound.
   - *Example Words:* intelligence, mysterious, calculation.
4. **Tier 4: Homophones & Confusing Words**
   - *Rule:* Distinguish between commonly confused words through sentence context.
   - *Example Words:* principal/principle, stationary/stationery.
5. **Tier 5: Academic Vocabulary**
   - *Rule:* Master subject-specific terminology used in Math, Science, and History.
   - *Example Words:* photosynthesis, denominator, chronological.

---

## 🎮 Game Mechanics

### Assessment Flow
Students select an unlocked Tier from their Learning Map and choose a difficulty.
- **Easy (Copy-Type):** The word remains visible on the screen. (Awards 1 base pt)
- **Medium (Recall-Type):** The word flashes for 3 seconds, then disappears. (Awards 3 base pts)
- **Hard (Dictation):** The word is completely hidden. (Awards 30 base pts)

### Text-to-Speech (TTS)
When a word is presented, the app utilizes the browser's TTS engine to dictate:
`"[Word]. [Definition]. [Sentence]. The word is: [Word]."`
*The TTS automatically cancels and updates the moment a student skips or moves to a new word to prevent audio overlapping.*

### Retry Logic & Smart Feedback
If a student misspells a word:
- **First Mistake:** They receive a "Smart Hint" (e.g., "Don't forget the silent 'e'!" or "Too many letters!"). The audio is replayed, and they get *one* chance to fix it.
- **Second Mistake:** The word is marked incorrect, the correct spelling is revealed, and the word is logged in the Parent Portal's "Struggle Report". The streak is broken, and the engine moves to the next word.

### Economy Limits (Anti-Grinding)
To prevent students from playing "Easy" repeatedly to farm points, the app tracks the **Maximum Score** achieved per tier and difficulty.
- Points are only added to the student's global bank if their newly achieved session score *exceeds* their previous high score for that specific tier.
- *Example:* If a student scores 300 points on Tier 1 (Hard), and plays it again scoring 300 points, they receive **0 new points**. 

---

## 👨‍👩‍👧 Portals

### Student Portal
- **Learning Map:** Displays all Tiers, their descriptions, and the specific Rule being taught. Tiers unlock progressively.
- **Rewards Vault:** Students can spend their hard-earned points here. Each reward features a progress bar explicitly showing `[Current Points] / [Target Points] pts` and a percentage.

### Parent Portal
- **Diagnostic Insights & Stats:** 
  - Shows the total words in the curriculum and the **Maximum Possible Points** a student can mathematically achieve.
  - **Struggle Report:** A real-time list tracking exactly which words the student misspells and how many times they've missed them.
- **Curriculum Calibration:** Parents can shift the target Grade Level (3rd, 4th-5th, 6th+), which can be tied to different word banks in future updates.
- **Reward System Configuration:** Parents have full control over the economy. They can add custom rewards (e.g., "Trip to the Park", "1 Hour Video Games") and set the exact point costs.

---

## ⚙️ How to Run Locally

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Open a terminal in the project root directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173/`.
