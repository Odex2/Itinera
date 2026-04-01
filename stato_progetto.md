# Stato del Progetto - Scacchiera Urbana

> Ultimo aggiornamento: 31 Marzo 2026

## 1. Architettura di Sistema

L'architettura di "Scacchiera Urbana" segue un paradigma Client-Server, unita a un motore di orchestrazione AI per personalizzare dinamicamente l'esperienza dell'utente.

### Frontend (UI)
*   Applicazione scritta in **React 18** + **TypeScript** con build tool **Vite 5**. Lo stile è gestito con **TailwindCSS**.
*   Il nucleo della gamification (profili, punti exp, monete, ricompense) e la gestione dinamica dei POI (Points of Interest) sono centralizzati in `useGameState.ts`. È presente anche la logica globale di `fetchDynamicNarration`.
*   La mappa interattiva (`MapView.tsx`) utilizza **Mapbox GL JS** (`react-map-gl` + `mapbox-gl`) con funzionalità avanzate: edifici 3D estesi, clustering visivo, calcolo di prossimità basato su bounding box geofencing spaziale. È stata introdotta la selezione dinamica della città.
*   Il modale POI (`MissionPanel.tsx`) integra tre tab: **La Storia** (narrazione AI dinamica con Skeleton Loading), **La Sfida** (quiz AI) e **Completato** (riepilogo XP/monete).

### Backend (Server)
*   Server **Node.js** con **Express** e **TypeScript** (ESM, `tsx watch` per dev).
*   Routing modulare per AI (`ai.ts`, `discover.ts`), meteo (`weather.ts`) e voce (`voice.ts`).
*   Endpoint di salute: `GET /api/health`. È presente un file `diagnostics.ts` per l'endpoint `GET /api/diagnostics` che valuta le API key, ma **non è montato in `index.ts`**.
*   Le API key (Regolo, ElevenLabs, OpenWeather) sono gestite via `server/.env` (gitignored).

### AI Orchestration (Regolo.ai & Claude)
*   Il backend ora comunica con **Regolo.ai** (`https://api.regolo.ai/v1`) tramite REST diretto (file `services/regolo.ts`) per il modulo di narrazione inedita (`dialogueWriter`).
*   Tuttavia, il file `services/claude.ts` continua ad essere impiegato estensivamente da 4 agenti: `quizGenerator`, `answerValidator`, `challengeDialogue`, e `poiDiscoverer`.
*   Il file `routes/ai.ts` espone l'architettura REST:
    *   `dialogueWriter` → `GET /api/ai/narration` (ora implementato e collegato al frontend).
    *   `quizGenerator` / `answerValidator` per le sfide interattive.

### Struttura Dati
*   `POI` interface estesa con campi `aiNarration?: POINarration` e `isGeneratingNarration?: boolean` per supportare stati fluidi della UI.
*   Gamification avanzata tramite array di `badges` gestiti dinamicamente via `useGameState`.

## 2. Stato Recente degli Sviluppi

### ✅ Migrazione Backend: Claude → Regolo.ai (Parziale)
| File | Azione |
|---|---|
| `server/src/services/regolo.ts` | Server REST nativo funzionante e testato per Regolo.ai, letto da `process.env`. |
| `server/src/agents/dialogueWriter.ts` | Risolto il requisito "inedito": l'agente usa Regolo.ai per evitare stile enciclopedico. |
| `server/src/services/claude.ts` | **Ancora mantenuto** per la retrocompatibilità di altri 4 agenti (in attesa di migrazione totale). |

### ✅ Integrazione Frontend Narrazione Dinamica
| File | Azione |
|---|---|
| `UI/src/hooks/useGameState.ts` | Completata implementazione di `fetchDynamicNarration` che integra chiamate backend salvando stati `POINarration`. Risolti duplicati e fetching ridondanti. |
| `UI/src/components/MissionPanel.tsx` | UI perfettamente cablata con Skeleton mode in attesa della risposta AI. Feedback visivo esplicito per l'utente ("Generata in tempo reale"). |

## 3. Problemi Noti e Analisi Critica (Non Bloccanti)

> [!WARNING]
> **Endpoint di Diagnostica Scollegato**
> Il file `server/src/routes/diagnostics.ts` esiste e implementa la route `GET /api/diagnostics`, ma **non è stato importato** e montato nel file `server/src/index.ts`. La dashboard non riceverà diagnostica finché non verrà mappato in Express.

> [!WARNING]
> **Dipendenze Duplicate (React / Mapbox)**
> *   **Root `package.json`** installa `react-map-gl@^8.1.0` e `mapbox-gl@^3.20.0`.
> *   **UI `package.json`** installa `react-map-gl@^7.1.9` e `mapbox-gl@^3.20.0`.
>
> Versioni discordanti di `react-map-gl` causano conflitti albero dipendenze e possibili anomalie di re-rendering. Da risolvere con massima urgenza sanando il monorepo.

> [!NOTE]
> **Errori TypeScript Pre-Esistenti (10+)**
> Il comando `npm run typecheck` solleva possibili eccezioni su `App.tsx`, `Leaderboard.tsx`, `MapView.tsx`. Tra cui `InterestCategory` mancanti e incompatibilità con la `PersonalityScores`. Non prevengono il dev server tramite babel/vite ma causano build failure.

## 4. Roadmap / Sprint Checklist

- [ ] **Sprint 1. Setup & Bugfix**: Risoluzione dipendenze duplicate root vs UI, normalizzazione ambiente monorepo (usando npm workspaces), fix errori TypeScript.
- [/] **Sprint 2. Backend**: Consolidamento agenti AI e integrazione lato Express.
    - [x] Migrazione `dialogueWriter` da Claude SDK a Regolo REST diretto
    - [x] Prompt "inedita" per narrazioni uniche
    - [ ] Mappare route `/api/diagnostics` su `index.ts`
    - [ ] Migrazione rimanenti agenti (`quizGenerator`, `answerValidator`, ecc.) a `regolo.ts` per abbandonare Claude.
- [/] **Sprint 3A. Mappa**: Coreografia della mappa 3D, ottimizzazione del clustering e dei marker personalizzati.
    - [x] `MapView.tsx` con edifici 3D, clustering
    - [x] Selezione dinamica città
    - [ ] Ottimizzazione performance rendering dei tooltip
- [x] **Sprint 3B. UI**: Gamification state, interfaccia di onboarding.
    - [x] `fetchDynamicNarration` in `useGameState.ts`
    - [x] App flow completo da Onboarding → Mappa → GameLoop.
