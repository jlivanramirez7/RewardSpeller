# 🚀 RewardSpeller

Welcome to **RewardSpeller**! This is a comprehensive, high-fidelity gamified web educational platform built explicitly to transition students into orthographic mastery using a structured "Building Blocks" pedagogical approach. Combining high-density immersive visual analytics with next-generation neural speech synthesis, it provides a secure, customizable learning track for students and administrative oversight for educators.

---

## 🛠️ Technical Overview

### 1. Component Architecture
The application orchestrates state utilizing modern React deterministic patterns for optimized rendering:
*   **React Context API (`AppContext`)**: Acts as the central ecosystem nervous system. It synchronously aggregates student performance (scores, accuracy maps, streak metrics) and propagates global persistent settings reliably.
*   **Singleton Audio Node Pattern**: Consolidates global media operations into a single, persistent HTML5 `Audio` element. This architecture natively circumvents browser security blockades by maintaining explicit user-activation privileges across dynamic component mount cycles.
*   **DOM Portals for Content Modals**: Critical layout drivers like the Jedi Archive modal and Lightbox expansion containers bypass parent DOM transform isolation by teleporting directly to the global `document.body` via `ReactDOM.createPortal`. This explicitly guarantees 100% absolute viewport centering, impervious to scrolling artifacts.
*   **Grade Level Display**: The Student Portal header displays a "Grade" badge showing the current grade level selected by the parent, providing clear context to the student.

### 2. Dual-Channel High-Fidelity TTS Pipeline
Our resilient audio subsystem implemented in `ttsService.js` enforces three tiers of zero-failure redundancy, maintaining a strict architectural separation between runtime client playback and offline development synthesis:
*   **Tier 1: Synchronous Gesture Warmup**: Captures initial user click events to silently "prime" the audio context via a 1-sample WAV placeholder, defeating strict desktop/mobile autoplay policies immediately.
*   **Tier 2: Pre-Rendered Static Dispatcher**: Probes local caches (`/assets/audio/`) first to deliver zero-latency offline-ready narration streams synthesized during pre-rendering development stages.
*   **Tier 3: Dynamic Native Browser Fallback**: Automatically pivots missing or unreadable audio items to native browser synthesis (`window.speechSynthesis.speak`) as an instant runtime failsafe.
*   **Google Cloud Flagship Neural Engine (`en-US-Neural2-D`)**: Handled entirely **offline** during development pre-rendering via `generate_lesson_audio.js` (supporting OAuth2 Bearer tokens `ya29.` / `AQ.` or API keys) to eliminate runtime latency and recurring cloud costs.
*   **Safety Protocols**: Embedded capped cyclic caches prevent unbounded memory expansion during long continuous sessions, and synchronous async session ID trackers invalidate race condition payloads on instant channel switches.

---

## 🎮 Gameplay and Mechanics

### 🏛️ The Lesson Interface
Before triggering assessments, students utilize the immersive **Jedi Archive** built to strengthen spelling retention via multiple cognitive pathways:
*   **High-Density Visual Banners**: Expanded widescreen canvas featuring adaptive ambient backdrop layers to present lesson artwork natively without cropping.
*   **Phonetic Glow Highlighters**: Leverages intelligent pattern-detection regex engines to dynamically stratify vocabulary into discrete grouped buckets (e.g., LOGIC GROUP: IE), isolating phonetic nuances with glowing text-shadows.
*   **Lightbox Overlays**: Seamless full-screen portals that darkens surrounding UI to isolate focus directly onto core anchor visualizations with a single click.
*   **Autonomous Holocron Audio**: Seamlessly instantiates immersive narrations synchronous with modal mount, locking in audio-visual memory hooks instantly.
*   **🔒 Mandatory Lesson Prerequisite**: Students are gated from playing a section's assessment until they have clicked to listen to the corresponding lesson. The play button is disabled and displays "🔒 (Listen First)" until the lesson is marked as listened.

