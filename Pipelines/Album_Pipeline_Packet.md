# 🎵 Gandharva Story-to-Album Pipeline Packet
**Version:** 2.4.0-Production  
**Module:** Narrative Intelligence Engine (NIE) & Dual-Brain Audio Generation Engine (AGE)  
**Location:** `Pipelines/Album_Pipeline_Packet.md`  
**System Architecture:** React Native (Expo) + Dual-Brain PyTorch Cloud GPU (Tesla T4) + Local Device Storage  

---

## 📋 Executive Overview

The **Album Pipeline Packet** encapsulates the end-to-end production workflow of the Gandharva AI Music Studio — transforming a text story into a fully orchestrated multilingual concept album with cover art, scene lyrics, and 2 distinct AI scores per scene (*ACE-Step Master Score* and *MusicGen Neural Score*).

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  Story Prompt   │ ────> │  Narrative Blueprint   │ ────> │  Dual-Brain GPU Queue  │
│  & Preferences  │       │  (NIE Arc & Lyrics)    │       │  (Sequential Synthesis)│
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ Device Storage  │ <──── │   Expo-AV Audio Engine │ <──── │ 16-Bit PCM WAV Decoder │
│  (SAF / Share)  │       │ (Replay / Zero Fallback│       │  (FileReader & Header) │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## 🔄 The Complete 6-Stage Working Pipeline

### Stage 1: Narrative Ingestion & Parameter Selection
- **Input Coordinates**:
  - `story`: Text narrative (or selected preset, e.g., *College Romance*, *Cyberpunk Metropolis*, *Epic Battlefield*, *Devotional Sacred Journey*).
  - `language`: Target lyrics language (`English`, `Telugu`, `Hindi`, `Tamil`, `Kannada`, `Malayalam`, `Spanish`, `Japanese`).
  - `sceneCount`: Defaulted to **3 Core Story Scenes** (*Awakening $\to$ Climax $\to$ Triumphant Finale*) for optimal 45s generation without timeout.
- **Trigger**: User taps `Analyze Story & Create Blueprint ✦`.

---

### Stage 2: Narrative Intelligence Engine (NIE) Blueprinting
- **Engine**: Client-side Narrative Engine (`generateClientSideBlueprint`) with Express fallback (`/album/analyze`).
- **Generated Blueprint Artifacts**:
  1. **Album Identity**: Title, Genre, Subgenre, Color Palette, Cover Art Flux Prompt.
  2. **Scene Tracks Breakdown**:
     - *Scene 1: The Awakening & First Spark* (88 BPM, C Major, Grand Piano & Warm Strings).
     - *Scene 2: Conflict & Emotional Climax* (122 BPM, D Minor, Driving Strings & Percussion).
     - *Scene 3: Triumphant Reunion & Finale* (118 BPM, E Major, Full Symphonic Orchestra).
  3. **Unique Multilingual Lyrics**: Generates distinct verse/chorus lyrics tailored to the scene's emotional context and target language.
- **Trigger**: User reviews the blueprint in `stage === 'preview'` and taps `Approve & Build Complete Album 🚀`.

---

### Stage 3: Cover Art Synthesis
- **Generator**: Pollinations AI (Flux Model) with high-fidelity enhancement prompts:
  ```text
  https://image.pollinations.ai/prompt/<encoded_cover_prompt>?width=600&height=600&model=flux&enhance=true&nologo=true
  ```
- **Caching**: Stored in `albumData.cover_url` for real-time display and booklet download.

---

### Stage 4: Dual-Brain GPU Audio Synthesis Queue
To prevent GPU thread collisions and memory locks on the Tesla T4 backend, tracks are dispatched through a **strict sequential queue**:

#### 1. Track 1: ACE-Step Master Score (Pass 1 of 2)
- **Endpoint**: `${DEFAULT_KAGGLE_GPU_URL}/generate`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "User-Agent": "Mozilla/5.0"
  }
  ```
- **Payload**:
  ```json
  {
    "prompt": "<Scene Prompt>, ACE-Step High Fidelity master orchestral score",
    "duration": 8,
    "seed": 1284719283
  }
  ```

#### 2. Track 2: MusicGen Neural Score (Pass 2 of 2)
- **Payload**:
  ```json
  {
    "prompt": "<Scene Prompt>, distinct acoustic melodic reprise, energetic rhythmic groove",
    "duration": 8,
    "seed": 1284720283
  }
  ```

---

### Stage 5: Binary Decoding & 16-Bit PCM WAV Normalization
Because PyTorch generates IEEE Float32 WAV files with `fact` chunks that standard mobile audio drivers cannot natively parse, the audio stream undergoes instant client-side normalization:

1. **Hermes Binary Ingestion**:
   - Uses `FileReader.readAsDataURL()` / `response.blob()` for universal React Native Hermes compatibility.
2. **Chunk Stripping & Header Rebuilding (`convertFloat32WavToInt16Wav`)**:
   - Locates the `fmt ` chunk and extracts sample rate ($32{,}000\text{ Hz}$) and channel count ($2\text{ channels}$).
   - Skips proprietary `fact` chunks and offsets directly to the `data` chunk.
   - Quantizes Float32 samples $[-1.0, 1.0]$ into signed 16-bit integers $[-32768, 32767]$.
   - Writes a canonical 44-byte standard RIFF header (`Format Tag 1`).
3. **Local File Persistence**:
   - Saves normalized audio directly to `${FileSystem.documentDirectory}story_ace_<timestamp>_<idx>.wav`.

---

### Stage 6: Studio Player, Instant Replay & Storage Export

#### 1. BGM Studio Tab (`activeTab === 2`):
- **Tracks List**: Each scene displays both distinct AI score variations (*ACE-Step* and *MusicGen*).
- **Play/Pause**: Directly streams from `${FileSystem.documentDirectory}` with zero network latency.
- **🔄 Instant Replay (`handleReplayTrack`)**: Rewinds track position to `0:00` and resumes playback instantly without reloading.

#### 2. 💾 Direct Device Download (`handleDownloadTrack`):
- **Android**: Uses `FileSystem.StorageAccessFramework` to let users save the `.wav` file directly to their **Downloads** or **Music** folder.
- **iOS**: Uses `Sharing.shareAsync` with `com.microsoft.waveform-audio` MIME type for native `Save to Files` integration.
- **Web**: Triggers direct browser download via object link.

---

## 🛠️ Verification & Health Check Reference

To test the end-to-end GPU health anytime:
```bash
node -e "
const https = require('https');
https.get('https://audition-roamer-darling.ngrok-free.dev/musicgen-health', {
  headers: { 'ngrok-skip-browser-warning': 'true', 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('GPU STATUS:', body));
});"
```

Expected Output:
```json
{
  "status": "online",
  "engine": "Gandharva Dual-Brain (MusicGen + ACE-Step 8.0)",
  "gpus_detected": 2,
  "session_1_musicgen": true,
  "session_2_ace_step": true
}
```

---

## 📁 Key File Mapping

| Component | File Path |
| :--- | :--- |
| **Story to Album UI & State Machine** | [`src/screens/features/StoryToAlbumScreen.js`](file:///c:/nusic_gen/src/screens/features/StoryToAlbumScreen.js) |
| **AI Audio Normalizer & Codecs** | [`src/services/musicService.js`](file:///c:/nusic_gen/src/services/musicService.js) |
| **Album Service Client** | [`src/services/albumService.js`](file:///c:/nusic_gen/src/services/albumService.js) |
| **Dual-Brain Kaggle Engine** | [`server/gandharva_dual_brain_server.py`](file:///c:/nusic_gen/server/gandharva_dual_brain_server.py) |
| **Server Album Controller** | [`server/src/controllers/albumController.js`](file:///c:/nusic_gen/server/src/controllers/albumController.js) |
