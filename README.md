<div align="center">

# ⚡ GANDHARVA — AN INTEGRATED AI MUSIC STUDIO

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Outfit&size=34&duration=2500&pause=800&color=00E5FF&center=true&vCenter=true&width=850&height=80&lines=NEXT-GEN+PROMPT-TO-MUSIC+COMPOSITION+PIPELINE;MULTILINGUAL+TELUGU%2C+HINDI+%26+ENGLISH+LYRICS;LIVE+PLAYGROUND+PIANO%2C+DRUMS+%26+GUITAR;VOCAL+STUDIO+AUTO-TUNE+%26+PITCH+ISOLATOR+(DEVELOPING);PRO+MULTI-TRACK+MUSIC+EDITOR" alt="Gandharva Master Animated Banner" />
</p>

<p align="center">
  <b>The World's Most Advanced AI-Powered End-to-End Music Production Workspace</b>
</p>

<p align="center">
  <a href="#-end-to-end-feature-generation-pipelines"><img src="https://img.shields.io/badge/PIPELINES-5_CORE_MODULES-00E5FF?style=for-the-badge&logo=rocket&logoColor=black" alt="Pipelines"></a>
  <a href="#-ai-engine"><img src="https://img.shields.io/badge/AI_ENGINE-GEMINI_2.5_FLASH-886FBF?style=for-the-badge&logo=googlegemini&logoColor=white" alt="AI Engine"></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/MOBILE-EXPO_SDK_54-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Mobile"></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/BACKEND-NODE.JS_%2B_FASTAPI-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Backend"></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/DATABASE-SUPABASE_CLOUD-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Database"></a>
</p>

---

</div>

<br/>

## 🌌 Architectural Overview

**GANDHARVA** is a state-of-the-art mobile music creation studio built for artists, producers, and songwriters. Powered by **Google Gemini 2.5 Flash**, **Jamendo & MusicGen Engines**, **WebAudio Signal Processors**, and an **Expo 54 Native Suite**, Gandharva converts raw human imagination into polished, release-ready tracks.

```
 ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
 ║                                                                                                       ║
 ║   🎼 PROMPT-TO-MUSIC PIPELINE     : Natural Prompt → Semantic Parsing → Audio Waveform Stream         ║
 ║   🔮 AI LYRICS GENERATION ENGINE  : 3-Second Native Script Telugu, Devanagari Hindi & Fluent English   ║
 ║   🎛️ MULTI-TRACK MUSIC EDITOR     : Waveform Trimmer, Pitch Shift, Tempo Scaler & Export Suite      ║
 ║   🎤 AI VOCAL STUDIO (DEVELOPING) : Real-Time Auto-Tune, Vocal Demixing & Studio Reverb Rack        ║
 ║   🎹 PLAYGROUND INSTRUMENTS RACK  : 88-Key Touch Synthesizer, 8-Pad Drums & Guitar Chord Strummer     ║
 ║                                                                                                       ║
 ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🚦 Master Feature Status Matrix

| Module | Pipeline Description | Tech Stack | Status |
| :--- | :--- | :--- | :---: |
| **📖 Story to Album** | NIE narrative analysis to full 3-scene concept album with Dual-Brain GPU scores | Gemini 2.0 + Dual-Brain GPU (MusicGen + ACE-Step) | `LIVE & READY ✅` |
| **🎼 Prompt-to-Music** | Natural language prompt to high-fidelity audio composition | MusicGen 3.3B + ACE-Step 8.0 | `LIVE & READY ✅` |
| **🔮 AI Lyrics Studio** | Multilingual generation in pure Telugu (తెలుగు), Hindi (हिन्दी), English | Google Gemini 2.5 Flash | `LIVE & READY ✅` |
| **🎛️ Music Editor** | Multi-track audio trimmer, tempo adjustment, pitch shifter & exporter | Expo AV + WebAudio | `LIVE & READY ✅` |
| **🎤 AI Vocal Studio** | Live Auto-Tune, Pitch Correction, Vocal Demixing & AI Narration | Demucs + DSP Pitch Engine | `IN DEVELOPMENT 🚧` |
| **🎹 Playground Instruments**| 10 Racks: Piano, Drums, Bansuri Flute, Synth Lead, Slap Bass, Organ, Guitar, Violin, Sax, Sitar | WebAudio Sampler + Loop DSP | `LIVE & READY ✅` |

---

## 🔬 End-to-End Feature Generation Pipelines

```
                                      GANDHARVA PIPELINE MAP
                                      
    [USER PROMPT / NARRATIVE / AUDIO / TOUCH]
                  │
        ┌─────────┼───────────────┬─────────────────┬────────────────┬────────────────┐
        ▼         ▼               ▼                 ▼                ▼                ▼
   1. STORY TO  2. MUSIC     3. LYRICS        4. EDITOR        5. VOCAL STUDIO  6. PLAYGROUND
   ALBUM (NIE)  GENERATOR    GENERATOR        ARRANGER         (DEVELOPING)     INSTRUMENTS
