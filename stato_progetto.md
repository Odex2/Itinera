# Stato del Progetto - Itinera (Scacchiera Urbana)

> Ultimo aggiornamento: 2 Aprile 2026

## 1. Architettura di Sistema

L'architettura di "Scacchiera Urbana" (ora **Itinera**) segue un paradigma Client-Server interamente basato su **Monorepo** organizzato in npm workspaces (`UI` e `server`). Integra un motore di orchestrazione AI per generare contenuti e personalizzare dinamicamente l'esperienza di viaggio.

### Frontend (UI)
*   Applicazione scritta in **React 18** + **TypeScript** con build tool **Vite 5**.
*   Lo stile è gestito interamente tramite **TailwindCSS**, con l'ausilio di **Lucide React** per l'iconografia.
*   Il nucleo della gamification (profili, punti exp, monete, ricompense) e lo stato del player, mantenuto da `useGameState`, sono nativamente collegati a **Supabase** tramite *hydration silente* e pattern di *debounced optimistic mutaton*. Il client transiziona fluidamente garantendo un eccellente local data-fallback in caso di disconnessioni offline.
*   La mappa interattiva (`MapView.tsx`) utilizza **Mapbox GL JS** (`react-map-gl` + `mapbox-gl`) supportando funzionalità avanzate: rendering di edifici 3D, clustering scalare rapido dei POI e nodo proximity reattivo. È munita di un layer frontend altamente customizzato e ottimizzato in deep-cache memory (*Aggressive React Memoization*) contro i loop di frame-drop derivanti dall'inserimento dom layer UI dinamici sopra al canvas.
*   Il flusso di sessione dell'app: *Splash Screen* → *Profile Setup* → *Onboarding* → *City Selection* (con calcolo geospaziale su db) → *Map/Missions/Shop/Profile*.
*   Il modale dedicato all'ispezione locale (`MissionPanel.tsx`) espone tab isolati per la narrazione AI dinamica (UI con Skeleton Loading visivo in pending mode) e le sfide AI.

### Backend (Server)
*   Server **Node.js** con **Express** e **TypeScript** (ESM, via `tsx`).
*   Routing modulare per separare logicamente i controller: core AI (`ai.ts`, `discover.ts`), meteo locale (`weather.ts`), synthesis vocale TTS (`voice.ts`), e bridge diagnostiche (`diagnostics.ts`).
*   Endpoint informativi base predefiniti operativi: `GET /api/health` e `GET /api/diagnostics`.
*   Tutti i layer provider di third-party keys (Regolo, ElevenLabs, OpenWeather) sono isolati e mappati via system variables in `server/.env`.

### AI Orchestration (Regolo.ai)
*   L'intero lifecycle logico del backend e degli engine bot è solidamente vincolato ed unificato sull'API REST nativa di **Regolo.ai** (`https://api.regolo.ai/v1`).
*   L'intero blocco del driver middleware legacy (OpenAI SDK/Claude) è stato ritirato, smontato, ed estraniato per purificare l'architettura base da debito persistente. Regolo controlla autonomamente l'esecuzione testuale dinamica, la sfida visuale, le logiche di controllo trivia, e i discovery agent esplorativi.

## 2. Stato Recente degli Sviluppi (Nuova Analisi - Post Sprints)

### ✅ Completamento Unitario AI Driver
*   Tutti i vecchi agenti dipendenti dal root obsoleto (Quiz Generator, Validator, Discovery) ora puntano con successo al robusto driver unitario nativo `regolo.ts`. 
*   Eseguita una pulizia generale sull'albero dipendenze isolando i pacchetti zombie obsoleti associati ai pre-generatori AI.

### ✅ Ottimizzazione Rendering Mappa (Sprint 3A completato)
*   Sono stati riscontrati forti battery drain e latency dovuti alla rigenerazione per update su componentistica ReactDOM complessa (POIMarker pseudo tooltips e layer sovrapposti) durante i trigger costanti di `onZoom` del mapbox view nativo.
*   **Risultato Messo a Terra:** Refactoring del blocco UI cartografico adottando un solido pattern di caching front-end (`React.memo` personalizzato su comparazioni mirate per status POI; freeze memory object tramite callbacks per eventi loop). Conseguenza: azzeramento totale del re-render log su pan e zoom massivi limitando i passaggi alle sole variazioni necessarie.

### ✅ Integrazione e Persistenza Cloud Supabase (Sprint 3B completato)
*   Anziché spezzettare superficialmente l'imponente object destructuring locale del gameplay su più interfacce, ho centralizzato lo scambio via sync temporizzato per racchiudere logicamente un `game_saves`. L'ID giocatore diviene storiabile localmente al device.
*   **Risultato Messo a Terra:** All'app bootstrap la logica recupera e compila fedelmente tutto (da reward riscattati, step onboarding saltati a location salvate). L'operatività base (claim coin e completamenti target), non intralcia per frame visuali l'utente appoggiandosi su feedback grafici immediati per poi salvare per batch ritardate limitando traffico dati. 

## 3. Problemi Noti e Analisi Critica (Non Bloccanti)
*In seguito alle tre fasi cicliche di bonifica e sprint optimization completate, tutto il debito tecnico noto è stato saldato. Nessun refactoring o Warning critico ostilizza le pipeline ed i core correnti dell'app.*

## 4. Roadmap / Sprint Checklist

- [x] **Sprint 1. Setup & Bugfix**: Risoluzione duplicate base dipendenze, setting workspace root corretto, fix totalitari typescript.
- [x] **Sprint 2. Backend Server & AI**: Consolidamento totale architettura Agenti ed Express mapping.
    - [x] Migrazione e test narrazioni univoche su endpoint `/ai/narration` `dialogueWriter`.
    - [x] Mappato la telemetria root su `/api/diagnostics`.
    - [x] Riconversione in bulk definitiva (4 su 4 agenti legacy) verso driver REST Regolo, distruggendo completamente e cancellando le codebase zombie.
- [x] **Sprint 3A. Mappa UI e View Performance**
    - [x] Rendering massivo clustering mapbox 3D.
    - [x] Flusso router di onboarding da city selector all'handling di gioco.
    - [x] Risoluzione del critical freeze da memory overload / diff re-rendering durante le operatività base sui Marker in overlay.
- [x] **Sprint 3B. System Persistency Gamification**
    - [x] Inserimento real-time rewards correlate logicamente alla temporizzazione di TimeOfDay shop client/ai.
    - [x] Inserimento e test completo infrastruttura base Supabase client side in app (Dati resi immortali in un blocco cloud-save resiliente al ricaricamento app e alla mancanza improvvisa network layer).
