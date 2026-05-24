# VedaAI Assessment Generation System - Architecture & Design Document

## Executive Summary

VedaAI is a production-grade assessment generation system that leverages Large Language Models (LLMs) to automatically create high-quality question papers from uploaded documents. The system is built as a monorepo with a Node.js/Express backend and Next.js frontend, designed for scalability, reliability, and cost-efficiency. The architecture supports multiple inference backends — cloud LLM APIs, optional Groq-accelerated inference, and surgical AI edit workflows that allow per-question and per-section refinements with full edit history and undo/restore.

**Key Metrics Target:**

- Question Generation: 30-60 seconds per paper
- Cost Optimization: Smart LLM routing (Claude 3.5 Sonnet for fast paths, GPT-4 for complex validation)
- Availability: 99.5% uptime with circuit breaker patterns
- Scalability: Async queue processing with Bull/Redis

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend (Port 3000)           │
│  • Assignment Creation Form                             │
│  • Real-time Generation Status (WebSocket)              │
│  • Question Paper Viewer & PDF Download                 │
└─────────────────────────────────────────────────────────┘
                            ↓↕ (HTTP + WebSocket)
┌─────────────────────────────────────────────────────────┐
│              Express Backend (Port 4000)                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ API Layer                                        │   │
│  │ • POST /api/assessment (create assignment)       │   │
│  │ • GET /api/assessment/:jobId (fetch status)      │   │
│  │ • WebSocket /ws/:jobId (live updates)            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Generation Orchestration                         │   │
│  │ • Question Paper Generator                       │   │
│  │ • LLM Router & Circuit Breaker                   │   │
│  │ • Semantic Cache (Redis)                         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Processing Queue (Bull/Redis)                    │   │
│  │ • Producer: Enqueue generation tasks             │   │
│  │ • Worker: Process async generation               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
        ↓              ↓              ↓
   ┌────────┐    ┌──────────┐   ┌────────────┐
   │ MongoDB│    │  Redis   │   │ Anthropic  │
   │ Store  │    │  Cache   │   │ & OpenAI   │
   └────────┘    └──────────┘   │   APIs     │
                                 └────────────┘
```

---

## Core Components

### 1. Frontend (Next.js 14 + React 18)

**Technology Stack:**

- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS 3
- State Management: Zustand
- Form Handling: React Hook Form + Zod validation
- Icons: Lucide React
- API Client: Typed fetch with real-time WebSocket

**Key Features:**

- **Assignment Creation Screen**:
  - Document upload (PDF/TXT) with validation
  - Question type selection (MCQ, Short Answer, Essay, Fill-in-blank)
  - Difficulty distribution configuration
  - Student info inclusion (name, roll, class, etc.)
- **Generation Status Screen**:
  - Real-time WebSocket updates
  - Progress tracking with cost estimation
  - Cancel option for running jobs
  - Fallback to polling if WebSocket unavailable
- **Question Paper Viewer**:
  - Print-optimized layout
  - PDF download functionality
  - Per-section regeneration options
  - Full-paper regeneration workflow

**State Management:**

- `assignmentStore`: Form data, current assignment state
- `wsStore`: WebSocket connection state, live updates

---

### 2. Backend (Express + TypeScript)

#### 2.1 API Layer

**Endpoints:**

```
POST /api/assessment
  Input: { documentText, questionTypes[], sectionCount, difficulty, includeStudentInfo }
  Output: { jobId, estimatedCost, status }
  Status: 202 (Accepted, job enqueued)

GET /api/assessment/:jobId
  Output: { jobId, status, progress, cost, result }
  Status: 200 (OK) or 404 (Not found) or 202 (Still processing)

GET /api/assessment/:jobId/pdf
  Output: PDF binary
  Status: 200 (OK) or 404 (Not found)

DELETE /api/assessment/:jobId
  Output: { message, jobId }
  Status: 200 (OK) - cancels if queued
