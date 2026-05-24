# AssessAI - Assessment Generation System

A production-grade assessment generation system that leverages Large Language Models to automatically create high-quality question papers from uploaded documents.

## 🚀 Features

- **AI-Powered Question Generation**: Uses Anthropic Claude 3.5 Sonnet, OpenAI GPT-4 and optional Groq-accelerated inference with smart routing
- **Interactive AI Edits**: Per-question and per-section AI refinements with `edit_history` and undo support
- **Real-time Generation Status**: WebSocket-based live updates with HTTP polling fallback
- **Flexible Question Types**: MCQ, Short Answer, Essay, Fill-in-the-blank
- **Difficulty Distribution**: Configure easy/medium/hard ratios
- **PDF Export**: Print-ready question paper generation
- **Cost Optimization**: Semantic caching reduces API costs by 90%
- **Resilient Architecture**: Circuit breaker, rate limiting, async processing
- **Type-Safe**: TypeScript + Zod validation throughout

## 📋 Project Structure

```
vedaai-assessment/
├── backend/                    # Express + Node.js server
│   ├── src/
│   │   ├── index.ts           # Express entry point
│   │   ├── config/            # Database, Redis, env setup
│   │   ├── models/            # Mongoose schemas
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── queue/             # Bull queue producer & worker
│   │   ├── cache/             # Semantic caching logic
│   │   ├── llm/               # LLM providers & routing
│   │   ├── generator/         # Question generation pipeline
│   │   ├── pdf/               # PDF rendering
│   │   ├── services/          # Utility services
│   │   ├── ws/                # WebSocket connection hub
│   │   └── utils/             # Logging, cost estimation
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # Next.js React application
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # React components
│   │   ├── store/             # Zustand state management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── styles/            # Global styles & tokens
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── FIGMA_MAP.md
│
├── architecture/
│   └── design-doc.md          # Detailed architecture & design decisions
│
├── DECISIONS.md               # Technical decision log with trade-offs
├── README.md                  # This file
└── package.json               # Root workspace scripts (optional)
```

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Language**: TypeScript 5
- **Database**: MongoDB + Mongoose
- **Cache**: Redis + ioredis
- **Queue**: Bull 5.x (Redis-backed)
- **LLM APIs**: Anthropic, OpenAI
- **LLM APIs**: Anthropic, OpenAI, Groq (optional accelerated inference)
- **PDF**: pdf-lib
- **Validation**: Zod
- **Logging**: Pino
- **Rate Limiting**: express-rate-limit + rate-limit-redis

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State**: Zustand 4
- **Forms**: React Hook Form + @hookform/resolvers
- **Icons**: Lucide React
- **API**: Typed fetch client, WebSocket

## 📦 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MongoDB**: 6.x running locally or Atlas
- **Redis**: 7.x running locally or cloud instance
- **API Keys**: Anthropic and OpenAI (add to .env)

## ⚙️ Installation & Setup

### 1. Clone & Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, and API keys
```

Example `.env` values:

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000
```

### 3. Initialize MongoDB Schema

Run the MongoDB migration command once the database URI is configured. This creates the `assignments` collection if needed and syncs the schema indexes used by the backend.

```bash
cd backend
npm run db:migrate
```

### 4. Start Services

#### Option A: Using Docker Compose (Recommended)

```bash
# From root directory
docker-compose up -d mongo redis

# Then start servers
cd backend && npm run dev
cd ../frontend && npm run dev
```

#### Option B: Manual Setup

```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/mongo

# Terminal 2: Start Redis
redis-server

# Terminal 3: Backend
cd backend
npm run dev
# Logs: listening on 4000

# Terminal 4: Frontend
cd frontend
npm run dev
# Logs: compiled client and server successfully
```

### 4. Access the Application

- **Frontend**: https://assess-ai-drab.vercel.app
- **Backend API**: https://assessai-3r2j.onrender.com


## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests (coming soon)
npm test
```

## 📚 Architecture Overview

### Request Flow

```
User uploads document
    ↓
Frontend validates (Zod schema)
    ↓