### 🎯 Dynamic Word Assessment Flow
Assessments enforce a progressive disclosure curve scaling available visual support inversely with difficulty:
*   **🟩 Easy (Static Persistence)**: The targeted term remains fixed visibly. Excellent for rote foundational memory reinforcement. *(Awards 1 base point)*
*   **🟨 Medium (Recall Caching)**: The word appears dynamically for **3 seconds**, forcing instant snapshot recall before vanishing entirely. *(Awards 3 base points)*
*   **🟥 Hard (Pure Dictation)**: Terms are masked 100% behind visual placeholders. The user relies purely on synchronous text-to-speech dictation. *(Awards 30 base points)*
*   **Adaptive Smart Logic**: Includes non-punitive hint layers (e.g. analyzing length deltas, detecting missing silent 'e' suffixes) that fire contextual correction advice following first-instance failures rather than forcing instant reset.

---

## 🔑 Hidden Rules & Game Mathematics

### 1. The Points Formulation ($E$)
Earnings scale non-linearly relative to active sequential accuracy streaks:
*   **Streak Boost ($M$)**: $M = \min(1 + (S \times 0.1), 2.0)$
    *   Where $S$ represents continuous correct answers. Maxes at 200% boost.
*   **Equation**: $E = \text{round}(Base \times M)$
*   **Perfect Session Override**: Achieving a perfect session (100% accuracy) awards the maximum possible points by setting the Streak Boost ($M$) to its maximum value of $2.0$ for all words in the session, bypassing the standard per-word streak ramp-up.

### 2. Anti-Inflationary Economy
The global wallet secures anti-grinding protocol through distinct **Differential Ledger Accounting**:
*   $\Delta \text{Wallet} = \max(0, \text{Session Score} - \text{Previous Recorded Max Score})$
*   *Rule:* Repeating finished lessons on lower difficulty rewards exactly 0 new coins. Students MUST push into higher tiers or perfect their percentages to generate new currency.

### 3. Gating & Unlock Algorithms
*   **Section Pass Threshold**: Defined globally as $\ge 90\%$ accuracy on **ANY** active difficulty track.
*   **Tier Unlock Prerequisites**: The final "Tier Mastery Assessment" activates ONLY when 100% of sub-sections meet the $\ge 90\%$ Pass Metric.
*   **Rolling Acceleration Window**: When pacing is active, students can browse at maximum exactly **1 section ahead** of their lowest unmastered topic.
*   **Randomized Tier Mastery Assessment**: The Tier Mastery Assessment creates a test by pulling a random subset of 10 words from all sections in that tier.

---

## 👑 Parent Control Center & Multi-Student Profiles

RewardSpeller provides a comprehensive, enterprise-grade parental administration suite designed to manage multi-student learning tracks securely. 

> [!TIP]
> **Access Security Lock**: The Parent Dashboard/Portal settings are protected by a default lock password. The default password is simply **`password`**.

### 1. Multi-Student Profiles & Login Flexibility
Parents can maintain multiple child profiles under a single master parent account (e.g., `jlivanramirez7@gmail.com`). The platform supports two distinct student operational modes:
*   **Mode A: Shared Device / Parent-Managed Login**: Children do not need their own email accounts. Parents simply log into the Parent Portal, create child profiles (e.g., "Lucas", "Bobby"), and switch between them. Students play directly on the parent's authenticated device session.
*   **Mode B: Independent Student Email Linking (`@gmail.com`)**: Parents can associate a child's profile with the student's very own personal `@gmail.com` address directly inside the Parent Portal card. 
    *   *Role Separation (RBAC)*: When a student logs in with their linked `@gmail.com`, the system automatically routes their session to their specific child profile under the parent's master Firestore ledger. Students can access their Learning Map, Leaderboard, and Rewards Vault, but are **strictly blocked** from accessing the Parent Portal or Admin Dashboard.

### 2. Curriculum Calibration & Diagnostics
*   **Live Grade Routing**: Instantly remap the active underlying database between discrete grade levels (`2nd`, `3rd`, `4th`, `5th`, and `6th`), dynamically adjusting vocabulary arrays and phonic difficulty tiers.
*   **Diagnostic Insights & Struggle Ledger**: Real-time ingestion of specific failed submissions enabling targeted parental intervention.
*   **Custom Reset Confirmation Modal**: Features a blurred glassmorphism backdrop and a safe confirmation flow to prevent accidental progress resets.