```

**Middleware Stack:**

- Rate Limiting: Per-IP + per-user (Redis backed)
- Idempotency: Idempotency-Key header support
- Error Handling: Centralized error handler with proper HTTP codes
- CORS: Whitelist http://localhost:3000 in development
- Request Logging: Structured logs via Pino

#### 2.2 Queue System (Bull/Redis)

**Architecture:**

- Producer enqueues generation tasks in Redis queue
- Worker processes tasks concurrently (configurable concurrency)
- Failed jobs auto-retry with exponential backoff
- Dead-letter queue for permanently failed jobs

**Job Payload:**

```typescript
interface GenerationJob {
  jobId: string;
  documentText: string;
  questionTypes: string[];
  sectionCount: number;
  difficulty: { easy: number; medium: number; hard: number };
  includeStudentInfo: boolean;
  createdAt: Date;
  userId?: string;
}
```

#### 2.3 LLM Integration

**Smart Routing Logic:**

- **Anthropic Claude 3.5 Sonnet** (Default):
  - Fast generation for standard question types
  - Cost-effective for creative content
- **OpenAI GPT-4 Turbo** (Complex cases):
  - Used for validation & fine-tuning
  - Mathematical question verification and complex reasoning
- **Groq Accelerated Inference** (Optional):
  - Hardware-accelerated inference path for high-throughput or on-prem workloads
  - Useful for batch generation and scenarios where lower latency and predictable cost are required

**Circuit Breaker Pattern:**

- Monitor LLM/API error rates
- If >10% errors in last 100 calls, switch to fallback model
- Auto-recovery when error rate drops below 5%
- Immediate fail-fast for known API outages

**Semantic Cache:**

- Redis-backed embedding cache
- Cosine similarity matching (threshold: 0.85)
- TTL: 7 days for similar prompts
- Saves 90% on API costs for repeated question types

**AI Edit / Surgical Refinement:**

- The backend exposes targeted edit APIs that accept a `scope` (`question` | `section`) and an `action` (e.g., `refine`, `simplify`, `translate`, `change-difficulty`).
- Edits are executed as minimal LLM calls that receive the original scope context and return only the modified JSON for that scope — this minimizes cost and preserves the rest of the paper.
- Each edit is recorded in an `edit_history` array on the `Assignment` document with metadata (scope, action, author, timestamp, originalContent, newContent) to enable undo and auditing.
- UI updates are broadcast via WebSocket events such as `question_updated` and `section_updated` so the frontend can apply the change in-place without full regeneration.

#### 2.4 Question Paper Generation

**Pipeline:**

1. **Parse & Sanitize Input**: Extract text, remove injection patterns
2. **Section Division**: Split document into logical sections
3. **Question Generation**: LLM generates questions per section
4. **JSON Repair**: Fix malformed LLM output using regex + repair strategies
5. **Zod Validation**: Strict schema validation of output
6. **Business Logic Validation**: Check marks distribution, question counts
7. **PDF Rendering**: Generate print-ready PDF

**Zod Schema (questionPaper.ts):**

```typescript
const QuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  type: z.enum(["mcq", "short", "essay", "fillblank"]),
  options: z.array(z.string()).optional(),
  marks: z.number().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()),
});

const QuestionPaperSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      questions: z.array(QuestionSchema),
    }),
  ),
  totalMarks: z.number().positive(),
  duration: z.number().positive(),
  studentInfo: StudentInfoSchema.optional(),
});
```

#### 2.5 Database Schema (MongoDB)

**Assignment Document:**

```typescript
{
  _id: ObjectId,
  jobId: string (unique, indexed),
  status: 'queued' | 'processing' | 'completed' | 'failed',
  input: {
    documentText: string,
    questionTypes: string[],
    sectionCount: number,
    difficulty: object,
    includeStudentInfo: boolean
  },
  output: {
    questionPaper: object,
    costBreakdown: { inputTokens, outputTokens, estimatedCost },
    generatedAt: Date
  },
  error?: {
    message: string,
    code: string,
    timestamp: Date
  },
  createdAt: Date (indexed),
  updatedAt: Date (indexed),
  expiresAt: Date (TTL index, 30 days)
}
```

#### 2.6 WebSocket Hub

**Connection Management:**

- Namespace: `/ws/:jobId`
- Authentication: Optional Bearer token
- Events:
  - `status`: { status, progress, cost }
  - `complete`: { jobId, result }
  - `error`: { message, code }

**Auto-Reconnect & Fallback:**

- Client auto-reconnects on connection loss (exponential backoff)
- Fallback to HTTP polling if WebSocket unavailable
- Server broadcasts to all connected clients for a job

---

### 3. Supporting Services

#### 3.1 File Parser (fileParser.ts)

- PDF extraction using pdf-parse
- Text sanitization (remove control chars, normalize whitespace)
- Support for mixed text/image PDFs
- Max file size: 10MB

#### 3.2 Prompt Injection Guard (promptInjectionGuard.ts)

- Detects common injection patterns
- Strips role-playing prompts
- Validates input before sending to LLM
- Logs suspicious inputs for audit

#### 3.3 Cost Estimator (utils/cost.ts)

- Token counting (approximate based on character ratio)
- Rate calculation per model:
  - Claude 3.5 Sonnet: $3/$15 per 1M tokens (input/output)
  - GPT-4 Turbo: $10/$30 per 1M tokens
- Real-time cost display to user

#### 3.4 PDF Renderer (pdf/render.ts)

- Uses pdf-lib for in-memory PDF generation
- Supports:
  - Multi-page rendering
  - Header/footer (page numbers)
  - Table of contents
  - Marking scheme section
  - Watermarks (optional)

#### 3.5 Logger (utils/logger.ts)

- Pino-based structured logging
- Log levels: debug, info, warn, error
- Request ID tracking for debugging
- Performance metrics (duration, tokens)

---

## Data Flows

### Assignment Creation Flow

```
User uploads document
        ↓
