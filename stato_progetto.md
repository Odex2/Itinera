# Stato del Progetto - Scacchiera Urbana

## 1. Architettura di Sistema

L'architettura attuale di "Scacchiera Urbana" segue un paradigma Client-Server, unita a un motore di orchestrazione AI per personalizzare dinamicamente l'esperienza dell'utente.

*   **Frontend (UI)**: 
    *   Applicazione scritta in **React 18** + **TypeScript** con build tool Vite. Lo stile è gestito con **TailwindCSS**.
    *   Il nucleo della gamification (profili, punti exp, monete, ricompense) e la gestione dinamica dei POI (Points of Interest) sono centralizzati in `useGameState.ts`.
    *   La mappa interattiva (`MapView.tsx`) utilizza **Mapbox GL JS** (`react-map-gl` + `mapbox-gl`) con funzionalità avanzate: edifici 3D estesi, clustering visivo, calcolo di prossimità basato su bounding box geofencing spaziale.

*   **Backend (Server)**:
    *   Server **Node.js** con **Express** e **TypeScript**, focalizzato in questa fasa per servire le funzionalità di Intelligenza Artificiale.

*   **AI Orchestration**:
    *   Il backend agisce da proxy e orchestratore verso i modelli LLM (tramite pacchetto `openai`).
    *   Il file `routes/ai.ts` evidenzia l'architettura a tre agenti distinti:
        *   `dialogueWriter`: Genera descrizioni e short-stories su misura per un luogo (`/api/ai/narration`).
        *   `quizGenerator`: Crea quiz o "challenge" dinamiche basate sugli interessi utente (`/api/ai/challenge`).
        *   `answerValidator`: Valida la correttezza della risposta dell'utente in tempo reale (`/api/ai/validate`).

## 2. Problemi Critici Rilevati

> [!WARNING]
> **Dipendenze Duplicate (React / Mapbox / MapLibre)**
> L'analisi dei `package.json` mostra un grave problema di gestione delle dipendenze, tipico di monorepo non configurati correttamente o aggiornamenti parziali.  
> *   **Root `package.json`** installa `react-map-gl@^8.1.0` e `mapbox-gl@^3.20.0`.
> *   **UI `package.json`** installa `react-map-gl@^7.1.9` e anch'esso `mapbox-gl@^3.20.0`.
> 
> La presenza di versioni discordanti di `react-map-gl` assieme all'installazione di moduli UI nella root del progetto creerà collisioni con il Virtual DOM di React ("invalid hook call") e problemi noti con Mapbox/MapLibre su bundle differenti.

## 3. Roadmap / Sprint Checklist

- [ ] **Sprint 1. Setup**: Risoluzione dipendenze duplicate, normalizzazione ambiente monorepo.
- [ ] **Sprint 2. Backend**: Consolidamento agenti AI (narrazione, quiz, validazione) e integrazione lato Express.
- [ ] **Sprint 3A. Mappa**: Coreografia della mappa 3D, ottimizzazione del clustering e dei marker personalizzati.
- [ ] **Sprint 3B. UI**: Gamification state (xp, monete, profili), interfaccia di onboarding e interazioni utente.
