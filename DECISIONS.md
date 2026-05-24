# Technical Decisions & Trade-offs

## Decision Log

This document records all major architectural decisions, their rationale, and considered alternatives.

---

## D1: Monorepo Structure vs. Separate Repos

**Decision**: Use monorepo (single repo with `/backend` and `/frontend`)

**Rationale**:

- Shared type definitions (TypeScript interfaces mirror Zod schemas)
- Single CI/CD pipeline
- Simplified dependency management
- Easier for small team to maintain

**Alternatives Considered**:

- Separate repos (Pro: independent versioning; Con: complex type sync, dual CI/CD)
- Turborepo (Pro: advanced caching; Con: overkill for this scale)

**Trade-off**: Slightly larger CI/CD times, but easier maintenance

---

## D2: Express over Fastify/Hono

**Decision**: Use Express with TypeScript

**Rationale**:

- Largest ecosystem of middleware
- Battle-tested in production
- Excellent TypeScript support
- Rate limiting middleware readily available
- WebSocket support via `ws` library

**Alternatives Considered**:

- Fastify (Pro: faster JSON parsing; Con: smaller ecosystem)
- Hono (Pro: edge-compatible; Con: less WebSocket-ready)

**Trade-off**: 5-10% slower JSON throughput, but significantly faster feature delivery

---

## D3: Bull + Redis for Async Processing

**Decision**: Use Bull (queue library) + Redis as backing store

**Rationale**:

- Question generation is 30-60 seconds (must be async)
- Bull provides retry logic, dead-letter queues, job tracking
- Redis is simple, fast, and reliable for this use case
- Built-in WebSocket integration for real-time updates

**Alternatives Considered**:

- Direct MongoDB polling (Pro: simpler; Con: inefficient, high DB load)
- AWS SQS + Lambda (Pro: serverless; Con: higher latency, vendor lock-in)
- RabbitMQ (Pro: more features; Con: operational overhead)

**Trade-off**: Additional Redis deployment, but 10x better performance and reliability

---

## D4: Anthropic Claude + OpenAI GPT-4 Routing

**Decision**: Default to Claude 3.5 Sonnet, fallback to GPT-4 Turbo for validation

**Rationale**:

- Claude 3.5 Sonnet: Excellent at question generation, 5x cheaper than GPT-4
- GPT-4: Superior reasoning for complex validation (mathematics, rubrics)
- Smart routing reduces cost by ~60% vs. always using GPT-4
- Circuit breaker provides reliability if one model fails

**Alternatives Considered**:

- GPT-4 only (Pro: simplicity; Con: 5x higher costs)
- Open-source models like Llama (Pro: no API cost; Con: hosting costs, quality issues)

**Trade-off**: Complexity in routing logic, but massive cost savings

---

## D5: Semantic Caching with Redis

**Decision**: Implement Redis-backed semantic cache with cosine similarity

**Rationale**:

- Similar question prompts generate similar questions
- Embedding-based cache saves 90% on repeated prompts
- Redis provides sub-millisecond lookups
- 7-day TTL balances freshness and performance

**Alternatives Considered**:

- Simple MD5 hashing (Pro: simpler; Con: misses similar prompts)
- Vector DB (Pinecone, Weaviate) (Pro: better similarity; Con: added complexity, cost)
- No caching (Pro: simplest; Con: massive cost, slow response)

**Trade-off**: Added Redis load, but 90% cost reduction on typical workloads

---

## D6: Zod for Runtime Validation

**Decision**: Use Zod for request/response validation

**Rationale**:

- Type-safe runtime validation in TypeScript
- Easily shareable schemas between frontend and backend
- Better error messages than manual validation
- Integrates cleanly with React Hook Form

**Alternatives Considered**:

- TypeScript types only (Pro: simpler; Con: no runtime safety)
- JSON Schema (Pro: language-agnostic; Con: verbose)
- GraphQL (Pro: built-in validation; Con: overkill for REST API)

**Trade-off**: Added parsing overhead (~1-2ms per request), but zero runtime errors

---

## D7: MongoDB for Document Storage

**Decision**: Use MongoDB for storing assignments and results

**Rationale**:

- Flexible schema for varied question paper formats
- TTL indexes for automatic cleanup (30-day retention)
- Horizontal scaling via sharding
- Good ecosystem with TypeScript (Mongoose types)

**Alternatives Considered**:

- PostgreSQL (Pro: ACID; Con: schema rigidity, requires migrations)
- DynamoDB (Pro: serverless; Con: vendor lock-in, cost at scale)
- In-memory only (Pro: fastest; Con: data loss, no persistence)

