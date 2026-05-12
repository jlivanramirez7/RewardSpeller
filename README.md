# 🚀 SummerSpellingApp

Welcome to the **SummerSpellingApp**! This is a comprehensive, high-fidelity gamified web educational platform built explicitly to transition students into orthographic mastery using a structured "Building Blocks" pedagogical approach. Combining high-density immersive visual analytics with next-generation neural speech synthesis, it provides a secure, customizable learning track for students and administrative oversight for educators.

---

## 🛠️ Technical Overview

### 1. Component Architecture
The application orchestrates state utilizing modern React deterministic patterns for optimized rendering:
*   **React Context API (`AppContext`)**: Acts as the central ecosystem nervous system. It synchronously aggregates student performance (scores, accuracy maps, streak metrics) and propagates global persistent settings reliably.
*   **Singleton Audio Node Pattern**: Consolidates global media operations into a single, persistent HTML5 `Audio` element. This architecture natively circumvents browser security blockades by maintaining explicit user-activation privileges across dynamic component mount cycles.
*   **DOM Portals for Content Modals**: Critical layout drivers like the Jedi Archive modal and Lightbox expansion containers bypass parent DOM transform isolation by teleporting directly to the global `document.body` via `ReactDOM.createPortal`. This explicitly guarantees 100% absolute viewport centering, impervious to scrolling artifacts.

### 2. Dual-Channel High-Fidelity TTS Pipeline
Our resilient audio subsystem implemented in `ttsService.js` enforces three tiers of zero-failure redundancy:
*   **Tier 1: Synchronous Gesture Warmup**: Captures initial user click events to silently "prime" the audio context, defeating strict desktop/mobile autoplay policies immediately.
*   **Tier 2: Pre-Rendered Static Dispatcher**: Probes local caches (`/assets/audio/`) first to deliver zero-latency offline-ready narration streams.
*   **Tier 3: Dynamic Neural Fallback**: Automatically pivots missing items to the active **Google Cloud Flagship Neural Engine** (`en-US-Journey-F`) using runtime adaptive bearer token detection and throttled request buffering.
*   **Safety Protocols**: Embedded capped cyclic caches prevent unbounded memory expansion during long continuous sessions, and synchronous async session ID trackers invalidate race condition payloads on instant channel switches.

---

## 🎮 Gameplay and Mechanics

### 🏛️ The Lesson Interface
Before triggering assessments, students utilize the immersive **Jedi Archive** built to strengthen spelling retention via multiple cognitive pathways:
*   **High-Density Visual Banners**: Expanded widescreen canvas featuring adaptive ambient backdrop layers to present lesson artwork natively without cropping.
*   **Phonetic Glow Highlighters**: Leverages intelligent pattern-detection regex engines to dynamically stratify vocabulary into discrete grouped buckets (e.g., LOGIC GROUP: IE), isolating phonetic nuances with glowing text-shadows.
*   **Lightbox Overlays**: Seamless full-screen portals that darkens surrounding UI to isolate focus directly onto core anchor visualizations with a single click.
*   **Autonomous Holocron Audio**: Seamlessly instantiates immersive narrations synchronous with modal mount, locking in audio-visual memory hooks instantly.

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

### 2. Anti-Inflationary Economy
The global wallet secures anti-grinding protocol through distinct **Differential Ledger Accounting**:
*   $\Delta \text{Wallet} = \max(0, \text{Session Score} - \text{Previous Recorded Max Score})$
*   *Rule:* Repeating finished lessons on lower difficulty rewards exactly 0 new coins. Students MUST push into higher tiers or perfect their percentages to generate new currency.

### 3. Gating & Unlock Algorithms
*   **Section Pass Threshold**: Defined globally as $\ge 90\%$ accuracy on **ANY** active difficulty track.
*   **Tier Unlock Prerequisites**: The final "Tier Mastery Assessment" activates ONLY when 100% of sub-sections meet the $\ge 90\%$ Pass Metric.
*   **Rolling Acceleration Window**: When pacing is active, students can browse at maximum exactly **3 sections ahead** of their lowest unmastered topic.

---

## 👑 Parent Control Center (Administration)

The operational command center empowers rigorous regulation of state layers:
*   **Curriculum Calibration**: Instant live routing that remaps the active underlying database between 3rd, 4th-5th, and 6th+ grade target banks.
*   **Diagnostic Insights & Struggle Ledger**: Real-time ingestion of specific failed submissions enabling targeted parental intervention.
*   **Admin Config Suite**:
    *   **Adaptive Pacing Switch**: Toggle enforcing strict linear sequential progression vs. unrestricted full-exploration sandbox mode.
    *   **Difficulty Progression Hook**: A binary enforcing gate forcing linear completion (Easy → Medium → Hard) requiring 100% perfection before advanced tier visibility.
    *   **Rewards Economy Forge**: Direct administrative creation of rewards with customizable point-cost requirements.

---

## ⚙️ Operations & Deployment

### ⚡ Static Voice Rendering
To avoid latency and completely lock the static high-fidelity audio bank permanently, run the following command from root:
```bash
node generate_lesson_audio.js "YOUR_GOOGLE_CLOUD_ACCESS_TOKEN"
```
*Requires Google Cloud API enabled on destination project.*

### 🚀 Launching Development Environment
Ensure node environment (v18+) is active and dependencies are installed (`npm install`).

#### 💻 Local Development
1. Start local server: `npm run dev`
2. Navigate to active port: `http://localhost:5173`

#### 🌐 Remote Development (SSH)
If you are developing on a remote virtual environment via SSH, choose one of the following methods to access the app:

**Method 1: SSH Port Forwarding (Recommended)**
1. Connect to your VM with port forwarding enabled:
   ```bash
   ssh -L 5173:localhost:5173 user@ivanramirez.c.googlers.com
   ```
2. Start the dev server on the remote machine: `npm run dev`
3. Access the app locally at: `http://localhost:5173`

**Method 2: Automatic Proxy Redirect (BeyondCorp)**
1. Start the dev server and expose it to the network:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
2. Access the app using your Cloudtop hostname: `http://ivanramirez.c.googlers.com:5173`
   *   **💡 Critical Tip**: You must use **`http://`** (not `https://`) initially. If you have the BeyondCorp extension enabled, it will automatically intercept this request and redirect you to a secure, long-lived Proxy Encoded Name (PEN) URL (e.g., `https://...proxy.googlers.com/`).
   *   *(Note: Ensure your VM's firewall allows traffic on port 5173)*
