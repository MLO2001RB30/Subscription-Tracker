# SubTrack DK

En mobilapp til at holde styr på dine abonnementer og få indblik i dit forbrug.

## Features

- Se alle dine abonnementer på ét sted
- Automatisk import af abonnementer via Tink bankintegration
- Detektering af gentagende betalinger
- Månedlig oversigt over dit forbrug
- Kategorisering af abonnementer
- Notifikationer om kommende fornyelser

## Setup

### Frontend (React Native + Expo)

1. Installer dependencies:
```bash
npm install
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
npx expo start --clear
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