POST /api/assessment
    ↓
Backend validates, creates job
    ↓
Enqueue to Bull/Redis
    ↓
202 Accepted response with jobId
    ↓
Frontend opens WebSocket
    ↓
Bull worker picks job
    ↓
Generate questions (LLM)
    ↓
Validate output (Zod)
    ↓
Save to MongoDB
    ↓
Broadcast to WebSocket
    ↓
User sees results
```

### LLM Routing

- **Default**: Anthropic Claude 3.5 Sonnet (fast, cheap, creative)
- **Validation**: OpenAI GPT-4 Turbo (complex reasoning)
- **Fallback**: Automatic circuit breaker if primary fails
- **Caching**: Semantic similarity matching (Redis)

## 🔐 Security

- Input validation with Zod schemas
- Prompt injection guards
- Rate limiting (per-IP, per-user)
- CORS whitelisting
- Structured logging for audits
- 30-day data retention TTL
- Optional WebSocket authentication

## 📊 Performance Targets

| Metric              | Target       |
| ------------------- | ------------ |
| P50 Generation Time | 15 seconds   |
| P99 Generation Time | 60 seconds   |
| Cost per Question   | $0.02-0.05   |
| API Availability    | 99.5%        |
| Throughput          | 100 jobs/min |

## 🗺️ Design System

All design tokens (colors, typography, spacing) are extracted from Figma and available in [frontend/src/styles/tokens.ts](frontend/src/styles/tokens.ts).

See [frontend/FIGMA_MAP.md](frontend/FIGMA_MAP.md) for complete Figma ↔ Component mappings.

## 📖 Documentation

- **Architecture**: [architecture/design-doc.md](architecture/design-doc.md)
- **Decisions**: [DECISIONS.md](DECISIONS.md)
- **Figma Map**: [frontend/FIGMA_MAP.md](frontend/FIGMA_MAP.md)
- **Environment Setup**: [backend/.env.example](backend/.env.example)

## 🚀 Deployment

### Prerequisites

- Docker & Docker Compose
- MongoDB Atlas (or self-hosted)
- Redis Cloud (or self-hosted)
- Vercel (for frontend, optional)

### Production Build

```bash
# Backend
npm run build
npm start

# Frontend (Vercel or self-hosted)
npm run build
npm start
```

### Scaling

- Backend: Horizontal scaling behind load balancer
- Frontend: Vercel or CDN
- Database: MongoDB replica set
- Cache: Redis cluster

## 📝 API Reference

### Create Assignment

```
POST /api/assessment
Content-Type: application/json

{
  "documentText": "...",
  "questionTypes": ["mcq", "short"],
  "sectionCount": 3,
  "difficulty": { "easy": 0.3, "medium": 0.5, "hard": 0.2 },
  "includeStudentInfo": true
}

Response: 202 Accepted
{
  "jobId": "uuid",
  "estimatedCost": 0.15,
  "status": "queued"
}
```

### Get Assignment Status

```
GET /api/assessment/:jobId

Response: 200 OK (if complete) | 202 Accepted (if processing)
{
  "jobId": "uuid",
  "status": "completed",
  "progress": 100,
  "result": { ... }
}
```

### Download PDF

```
GET /api/assessment/:jobId/pdf

Response: 200 OK with PDF binary
```

## 🤝 Contributing

Follow the architecture in [architecture/design-doc.md](architecture/design-doc.md) and decisions in [DECISIONS.md](DECISIONS.md).

## 📄 License

MIT

## 👥 Team

- **Architecture**: AI Assistant
- **Frontend**: React/Next.js Team
- **Backend**: Node.js/TypeScript Team

## 📞 Support

For issues, questions, or suggestions, refer to:

- Design System: [frontend/FIGMA_MAP.md](frontend/FIGMA_MAP.md)
- Architecture: [architecture/design-doc.md](architecture/design-doc.md)
- Decisions: [DECISIONS.md](DECISIONS.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025-05-21  
**Status**: Section 0 - Project Scaffold Complete ✅
