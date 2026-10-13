# Itinera

Itinera is an AI-powered, location-based city discovery game. It turns a walk through the city into an interactive adventure by combining nearby points of interest, personalized narration, quizzes, voice challenges, rewards, and real-time context such as weather and opening hours.

## Hackathon project

Itinera was developed for the **Codemotion Hackathon “Hack Nation”** in Rome, held on **28–29 March 2026**.

The project was created in response to the **“Play the City” challenge by Gunpowder**, exploring how technology, AI, and gamification can transform the way people discover and experience a city.

## Features

- **Interactive city map** with nearby points of interest (POIs)
- **Location-aware exploration** using the browser's geolocation APIs
- **City selection** for exploring a location other than the user's current position
- **AI-generated narration** tailored to the user's interests, personality, and time of day
- **Dynamic POI discovery** powered by OpenStreetMap/Overpass and AI-generated hidden gems
- **Interactive challenges and quizzes** for discovered locations
- **Voice challenges** with speech synthesis and audio-answer transcription
- **Weather-aware exploration**
- **Gamification**, including XP, rewards, badges, missions, and a shop
- **Opening-hours filtering** and tracking of completed locations

## Project structure

```text
.
├── UI/                  # React + Vite frontend
│   └── src/
│       ├── components/  # Screens and reusable UI components
│       ├── hooks/       # Application state and geolocation hooks
│       └── App.tsx      # Main application flow
├── server/              # Express + TypeScript backend
│   └── src/
│       ├── agents/      # AI agents for narration, quizzes, discovery, and validation
│       ├── routes/      # AI, weather, voice, and discovery endpoints
│       ├── services/    # External API integrations
│       └── index.ts     # HTTP server entry point
└── package.json         # Shared map-related dependencies
```

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Mapbox GL JS and `react-map-gl`
- Lucide React icons
- Supabase client library

### Backend

- Node.js
- Express
- TypeScript
- OpenAI SDK
- OpenStreetMap Overpass API
- ElevenLabs text-to-speech integration
- OpenWeather integration

## Prerequisites

- Node.js 18 or newer
- npm
- A Mapbox access token
- API credentials for the services you want to enable:
  - Regolo/OpenAI-compatible AI and speech-to-text features
  - ElevenLabs voice synthesis
  - OpenWeather weather data

## Installation

Clone the repository and install dependencies for the frontend and backend:

```bash
git clone https://github.com/Odex2/Itinera.git
cd Itinera

npm install
cd UI && npm install
cd ../server && npm install
```

## Environment variables

Create a `.env` file in the `server/` directory:

```env
PORT=3001
REGOLO_API_KEY=your_regolo_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

Configure the frontend with the environment variables expected by your Vite setup, including your Mapbox token. Vite variables must use the `VITE_` prefix. For example:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

Do not commit real API keys or tokens. Add local environment files to `.gitignore` if they are not already ignored.

## Running locally

Start the backend in development mode:

```bash
cd server
npm run dev
```

In a second terminal, start the frontend:

```bash
cd UI
npm run dev
```

Open the local URL printed by Vite in your browser. The backend listens on port `3001` by default.

You can verify that the backend is running with:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": 0
}
```

The timestamp is generated at request time.

## Production build

Build the backend:

```bash
cd server
npm run build
npm start
```

Build and preview the frontend:

```bash
cd UI
npm run build
npm run preview
```

## API overview

The backend exposes the following route groups:

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `POST /api/ai/narration` | Generate personalized POI narration |
| `POST /api/ai/challenge` | Generate quizzes and challenges |
| `POST /api/ai/validate` | Validate a written challenge answer |
| `POST /api/ai/discover-pois` | Discover nearby POIs using Overpass and AI |
| `POST /api/ai/spoken-challenge` | Generate an audio-based challenge |
| `POST /api/ai/answer-challenge` | Transcribe and validate a spoken answer |
| `POST /api/ai/filter-open` | Filter POIs by opening hours |
| `GET /api/ai/overpass` | Query nearby OpenStreetMap elements |
| `POST /api/ai/uncompleted` | Filter out completed POIs |
| `POST /api/ai/mark-completed` | Mark a POI as completed |
| `GET /api/weather` | Fetch weather for a latitude/longitude |
| `POST /api/voice/tts` | Convert text to MP3 speech |

## Development scripts

### Frontend (`UI/`)

```bash
npm run dev        # Start the Vite development server
npm run build      # Create a production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
npm run preview    # Preview the production build
```

### Backend (`server/`)

```bash
npm run dev    # Start the server with file watching
npm run build  # Compile TypeScript to dist/
npm start       # Run the compiled server
```

## Notes

- Browser geolocation requires permission and is generally served over HTTPS outside localhost.
- POI discovery combines real nearby OpenStreetMap data with AI-generated enrichment.
- Voice endpoints require the relevant API credentials and return a service-unavailable response when voice services are not configured.
- The backend currently enables permissive CORS for development and tunnel environments. Restrict allowed origins before deploying publicly.
- Completed POIs are currently tracked through the server's in-memory store, so this state is not durable across server restarts.

## License

No license has been specified for this project yet.
