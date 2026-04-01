# Stato del Progetto e System Audit - Itinera

> Ultimo aggiornamento: 2 Aprile 2026

## 1. Architettura di Sistema

L'architettura di "Scacchiera Urbana" (ora **Itinera**) segue un paradigma Client-Server basato su **Monorepo** (npm workspaces: `UI` e `server`). 
*   **Frontend**: React 18, Vite 5, TailwindCSS, Mappa Navigabile Mapbox 3D (`react-map-gl`), Gameloop gestito da `useGameState` con Supabase debounced mutuation pattern.
*   **Backend**: Server Node.js (Express, TSX) ad architettura modulare per isolare intelligenza generativa, proxy weather locale e synthesis TTS.
*   **Intelligenza Artificiale**: Centralizzata su engine **Regolo.ai** post-refactoring; gli orchestratori gestiscono autonomamente trivia, generazioni dialoghi e filtri dinamici a runtime senza passaggi legacy.

---

## 2. REPORT DI AUDIT ARCHITETTURALE PROFONDO

A seguito di esplorazione statica su codebase, sono emersi i seguenti debt tech, anti-pattern ed edge-cases, categorizzati per livello di criticità.

### 🔴 CRITICO (Risolvereimmediatamente)

**1. Sicurezza & Edge Cases: Accesso Supabase `game_saves` vulnerabile** 
*   **File coinvolti**: `UI/src/hooks/useGameState.ts` e DB Cloud
*   **Problema**: L'integrazione Supabase espone in client plain-text la `VITE_SUPABASE_ANON_KEY` basandosi su una PK di tipo UUID generata locally (`crypto.randomUUID()`). In assenza di Row-Level Security (RLS) protetta sul database cloud o *Anonymous Auth*, qualunque utente manipolando lo storage locale può intercettare le chiamate per inserire e sovrascrivere lo stato di salvataggio altrui, rovinando il DB.
*   **Soluzione Architetturale**: Attivare su frontend `supabase.auth.signInAnonymously()`. Nel Database abilitare RLS in strict-mode ponendo la rule SQL: `(auth.uid() = id)` forzando l'owner di sessione sulle tabelle o disabilitando i bypass di POST bruteforce.

**2. Robustezza React: Mancanza assoluta di Error Boundaries Root**
*   **File coinvolti**: `UI/src/App.tsx` e `main.tsx`
*   **Problema**: Gli asincroni hook come `useGeolocation` e gli switch logici custom della navigation in `App.tsx` non presentano classi di fallback/boundary. Se uno switch di schermata lanciasse throw (es. API json error format unmanaged), l'intero Root di React verrebbe distrutto in *White-Screen of Death* (Schermo Bianco).
*   **Soluzione Architetturale**: Wrappar l'App con la libreria `react-error-boundary` incapsulando perlomeno i router macro e esponendo una Schermata "Riconnessione/Errore di Partenza" safe che consenta il retry manuale.

### 🟠 MEDIO (Ottimizzazione Importante)

**3. Architettura & Flusso Dati: Monolithic Debounced State Sync**
*   **File coinvolti**: `UI/src/hooks/useGameState.ts`
*   **Problema**: Nonostante la protezione in *debounce* per l'upsert ottimistico verso Supabase eviti ddos da click, il frontend carica e sostituisce via POST l'intero blocco JSON (`profile`, `rewards`, `badges` combinati). Nel mid-late game l'oggetto supererà svariati kilobyte: ricaricare la nuvola su rete Mobile 3G per un semplice claim (`coins +10`) distrugge le performance di connettività. 
*   **Soluzione Architetturale**: Implementare delta/granular updates (ad es: tramite Remote Procedure Call, REST `.update()` o l'impiego nativo di librerie caching come React Query/SWR) capaci di inviare payload solo sulle field effettivamente alterate in diff.

**4. Debito Tecnico & Dead Code: File Proxy Voice Zombificati**
*   **File coinvolti**: `UI/src/services/api.ts`
*   **Problema**: Tutta l'esportazione delle call `fetchTTS` e `submitVoiceAnswer` è rimasta orfana (Dead Code). Attualmente il framework di riproduzione vocale compie la fetch del Blob Audio direttamente all'interno dei componenti figli (es. `MissionPanel.tsx` in `BUG 1 FIX`). Tali wrapper vecchi creano confusione e causerebbero memory leaks con createObjectURL se ripescati incorrettamente.
*   **Soluzione Architetturale**: Purge del codebase. Individuare l'eliminazione dei layer proxy obsoleti e uniformare il flusso asincrono blob all'interno di un unico service manager centralizzato.

### 🟡 BASSO / OTTIMIZZAZIONE (Migliorie)

**5. Prestazioni: Algoritmi di ordinamento Lineari bloccanti `O(N log N)`**
*   **File coinvolti**: `UI/src/hooks/useGameState.ts` (`getVisiblePOIs`)
*   **Problema**: La funzione che recupera i point interattivi più vicini ricalcola per tutti l'intero array delle città. Richiama `.sort()` ed array iterators in cascata filtrando chilometricamente su Main Thread puro al muovere del GPS. Per densità metropolitane complesse produrrà *Stuttering UI* mobile.
*   **Soluzione Architetturale**: Eseguire l'offload dei filtraggi geospaziali implementando indici WebWorker client-side o sfruttando strutture dati ad-hoc per calcoli di vicinanza geometrica come RBTree / K-D Tree, smettendo di ricomparare distanze a tappeto su tutto lo stack.

**6. Code Smells: Type-Safety Debole su Componenti Mapbox**
*   **File coinvolti**: `UI/src/components/MapView.tsx`
*   **Problema**: Abuso marginale di keyword d'evasione su TS (`evt: any`) negli unmanaged events di react-map-gl, causando mancanza di intelliscence e protezioni IDE sugli handler di stopPropagation per la feature "click/pan" in mappe.
*   **Soluzione Architetturale**: Tipizzazione formale tramite importazione diretta dell'interfaccia `MapLayerMouseEvent` ed estensione corretta delle sintassi TypeScript.