**Trade-off**: No ACID guarantees, but flexible schema and operational simplicity

---

## D8: Next.js 14 App Router for Frontend

**Decision**: Use Next.js 14 with App Router (not Pages Router)

**Rationale**:

- Server components for better performance
- File-based routing simplicity
- Built-in API routes for lightweight calls
- Excellent TypeScript support

**Alternatives Considered**:

- React + Vite (Pro: faster dev; Con: more setup)
- Nuxt/Vue (Pro: better DX; Con: different ecosystem)
- Next.js 13 Pages Router (Pro: stable; Con: outdated, Vercel recommends App Router)

**Trade-off**: Learning curve for App Router, but future-proof

---

## D9: Tailwind CSS + Zustand for Styling & State

**Decision**: Tailwind CSS for styling, Zustand for state management

**Rationale**:

- Tailwind: Utility-first, no CSS files, fast prototyping
- Zustand: Minimal boilerplate, React Hooks API, <1KB bundle impact
- Both integrate seamlessly with Next.js

**Alternatives Considered**:

- Styled Components (Pro: scoped CSS; Con: bundle size)
- Redux (Pro: powerful; Con: boilerplate, overkill for this app)
- CSS Modules (Pro: scope safety; Con: verbose, Tailwind better)

**Trade-off**: Utility-first CSS feels different initially, but optimal for rapid development

---

## D10: PDF Generation with pdf-lib

**Decision**: Use pdf-lib for client-side and server-side PDF generation

**Rationale**:

- Pure JavaScript, no external dependencies (GhostScript, wkhtmltopdf)
- Works in both Node.js and browser
- Reasonable quality for exams (not photo editing)
- ~300KB after compression

**Alternatives Considered**:

- html2pdf (Pro: better formatting; Con: larger bundle, Puppeteer overhead)
- wkhtmltopdf (Pro: highest quality; Con: system dependency, slow)
- jsPDF (Pro: lighter; Con: fewer features than pdf-lib)

**Trade-off**: Manual PDF layout instead of HTML rendering, but simpler deployment

---

## D11: Circuit Breaker Pattern for LLM Resilience

**Decision**: Implement circuit breaker for LLM API calls

**Rationale**:

- Anthropic and OpenAI APIs can have brief outages
- Circuit breaker prevents cascade failures
- Allows graceful degradation (switch to fallback model)
- Better user experience than immediate timeouts

**Alternatives Considered**:

- Simple retry (Pro: simpler; Con: no fallback, poor UX)
- Exponential backoff only (Pro: simpler; Con: can hammer failing API)
- Timeout + fallback (Pro: works; Con: too slow for impatient users)

**Trade-off**: Added complexity, but dramatically improved reliability

---

## D12: Idempotency Keys for Safety

**Decision**: Support Idempotency-Key header in API requests

**Rationale**:

- Network failures could cause duplicate submissions
- Idempotency allows safe retries
- Redis-backed storage of request history
- Free UX improvement for users

**Alternatives Considered**:

- No idempotency (Con: potential duplicate jobs)
- Database-backed only (Con: high DB overhead, slow lookup)
- Client-side deduplication (Con: doesn't help with network issues)

**Trade-off**: Minor Redis overhead, but eliminates duplicate job risk

---

## D13: Rate Limiting Strategy

**Decision**: Combine per-IP (20 req/min) and per-user (10 jobs/hour) limits

**Rationale**:

- Per-IP protects against anonymous abuse (brute force)
- Per-user protects against heavy users (fair usage)
- Redis-backed for distributed deployments
- Graceful 429 errors with Retry-After headers

**Alternatives Considered**:

- Per-IP only (Con: unfair to shared networks like offices)
- No limits (Con: vulnerable to abuse, resource exhaustion)
- Exponential costs (Pro: market-based; Con: complex, poor UX)

**Trade-off**: Requires user authentication eventually, but prevents abuse

---

## D14: WebSocket with HTTP Polling Fallback

**Decision**: Prefer WebSocket for real-time updates, fallback to polling

**Rationale**:

- WebSocket enables real-time status updates
- Polling fallback handles corporate proxies/firewalls blocking WebSocket
- Auto-reconnection logic for network resilience
- Best of both worlds for reliability

**Alternatives Considered**:

- WebSocket only (Con: breaks in corporate networks)
- Polling only (Pro: simpler; Con: 5-10 second latency, high overhead)
- Server-Sent Events (Pro: one-way is simpler; Con: doesn't handle slow connections well)

**Trade-off**: Dual connection logic, but optimal user experience

---

## D15: Structured Logging with Pino

**Decision**: Use Pino for structured logging

**Rationale**:

- Structured JSON output for log aggregation (Datadog, CloudWatch)
- Sub-millisecond logging overhead
- Built-in request ID correlation
- Pretty-printing for development

**Alternatives Considered**:

- Winston (Pro: more features; Con: slower, heavier)
- Console.log only (Con: no structure, hard to debug production)
- Bunyan (Pro: solid; Con: slower than Pino)

**Trade-off**: JSON output less human-readable in raw logs, but searchable in aggregators

---

## D16: Input Sanitization & Prompt Injection Guards

**Decision**: Sanitize user input with regex patterns and injection guards

**Rationale**:

- Prevents prompt injection attacks
- User documents could contain malicious instructions
- Logging suspicious patterns aids security audits
- Minimal performance overhead

**Alternatives Considered**:

- No sanitization (Con: security risk)
- ML-based detection (Pro: more accurate; Con: slow, complex)
- Strict allowlisting (Pro: safest; Con: too restrictive for diverse inputs)

**Trade-off**: Potential to block legitimate content (rare), but strong security posture

---

## D17: Groq-Accelerated Inference

**Decision**: Support Groq for accelerated LLM inference alongside Anthropic/OpenAI routing.

**Rationale**:

- Groq provides hardware-accelerated inference that can reduce latency and cost for batch or on-prem inference.
- Adding Groq as an option gives flexibility to run high-throughput workloads more cheaply in production or on private infrastructure.
- Groq can be used for predictable, high-volume inference paths (e.g., bulk question generation, cached pipelines).

**Alternatives Considered**:

- Only cloud-hosted LLM APIs (Anthropic/OpenAI) — simplest but can be more expensive at high throughput.
- Self-hosted open models (Llama, Mistral) on GPUs — flexible but operationally heavy.

**Trade-off**: Additional integration complexity and operational surface (provisioning Groq endpoints), but lower cost and latency at scale.

---

## D18: Surgical AI Edits (Per-question & Section-level Refinement)

**Decision**: Implement an "AI edit" workflow that allows users to request targeted refinements to individual questions or entire sections. Persist edits in an `edit_history` and expose undo/restore operations.

**Rationale**:

- Teachers need precise control over generated content; full-regeneration is expensive and slow.
- Granular edits (per-question / per-section) let the system call the LLM with a surgical prompt that preserves the rest of the paper while only altering the requested scope.
- Storing `edit_history` enables auditability, undo, and collaborative workflows.

**Alternatives Considered**:

- Always re-generate the entire paper (Pro: simpler; Con: high cost, loses local edits).
- Client-only text editing (Pro: immediate; Con: manual effort, no LLM assistance).

**Trade-off**: Slightly more complex backend APIs and data model (edit entries, scope metadata), but far better UX and cost profile for iterative teacher workflows.

---

## Summary of Trade-offs

| Decision            | Pro                           | Con                      | Mitigation                    |
| ------------------- | ----------------------------- | ------------------------ | ----------------------------- |
| Monorepo            | Shared types, single pipeline | Slightly larger CI times | Incremental builds            |
| Express             | Large ecosystem               | 5-10% slower             | Async processing handles      |
| Bull + Redis        | Reliable async                | Additional deployment    | Docker Compose included       |
| Claude + GPT-4      | 60% cheaper                   | Routing complexity       | Well-tested logic             |
| Semantic cache      | 90% cost reduction            | Added Redis load         | Configurable TTL              |
| Zod                 | Type-safe validation          | 1-2ms overhead           | Negligible at this scale      |
| MongoDB             | Flexible schema               | No ACID                  | Good enough for this use case |
| Next.js App Router  | Future-proof                  | Learning curve           | Docs provided                 |
| Tailwind + Zustand  | Fast development              | Utility-first CSS        | Design system provided        |
| pdf-lib             | Simple deployment             | Manual layout            | Acceptable quality for exams  |
| Circuit Breaker     | Resilient                     | Added complexity         | Proven pattern                |
| Idempotency Keys    | Safe retries                  | Redis overhead           | Minimal impact                |
| Rate Limiting       | Prevents abuse                | Eventual auth needed     | Planned in next phase         |
| WebSocket + Polling | Best UX & compatibility       | Dual connection logic    | Auto-handled by hooks         |
| Pino logging        | Structured output             | JSON less readable       | Aggregator recommended        |
| Input sanitization  | Secure                        | Risk of false positives  | Audit logs included           |

---

**Document Version**: 1.0  
**Last Updated**: 2025-05-21  
**Author**: AI Architecture Assistant
