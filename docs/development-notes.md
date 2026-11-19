# Stato del Progetto - Scacchiera Urbana

> Ultimo aggiornamento: 28 Marzo 2026, 22:14

## 1. Architettura di Sistema

L'architettura di "Scacchiera Urbana" segue un paradigma Client-Server, unita a un motore di orchestrazione AI per personalizzare dinamicamente l'esperienza dell'utente.

### Frontend (UI)
*   Applicazione scritta in **React 18** + **TypeScript** con build tool **Vite 5**. Lo stile è gestito con **TailwindCSS**.
*   Il nucleo della gamification (profili, punti exp, monete, ricompense) e la gestione dinamica dei POI (Points of Interest) sono centralizzati in `useGameState.ts`.
*   La mappa interattiva (`MapView.tsx`) utilizza **Mapbox GL JS** (`react-map-gl` + `mapbox-gl`) con funzionalità avanzate: edifici 3D estesi, clustering visivo, calcolo di prossimità basato su bounding box geofencing spaziale.
*   Il modale POI (`MissionPanel.tsx`) integra tre tab: **La Storia** (narrazione AI dinamica), **La Sfida** (quiz AI) e **Completato** (riepilogo XP/monete).

### Backend (Server)
*   Server **Node.js** con **Express** e **TypeScript** (ESM, `tsx watch` per dev).
*   Endpoint diagnostico: `GET /api/diagnostics` per verificare lo stato delle API key.
*   Le API key sono gestite via `server/.env` (gitignored).

### AI Orchestration (Regolo.ai)
*   Il backend comunica con **Regolo.ai** (`https://api.regolo.ai/v1`) tramite REST diretto (file `services/regolo.ts`), usando il modello **Llama-3.3-70B-Instruct**.
*   La dipendenza precedente dal pacchetto `openai` SDK è stata sostituita con `fetch` nativo per il `dialogueWriter`.
*   Il file `routes/ai.ts` espone l'architettura a tre agenti:
    *   `dialogueWriter` → `POST /api/ai/narration` — Genera narrazioni personalizzate **inedite** in tempo reale.
    *   `quizGenerator` → `POST /api/ai/challenge` — Crea quiz dinamici basati sugli interessi utente.
    *   `answerValidator` → `POST /api/ai/validate` — Valida le risposte dell'utente.

### Tipi e Interfacce
*   `POI` interface estesa con:
    *   `aiNarration?: POINarration` — narrazione generata dall'AI (narration, hiddenFact, voiceStyle).
    *   `isGeneratingNarration?: boolean` — flag di caricamento per skeleton UI.
*   `POINarration` interface dedicata: `{ narration, hiddenFact, voiceStyle }`.

## 2. Modifiche Completate in Sessione

### ✅ Migrazione Backend: Claude → Regolo.ai
| File | Azione |
|---|---|
| `server/src/services/regolo.ts` | **[NUOVO]** Client REST nativo per Regolo.ai, sostituisce l'SDK OpenAI per `dialogueWriter`. API key letta da `process.env`. |
| `server/src/agents/dialogueWriter.ts` | **[RISCRITTO]** Import da `regolo.ts`. Prompt rafforzato con requisiti "inedita" (contenuto unico, mai enciclopedico). |
| `server/src/services/claude.ts` | **[INVARIATO]** Ancora usato da `quizGenerator`, `answerValidator`, `challengeDialogue`, `poiDiscoverer`. |

### ✅ Integrazione Frontend Narrazione Dinamica
| File | Azione |
|---|---|
| `UI/src/types/index.ts` | Aggiunte `POINarration` interface e campi `aiNarration`, `isGeneratingNarration` a `POI`. |
| `UI/src/hooks/useGameState.ts` | Aggiunta funzione `fetchDynamicNarration(poiId, userParams?)` con loading state, error handling e fallback. |
| `UI/src/components/MissionPanel.tsx` | Label "Contenuto statico" → "Contenuto dal database". Badge AI: "Generata in tempo reale da AI". Aggiunto logging diagnostico nel `useEffect` e nel `.catch()`. |

### ✅ Fix Infrastrutturali
| File | Azione |
|---|---|
| `UI/src/vite-env.d.ts` | **[NUOVO]** Aggiunto `/// <reference types="vite/client" />` per risolvere errore `import.meta.env`. |
| `server/.env` e `UI/.env` | **[CREATI]** File gitignored creati con le rispettive API key (Regolo, ElevenLabs, OpenWeather per server, e Mapbox per UI). |
| `server/src/routes/diagnostics.ts` | **[NUOVO]** Route diagnostica `GET /api/diagnostics` mancante che impediva l'avvio del server. |

## 3. Problemi Noti (Non Bloccanti)

> [!WARNING]
> **Dipendenze Duplicate (React / Mapbox)**
> *   **Root `package.json`** installa `react-map-gl@^8.1.0` e `mapbox-gl@^3.20.0`.
> *   **UI `package.json`** installa `react-map-gl@^7.1.9` e `mapbox-gl@^3.20.0`.
> 
> Versioni discordanti di `react-map-gl` possono causare collisioni React. Da risolvere nello Sprint 1.

> [!NOTE]
> **Errori TypeScript pre-esistenti (10)**
> Presenti in `App.tsx`, `Leaderboard.tsx`, `MapView.tsx`, `OnboardingScreen.tsx`, `ProfileScreen.tsx`, `VoiceChallengeModal.tsx`. Nessuno causato dalle nostre modifiche. Riguardano variabili non usate, tipo `InterestCategory` mancante (`famiglia`), e incompatibilità `PersonalityScores` con `Record<string, number>`.

> [!NOTE]
> **Migrazione `claude.ts` incompleta**
> `services/claude.ts` è ancora usato da 4 agenti (`quizGenerator`, `answerValidator`, `challengeDialogue`, `poiDiscoverer`). Solo `dialogueWriter` è stato migrato a `regolo.ts`. Da completare negli sprint successivi.

## 4. Roadmap / Sprint Checklist

- [ ] **Sprint 1. Setup**: Risoluzione dipendenze duplicate root vs UI, normalizzazione ambiente monorepo, fix errori TypeScript pre-esistenti.
- [/] **Sprint 2. Backend**: Consolidamento agenti AI e integrazione lato Express.
    - [x] Migrazione `dialogueWriter` da Claude SDK a Regolo.ai REST diretto
    - [x] Prompt "inedita" per narrazioni uniche e non enciclopediche
    - [x] Logging diagnostico su `regolo.ts` e `routes/ai.ts`
    - [x] Endpoint `GET /api/diagnostics` per verifica API key
    - [ ] Migrazione rimanenti agenti (`quizGenerator`, `answerValidator`, `challengeDialogue`, `poiDiscoverer`) a `regolo.ts`
- [/] **Sprint 3A. Mappa**: Coreografia della mappa 3D, ottimizzazione del clustering e dei marker personalizzati.
    - [x] `MapView.tsx` con edifici 3D, clustering, geofencing, dynamic POI fetch
    - [ ] Ottimizzazione performance rendering marker
- [/] **Sprint 3B. UI**: Gamification state, interfaccia di onboarding e interazioni utente.
    - [x] `fetchDynamicNarration` in `useGameState.ts`
    - [x] Skeleton loading + label AI dinamiche in `MissionPanel.tsx`
    - [x] Tipi `POINarration` e `isGeneratingNarration` nel sistema di tipi
    - [x] Integrazione `fetchDynamicNarration` dal game state nel modale (rimossi vecchi import da `api.ts` e completato lo Sprint 3B)