### 3. Experience Control Suite
*   **Adaptive Pacing Switch**: Toggle enforcing strict linear sequential progression (max 3 sections ahead) vs. unrestricted full-exploration sandbox mode.
*   **Difficulty Progression Hook**: Enforce linear completion (Easy → Medium → Hard) requiring mastery before advanced tier visibility.
*   **Rewards Economy Forge**: Direct administrative creation of rewards with customizable point-cost requirements.

---

## ⚙️ Operations & Deployment

### 🚀 Launching Development Environment
Ensure a modern Node.js environment (v18+) is active on your local machine.

```bash
npm install
npm run dev
```
Access the application locally at: `http://localhost:5173`

---

## 🛠️ Developer Utilities

The project includes a comprehensive suite of automation and data-engineering utility scripts in the root directory for pre-rendering media assets, injecting pedagogical scripts, and maintaining curriculum data structures:

### 1. Media & Asset Pre-Rendering
*   **`generate_lesson_audio.js`**: Pre-renders static MP3 audio bundles for all lesson scripts and vocabulary dictations using Google Cloud TTS premium neural engines (`en-US-Neural2-D`). Parses all grade-specific curriculum files (`wordBank_*.json`).
    *   *Prerequisites*: Google Cloud Text-to-Speech API enabled on your project.
    *   *Environment Configuration*: Create a `.env` file in the root directory or export your API key directly:
        ```bash
        GOOGLE_TTS_API_KEY="YOUR_GOOGLE_CLOUD_API_KEY"
        ```
    *   *Execution Syntax*:
        ```bash
        node generate_lesson_audio.js
        ```
    *   *Output Destination*: `/public/assets/audio/`
*   **`generate_infographics.js`**: Automated canvas generation script utilizing PureImage to pre-render widescreen PNG infographic cards and thematic tier overview banners across all grade levels. Enforces 1024x960 canvas dimensions to eliminate vertical text overflow.
    *   *Execution Syntax*: `node generate_infographics.js`
    *   *Prerequisites*: `pureimage` package and TrueType font accessible at `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`.
    *   *Output Destination*: `/public/assets/images/`

### 2. Curriculum Script Injection & Asset Mapping
*   **`upgrade_lesson_scripts.js`**: Programmatic data injection script. Replaces legacy brief lesson texts across grade-specific curriculum files (`wordBank_2nd.json`, `wordBank_3rd.json`, `wordBank_5th.json`, `wordBank_6th.json`) with immersive fantasy storytelling scripts (Minecraft, Star Wars, Harry Potter, LOTR, Narnia) embedded with explicit vocabulary examples, similarity breakdowns, and phonic mnemonic rules.
    *   *Execution Syntax*: `node upgrade_lesson_scripts.js`
*   **`update_wordbanks.js`**: Data-engineering utility. Batch updates `lessonImage` and `imagePath` properties across active split curriculum JSON files (`wordBank_2nd.json`, `wordBank_5th.json`) to enforce grade-specific asset naming conventions (`g2_tierX.png`, `g5_tX_sY.png`).
    *   *Execution Syntax*: `node update_wordbanks.js`

### 3. Legacy Data Maintenance
*   **`fix_wordbank_ids.js`**: Normalizes section identifier formatting (`tX_sY`) across legacy monolithic curriculum structures (`src/data/wordBank.json`).
*   **`update_img_paths.js`**: Standardizes section image asset naming patterns (`tierX_secY.png`) across legacy monolithic structures.
*   **`inject_pagination.py`, `inject_rules.py`, `refactor_pagination.py`**: Python data-engineering scripts for managing learning rules and pagination structures.

> [!NOTE]
> Active runtime curriculums are split into discrete grade-specific files (`wordBank_2nd.json` through `wordBank_6th.json`). Legacy maintenance scripts referencing `src/data/wordBank.json` are retained for archival reference and structural baseline validation.

---

## 📝 Feature Evolution & Major Upgrades Changelog

The platform has undergone extensive architectural refactoring, UX calibration, security hardening, and gamification upgrades. Below is the complete audit log of all changes completed:

### 1. Stateless Cloud Architecture & Firestore Migration
* **Firestore Integration**: Fully migrated all student statistics, streaks, point balances, and lessons from localized `localStorage` state variables to a real-time, secure **Google Cloud Firestore** backend database mapping.
* **Active Telemetry Sync**: Implemented dynamic cross-tab and cross-device synchronization. The React state now hydrates instantly from Firestore upon authentication, preventing any progress loss when switching devices.
* **Real-Time Telemetry Hook**: Created a `lastInteractionAt` telemetry hook inside the state synchronizer, logging parent/student engagements (learning trials, profile updates, catalog edits) in Firestore dynamically.

### 2. Verifiable Parental Consent & Security Gating (COPPA)
* **Verifiable Parental Consent Flow**: Developed a strict, legally compliant **Children's Online Privacy Protection Act (COPPA)** security gate. Unapproved parent accounts are completely locked from the student portal and lesson dictations.
* **HMAC-SHA256 JWT Verification Engine**: Built an administrative JWT signer and verification endpoint. New parent accounts receive a verifiable link in their inbox, valid for 24 hours, which atomically grants database approval upon signature validation.
* **Immediate Resend Email Integrations**: Integrated the **Resend API** directly in the Vite/Express server middleware to instantly dispatch:
  1. *Verifiable COPPA Consent Emails* upon registration.
  2. *Approved Welcome Notifications* to parents as soon as an administrator clicks "Approve" in the Admin Console.

### 3. Endless Unique Username Generator
* **900 Million Combinations**: Replaced the short static list of adjectives and animals with a highly randomized, whimsical name generator combining **exactly 100 Colors**, **100 Emotions/Traits**, and **100 Animals** with a 3-digit number.
* **Deterministic Math**: Utilizes a character-hash value of the child profile ID to guarantee a deterministic, kid-friendly username (e.g., `Crimson Joyful Hedgehog 843`) for every single child profile, protecting their privacy and preserving absolute anonymity.

### 4. Real-Time Gamified Leaderboards & Admin Analytics
* **Real-Time Leaderboard**: Built a grade-specific student leaderboard featuring toggleable sorting between `Total Points` and `Weekly Points`.
* **Visual Rank Badges**: Features gorgeous, custom rank badges (🥇 `1st`, 🥈 `2nd`, 🥉 `3rd`) with drop-shadow glowing highlights. Expanded Rank column width to `110px` to prevent text/emoji clipping on smaller screens.
* **Enhanced Admin Dashboard**: Upgraded all metrics to fetch in real time using `onSnapshot` subscriptions:
  * *Usage Time Tracking*: Added an active interval hook logging student active practice times.
  * *Visual Struggle Word Cards*: Categorizes student spelling mistakes by error type, sorting by most missed terms and displaying successful recall ratios.

### 5. Milestone Reward Economy & Administrative Controls
* **Non-Deducting Milestone Rewards**: Converted the deductions economy to a motivating milestone achievement vault. Claiming rewards no longer subtracts points from the student's hard-earned points total! Once the required points are achieved, the card morphs into a green-glowing `🏆 COMPLETE` card.
* **Absolute Catalog Controls**: Parents can now dynamically add custom rewards, edit the points cost of *any* reward (incomplete, claimed, or fulfilled), and delete them from history inline. If a parent increases a reward's cost, the item dynamically shifts back into the incomplete queue!

### 6. HTML5 History Routing & Responsive Layout Fixes
* **SPA Fallback Routing**: Addressed Single Page Application (SPA) blank screen rendering issues. If a browser direct-requests client-side routes like `/login`, `/request-access`, `/leaderboard`, or `/parent`, our Express-Vite middleware internally rewrites the request url to `/index.html`, loading the React app instantly while preserving the browser URL.
* **Root Redirect Gating**: Programmed a fallback redirect to `/landing.html` for all unauthenticated root visits, and redirected authenticated root routes safely to `/app`.
* **Spacious Two-Column Layout**: Upgraded the rewards dashboard into a responsive layout with a spacious `gap: '3rem'`, removing static borders to ensure Column 2 centers itself beautifully when wrapping on smaller devices.

