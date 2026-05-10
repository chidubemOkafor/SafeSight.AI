# SafeSight Client

Next.js frontend for the SafeSight AI video safety inspection MVP.

## Setup

```powershell
cd C:\Users\Elitebook\Documents\github\hackathon\SafeSight\SafeSight_client
npm install
```

## Environment

Create `.env.local` if you need to override the backend URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://129.212.188.198:8080
```

## Run

```powershell
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

Make sure the FastAPI backend is running at:

```text
http://129.212.188.198:8080
```

## Useful Scripts

```powershell
npm run build
npm run lint
```