Frontend validates input (Zod)
        ↓
POST /api/assessment
        ↓
Backend validates & creates job
        ↓
Enqueue to Bull/Redis
        ↓
Return jobId to frontend (202 Accepted)
        ↓
Frontend opens WebSocket to /ws/:jobId
```

### Generation Processing Flow

```
Worker picks job from queue
        ↓
Parse & sanitize document
        ↓
Check semantic cache
        ↓ (Hit) → Return cached result → Skip LLM
        ↓ (Miss)
Send to LLM (Anthropic/OpenAI)
        ↓
Receive JSON response
        ↓
JSON repair if needed
        ↓
Zod validation
        ↓
Business logic validation
        ↓
Save to MongoDB
        ↓
Broadcast to WebSocket clients
```

### Result Retrieval Flow

```
User navigates to /output/:jobId
        ↓
Frontend fetches GET /api/assessment/:jobId
        ↓ (Still processing)
Open WebSocket, show loading
        ↓ (Complete)
Display rendered paper
        ↓
Download PDF option
```

---

## Error Handling & Resilience

### Rate Limiting

- Per-IP: 20 requests/minute (configurable)
- Per-user: 10 jobs/hour
- Fallback to 429 (Too Many Requests)
- Redis-backed for distributed deployments

### Circuit Breaker

- Monitors LLM API failures
- States: Closed (normal), Open (failing), Half-Open (testing recovery)
- Threshold: 10 consecutive failures or >10% error rate
- Recovery timeout: 60 seconds

### Retry Logic

- Failed jobs retry with exponential backoff: 1s, 4s, 16s, 64s
- Max 3 retries per job
- Dead-letter queue for permanent failures

### Validation

- Input validation: Zod schemas at API boundary
- Output validation: Zod schemas on LLM responses
- Business validation: Marks totals, question counts, types

---

## Performance Targets

| Metric              | Target          | Strategy                         |
| ------------------- | --------------- | -------------------------------- |
| P50 Generation Time | 15 seconds      | Model optimization, caching      |
| P99 Generation Time | 60 seconds      | Queue prioritization             |
| Cost per Question   | $0.02-0.05      | Smart routing, semantic cache    |
| Availability        | 99.5%           | Circuit breaker, fallback models |
| Throughput          | 100 jobs/minute | Async processing, worker scaling |

---

## Deployment Considerations

### Environment Variables

See [backend/.env.example](../backend/.env.example)

### Docker Setup (Future)

- Backend: Node 20 Alpine, multi-stage build
- Frontend: Next.js standalone output
- Redis: Official Redis image
- MongoDB: Bitnami MongoDB image

### Horizontal Scaling

- Backend: Stateless API servers behind load balancer
- Worker: Multiple Bull worker processes
- Frontend: Vercel or static deployment
- Database: MongoDB replica set
- Cache: Redis cluster

### Monitoring & Observability

- Structured logs (Pino) to stdout
- Integration: Datadog/CloudWatch
- Metrics: Job success rate, LLM latency, cost tracking
- Alerts: Circuit breaker activation, queue depth >1000

---

## Security Considerations

1. **Input Validation**: Zod schemas + injection guards
2. **Rate Limiting**: Prevent abuse
3. **CORS**: Whitelist frontend origin
4. **API Keys**: Never log, rotate regularly
5. **PDF Sanitization**: Validate before generation
6. **WebSocket Auth**: Optional Bearer token
7. **Data Retention**: TTL index on assignments (30 days)

---

## Future Enhancements

- [ ] User authentication & multi-tenancy
- [ ] Question templates & preset configurations
- [ ] Bulk assignment processing
- [ ] Integration with learning management systems (Canvas, Blackboard)
- [ ] Fine-tuning per institution
- [ ] Analytics dashboard (cost, generation times)
- [ ] Export formats (Word, Google Docs)
- [ ] Plagiarism detection
- [ ] Question difficulty calibration via user feedback

---

## References

- Figma Design: https://www.figma.com/design/2PifuhfsyGdRvvFOug4Sjo/VedaAI---Hiring-Assignment
- FIGMA_MAP: [frontend/FIGMA_MAP.md](../frontend/FIGMA_MAP.md)
- Decision Log: [DECISIONS.md](../DECISIONS.md)
- Environment Setup: [backend/.env.example](../backend/.env.example)

---

**Document Version**: 1.0  
**Last Updated**: 2025-05-21  
**Author**: AI Architecture Assistant
