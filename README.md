# Lensio - AI Video Generation Platform

Enterprise-grade multi-platform AI short-form video generation system.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Redis
- Docker (optional)

### Development Setup

1. **Clone and install dependencies**

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd services
pip install -e ".[dev]"
```

2. **Configure environment**

```bash
# Copy environment templates
cp apps/web/.env.example apps/web/.env.local
cp services/.env.example services/.env

# Edit with your API keys
```

3. **Start development servers**

```bash
# Start all services with Docker
docker-compose up

# Or start individually:
# Terminal 1 - Next.js
npm run dev:web

# Terminal 2 - Python API
cd services && uvicorn lensio.api.app:app --reload
```

4. **Access the application**

- Web: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## 📁 Project Structure

```
lensio/
├── apps/
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── lib/         # Utilities (Firebase, API)
│       │   └── stores/      # Zustand state
│       └── ...
├── packages/
│   └── types/               # Shared TypeScript types
│       └── src/
├── services/                # Python backend
│   └── lensio/
│       ├── api/             # FastAPI application
│       ├── ai/              # AI prompt engines
│       ├── pipeline/        # Video generation pipeline
│       ├── models/          # Pydantic models
│       └── core/            # Configuration
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🔧 Architecture

- **Frontend**: Next.js 14 + React + Tailwind CSS + Zustand
- **Backend**: FastAPI + Python 3.11
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Queue**: Redis + Cloud Tasks
- **AI**: OpenAI GPT-4o, Anthropic Claude
- **Storage**: Google Cloud Storage + Google Drive

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | POST | Create generation job |
| `/api/jobs/:id` | GET | Get job details |
| `/api/jobs/:id/status` | GET | Get job status |
| `/api/niches` | GET | List available niches |
| `/api/user/credits` | GET | Get credit balance |

## 🎯 Key Features

- 🎬 AI-powered script generation
- 🖼️ Automatic image/video generation
- 📱 Multi-platform support (TikTok, YouTube Shorts, Instagram)
- ☁️ Google Drive export
- 💳 Credit-based billing system
- 🔒 Enterprise-grade security

## 📄 License

Proprietary - All rights reserved.