```

---

### 📖 Pipeline 1: Story-to-Album Generation (`LIVE & READY ✅`)

The **Narrative Intelligence Engine (NIE)** and **Album Generation Engine (AGE)** transform natural language stories into complete conceptual albums with AI cover art, multilingual lyrics, and two distinct live AI soundtrack scores per scene:

- 📄 **Complete Technical Specification**: [Pipelines/Album_Pipeline_Packet.md](file:///c:/nusic_gen/Pipelines/Album_Pipeline_Packet.md)
- **Track 1**: `ACE-Step Master Score (Dual-Brain GPU)` (16-bit PCM WAV)
- **Track 2**: `MusicGen Neural Score (Live AI)` (16-bit PCM WAV)
- **Features**: Instant 0:00 Replay, Android Storage Access Framework direct download, and iOS native file sharing.

---

### 🎼 Pipeline 2: Prompt-to-Music Generation (`LIVE & READY ✅`)

The **Prompt-to-Music Engine** transforms unstructured user ideas (e.g. *"Relaxing lofi beats under night rain with acoustic guitar"*) into full audio arrangements.

```mermaid
flowchart TD
    subgraph Input ["1️⃣ User Prompt Input"]
        A["👤 Prompt Input\ne.g. 'Epic Cyberpunk Synthwave'"]
        B["⚙️ Genre & Mood Selectors\n(Pop, Lofi, Cinematic, Phonk, Rock)"]
    end

    subgraph Server ["2️⃣ Express AI Bridge (Port 3000)"]
        C["🔍 Prompt Enhancer & Tag Extractor"]
        D["📊 BPM & Mood Mapping Engine"]
        E["📡 Jamendo & MusicGen API Resolver"]
    end

    subgraph Audio_Processing ["3️⃣ Waveform & Stream Processor"]
        F["🎵 Audio Stream Retrieval"]
        G["🎚️ Normalization & Dynamic Compression"]
        H["💾 Supabase Cloud Backup & SQLite Cache"]
    end

    subgraph Output ["4️⃣ Interactive Audio Player"]
        I["🔊 Expo AV Native Audio Player"]
        J["🌊 Real-Time Audio Waveform Visualizer"]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    I --> J
```

---

### 🔮 Pipeline 2: Multilingual AI Lyric Generation (`LIVE & READY ✅`)

Generates structured song lyrics in **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, or **English** with rhyme schemes and meter analysis.

```mermaid
flowchart TD
    subgraph Client ["1️⃣ User Setup"]
        A1["📝 Song Prompt / Concept"]
        A2["🌍 Language Filter (Telugu / Hindi / English)"]
        A3["🎭 Mood & Style Parameters"]
    end

    subgraph Direct_AI ["2️⃣ Direct Google Cloud AI Layer"]
        B1["🔮 Gemini 2.5 Flash API Handler"]
        B2["📜 Language Script Validation\n(Zero English letters in Telugu/Hindi mode)"]
    end

    subgraph Structured_Output ["3️⃣ Lyric Formatting Engine"]
        C1["🎼 3 Distinct Variations\n(Variation A, B, C)"]
        C2["📐 Meter & Rhyme Scheme Analysis\n(8-10 Syllables / ABAB Chorus Hook)"]
    end

    subgraph Export ["4️⃣ Export & Studio Action"]
        D1["📋 1-Tap Copy & Device Share"]
        D2["✨ Export Lyrics to AI Music Generator"]
        D3["⚡ Fire-and-Forget Supabase Cloud Log"]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> C1
    C1 --> C2
    C2 --> D1
    C2 --> D2
    C2 --> D3
```

---

### 🎛️ Pipeline 3: Multi-Track Music Editor (`LIVE & READY ✅`)

An audio workstation for trimming, pitch shifting, speed scaling, and combining backing tracks with lyrics.

```mermaid
flowchart TD
    subgraph Import ["1️⃣ Track Ingestion"]
        E1["📂 Import Audio File / Select Saved Track"]
        E2["🎼 Import Generated Lyrics Sheet"]
    end

    subgraph DSP_Engine ["2️⃣ Digital Signal Processing (DSP) Rack"]
        F1["✂️ Precise Waveform Trimmer (Start/End Range)"]
        F2["🎵 Pitch Shifter (-12 to +12 Semitones)"]
        F3["⏱️ Tempo Scaler (0.5x to 2.0x Speed)"]
        F4["🔊 Multi-Band Equalizer & Reverb"]
    end

    subgraph Mixdown ["3️⃣ Master Audio Render"]
        G1["🎛️ Multi-Track Audio Bouncing"]
        G2["💾 MP3 / WAV Master Export"]
    end

    E1 --> F1
    E2 --> F4
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> G1
    G1 --> G2
