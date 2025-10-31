# SubTrack DK

En mobilapp til at holde styr på dine abonnementer og få indblik i dit forbrug.

## Features

- Se alle dine abonnementer på ét sted
- Automatisk import af abonnementer via Tink bankintegration
- Detektering af gentagende betalinger
- Månedlig oversigt over dit forbrug
- Kategorisering af abonnementer
- Notifikationer om kommende fornyelser

## Prerequisites

**Node.js Version Requirement:**
- Node.js 18 LTS or Node.js 20 LTS (recommended)
- **Node.js 22+ is NOT supported** by Expo SDK 53

If you're running Node 22 or newer, install/start commands will fail with a clear error message.
See [NODE_VERSION_FIX.md](../NODE_VERSION_FIX.md) for detailed instructions on switching versions.

### Quick Start with NVM
```bash
# Install Node 20 (if not already installed)
nvm install 20
nvm use  # Uses .nvmrc to automatically select Node 20

# Verify
node --version  # Should show v20.x.x
```

## Setup

### Frontend (React Native + Expo)

1. Installer dependencies:
```bash
npm install  # Automatically checks Node version before installing
```

2. Opret en `.env` fil i rodmappen med følgende indhold:
```
TINK_CLIENT_ID=din_client_id
TINK_CLIENT_SECRET=din_client_secret
TINK_REDIRECT_URI=din_redirect_uri
BACKEND_URL=http://localhost:8000
```

3. Start Expo udviklingsserveren:
```bash
npm start  # Automatically checks Node version before starting
# Or: npm run clear (to clear cache)
```

### Backend (FastAPI)

1. Opret et virtuelt miljø og installer dependencies:
```bash
python -m venv venv
source venv/bin/activate  # På Windows: venv\Scripts\activate
pip install fastapi uvicorn httpx python-dotenv
```

2. Start backend serveren:
```bash
cd backend
uvicorn app:app --reload
```

## Tink Integration

Appen bruger Tink's PSD2/Open Banking API til at:
1. Autentificere brugeren via deres bank
2. Hente transaktioner
3. Detektere gentagende betalinger som abonnementer

For at bruge Tink integrationen skal du:
1. Oprette en Tink udviklerkonto
2. Få godkendt din app til PSD2
3. Konfigurere dine credentials i `.env` filen

## Udvikling

### Projektstruktur

```
SubTrackDK/
├── assets/              # Billeder og andre statiske filer
├── backend/            # FastAPI backend
│   └── app.py         # Backend API endpoints
├── components/         # Genbrugelige React Native komponenter
├── constants/         # Konstanter og tema
├── context/          # React Context providers
├── navigation/       # Navigation konfiguration
├── screens/         # App skærme
└── services/        # API og andre services
```

### TypeScript

Projektet bruger TypeScript for bedre type-sikkerhed. For at tilføje nye typer:

1. Opret en ny `.d.ts` fil i `types/` mappen
2. Eksporter dine typer
3. Importer dem hvor de skal bruges

## Sikkerhed

- Aldrig commit `.env` filen til Git
- Brug HTTPS i produktion
- Implementer rate limiting på backend
- Valider alt input
- Håndter tokens sikkert

## Licens

MIT 