```

---

### 🎤 Pipeline 4: AI Vocal Studio (`IN DEVELOPMENT 🚧`)

*Actively being engineered.* Processes raw vocal recordings with pitch-locking Auto-Tune, vocal isolation, and melody narration synthesis.

```mermaid
flowchart TD
    subgraph Recording ["1️⃣ Vocal Recording & Input"]
        V1["🎙️ Studio Microphone Recording / File Upload"]
        V2["🎚️ Noise Gate & Background Noise Removal"]
    end

    subgraph AI_Processing ["2️⃣ AI Vocal Demixing & Tuning Engine (Developing 🚧)"]
        V3["🧠 Demucs Vocal Separator\n(Splits Vocals from Instrumental)"]
        V4["🎯 Key Scale Detector & Pitch Locking\n(Real-Time Auto-Tune)"]
        V5["🔮 Gemini Vocal Melody Synthesizer\n(Converts Lyrics to Narration)"]
    end

    subgraph Effects_Rack ["3️⃣ Vocal FX Rack"]
        V6["🌌 Ambient Reverb & Stereo Echo"]
        V7["🎛️ Dynamic Compression & Warmth EQ"]
    end

    subgraph Final_Mix ["4️⃣ Studio Master Vocal Track"]
        V8["🎚️ Master Vocal + Instrumental Mixdown"]
    end

    V1 --> V2
    V2 --> V3
    V3 --> V4
    V4 --> V5
    V5 --> V6
    V6 --> V7
    V7 --> V8
```

---

### 🎹 Pipeline 5: Playground Virtual Instruments Engine (`LIVE & READY ✅`)

Interactive touch-responsive multi-instrument playground featuring Piano, Drums, and Guitar.

```mermaid
flowchart TD
    subgraph Instrument_Racks ["1️⃣ Touch Surface & Playground Racks"]
        P1["🎹 88-Key Touch Synthesizer Piano (Octave Control)"]
        D1["🥁 8-Pad Studio Drum Machine (Kick, Snare, Hi-Hat, Toms)"]
        G1["🎸 Acoustic & Electric Guitar Chord Strummer"]
    end

    subgraph Synthesis ["2️⃣ Real-Time Audio Synthesis Engine"]
        S1["⚡ WebAudio Touch Trigger Handler (<10ms Latency)"]
        S2["🔊 Sample Playback & Envelope Generator (ADSR)"]
    end

    subgraph Processing ["3️⃣ Reverb & Master Recorder"]
        R1["🌌 Master Reverb & Delay FX"]
        R2["🔴 Live Audio Sequencer & MIDI Recorder"]
        R3["💾 Save Recording to Gandharva Library"]
    end

    P1 --> S1
    D1 --> S1
    G1 --> S1
    S1 --> S2
    S2 --> R1
    R1 --> R2
    R2 --> R3
```

---

## 🛠️ Complete Technology Stack

```
 💻 FRONTEND          : React Native, Expo SDK 54, React Navigation v7, Lucide Icons, Expo AV
 🟢 NODE BACKEND      : Express.js, Axios, Dotenv, Ngrok Tunneling
 🐍 PYTHON BACKEND    : FastAPI, PyTorch, Uvicorn, SQLModel, Transformers
 🔮 AI MODELS         : Google Gemini 2.5 Flash, Jamendo Semantic Index, Demucs V4
 ⚡ DATABASE & CLOUD  : Supabase REST API, SQLite Local Storage, PostgreSQL
 🔊 AUDIO ENGINE      : WebAudio DSP, Pitch Shifter Engine, Custom Samplers
```

---

## 🚀 Quick Start Guide

### 1️⃣ Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/Prasanth4734f/Gandharva---An-Integrated-AI-Music-Studio.git
cd Gandharva---An-Integrated-AI-Music-Studio

# Install Root Frontend Dependencies
npm install

# Install Server Dependencies
cd server
npm install
cd ..
```

### 2️⃣ Configure Environment Variables

Create `.env` in root directory (`c:\nusic_gen\.env`) and `server/.env`:

```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key_here
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your_supabase_anon_key
JAMENDO_CLIENT_ID=56d30c11
```

### 3️⃣ Start the Application

#### 🟢 Terminal 1: Express Backend Server
```bash
node server/index.js
```

#### 🔵 Terminal 2: Expo Mobile App
```bash
npx expo start --clear
```

> **Tip**: Press **`w`** for instant Web Browser Preview (`http://localhost:8081`) or **`a`** for Android Emulator.

---

<div align="center">

### 🌟 Star this Repository if you love GANDHARVA!

Made with ❤️ by the **Anti Gravity AI Team**

</div>
