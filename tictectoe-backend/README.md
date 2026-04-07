# TicTecToe Backend

Backend API for the TicTecToe research paper platform.

This service powers:
- Authentication and profile management
- Personalized paper ranking and recommendations
- Social features (follow, likes, comments, bookmarks)
- Paper ingestion from arXiv
- AI-powered chat and paper section summarization
- Text-to-speech (TTS) generation and transcript delivery
- Chat and note persistence per paper and user
- Weekly popular papers newsletter

## Tech Stack

- Runtime: Node.js + Express
- Data platform: Supabase (Postgres + Storage)
- Auth tokens: JWT
- AI providers/models:
	- Google Gemini (`gemini-2.5-flash`) for chat and section summarization
	- Xenova Transformers (`all-MiniLM-L6-v2`) for embeddings
	- Google Cloud TTS API for section audio generation
- Background/scheduled tasks: `node-cron`
- Python helpers:
	- PDF to text/LaTeX fallback utilities
	- Local TTS utility (`pyttsx3`) in legacy flow
- Tests: Jest + Supertest

## High-Level Architecture

The backend follows a route-controller pattern with Supabase as the single data backend.

1. `app.js` initializes middleware, mounts route modules, and exposes health + PDF proxy endpoints.
2. `routes/*` defines endpoint surfaces by domain.
3. `controllers/*` implements business logic, integration logic, ranking, and persistence.
4. `middleware/authenticate.js` validates Bearer JWT tokens and enriches `req.user`.
5. Supabase tables store app data; Supabase Storage stores generated audio segments.
6. Cron jobs in `paperController.js` handle periodic ingestion and newsletter sends.

## Folder Guide

This section is a detailed map of what each backend folder/file does.

### Root-Level Runtime and Config Files

- `app.js`
	- Express bootstrap and middleware registration (`cors`, JSON parsing, body parser).
	- Route mounting for all API domains (`/auth`, `/api/profile`, `/api/paper`, `/api/chatbot`, etc.).
	- Public health endpoint (`GET /health`).
	- arXiv PDF proxy endpoint (`GET /api/arxiv-pdf/:id`) that streams a fetched PDF.
	- Global error middleware.
	- Server start/listen logic and app export for tests.
- `package.json`
	- Runtime/development dependencies.
	- Primary scripts: `dev`, `test`, `lint`, `build`.
- `.env` (not committed)
	- All service credentials and runtime secrets (Supabase, JWT, Gemini, SendGrid, ORCID, TTS).
- `eslint.config.cjs`
	- Linting configuration for code quality checks.
- `.gitignore`
	- Excludes local artifacts, credentials, and generated files.

### `controllers/` (Domain Logic Layer)

- `authController.js`
	- Institutional email validation + normalization.
	- Signup flow with OTP creation and email delivery.
	- Verified/unverified account branching behavior.
	- Login + JWT token generation.
	- Password reset flow (`request-reset`, `verify-reset-otp`, `set-new-password`).
	- Profile retrieval from JWT.
	- Periodic cleanup for stale unverified users.
- `paperController.js` (largest controller; multi-domain)
	- arXiv ingestion (fetch/parse/feed insert).
	- Embedding generation (`Xenova/all-MiniLM-L6-v2`) for papers and user interests.
	- Personalized ranking and explore recommendation scoring (similarity + engagement + freshness).
	- Social interactions: likes, bookmarks, comments, counts, status checks.
	- Audio generation pipeline:
		- text/LaTeX extraction
		- section summarization via Gemini
		- TTS audio synthesis via Google Cloud TTS
		- segment storage/upload into Supabase bucket
	- Transcript cleanup and title normalization for malformed sections.
	- Click tracking and popularity listings.
	- Scheduled tasks via `node-cron`:
		- periodic arXiv fetch
		- weekly popular-paper newsletter sending
- `profileController.js`
	- Profile updates (username/name/email/bio).
	- Interest updates + embedding refresh trigger.
	- ORCID OAuth callback/token exchange.
	- ORCID publication fetch.
	- Authorship claim/check against ORCID publication metadata.
- `conversationController.js`
	- Chat persistence in `chat_history`.
	- Per-paper chat retrieval, per-user conversation retrieval, global recent history retrieval.
	- Insert full Q/A exchanges and delete paper chat history.
- `noteController.js`
	- Note persistence in `note_history`.
	- Per-paper, per-user, and paper+user note retrieval patterns.
	- Create and delete note history entries.
- `followController.js`
	- Follow/unfollow operations.
	- Follow-state checks.
	- Followers and following list retrieval (with user lookups).
	- User detail retrieval helper used by user routes.
- `searchController.js`
	- User search endpoint with pagination using username/email fuzzy match.
- `utilitiesController.js`
	- Utility table interest update helper.
	- Category fetch helper.
	- PDF text extraction helper (`axios` + `pdf-parse`).

### `routes/` (HTTP API Surface)

- `authRoutes.js`
	- Authentication and account lifecycle endpoints.
- `profileRoutes.js`
	- Profile updates, interests, recommendations, bookmarks/likes/comments views, ORCID flows.
- `paperRoutes.js`
	- Paper social endpoints, search, click counts, audio endpoints, transcript endpoint, embedding maintenance endpoint.
- `chatbot.js`
	- Gemini chat endpoint with retry handling for transient overload errors.
- `conversationRoutes.js`
	- Chat history CRUD-like endpoints per paper/user.
- `noteRoutes.js`
	- Note history CRUD-like endpoints per paper/user.
- `followRoutes.js`
	- Follow graph endpoints and relationship checks.
- `userRoutes.js`
	- User lookup by id and user search endpoints.
- `utilitiesRoutes.js`
	- Utility/admin-style routes for categories, interest updates, and PDF text extraction.

### `middleware/`

- `authenticate.js`
	- Bearer token extraction and JWT verification.
	- Populates `req.user.id` for protected handlers.
	- Rejects missing, malformed, invalid, or expired tokens.

### `tests/` (Jest + Supertest)

- `app.test.js`: app bootstrap + health + error-path behavior.
- `authController.test.js`: signup/login/OTP/reset flows.
- `authenticationMiddleware.test.js`: JWT middleware behavior.
- `conversationController.test.js`: chat persistence/retrieval behaviors.
- `followController.test.js`: follow graph behavior.
- `paperController.test.js`: paper/social/recommendation/audio-related behavior.
- `profileController.test.js`: profile and ORCID-related behavior.
- `routes.test.js`: route registration/wiring verification.
- `searchController.test.js`: user search behavior.
- `utilitiesController.test.js`: utility endpoint behavior.

### `scripts/` (Operational One-Off Tasks)

- `generateProcessedJson.js`
	- CLI utility to generate/store `processed_papers_json` for a DOI.
- `ensureLatexContentForPaper.js`
	- CLI utility to ensure `latex_content` exists for a DOI (source tarball first, PDF text fallback).

### `sql/`

- `chat_persistence_schema.sql`
	- Alternative/extended conversation schema (`conversations`, `conversation_messages`).
	- Includes indexes and row-level-security policies.

### Python and Native Tooling Folders

- `python-scripts/`
	- `tts_pyttsx.py`: local/offline TTS fallback utility that converts text files to audio.
- `pdftolatex/`
	- Embedded Python package and wrappers used to convert PDFs to LaTeX/text when arXiv source extraction is unavailable.
- `ffmpeg/`
	- Bundled ffmpeg binaries and docs used for post-TTS audio segmentation.

### Debug and Ops Helpers

- `test-weekly-popular-newsletter.js`
	- Manual script to validate newsletter prerequisites and trigger weekly popular newsletter flow.

### How the Folders Work Together

1. `app.js` receives requests and dispatches to `routes/*`.
2. `routes/*` applies auth middleware where needed and forwards to `controllers/*`.
3. `controllers/*` execute business logic against Supabase tables/storage and external APIs.
4. Heavy content generation paths may invoke Python tools (`python-scripts/`, `pdftolatex/`) and ffmpeg segmentation (`ffmpeg/`).
5. Scheduled jobs inside controller logic run automated ingestion and newsletter workflows.
6. `tests/*` validate API behavior; `scripts/*` support maintenance and data repair operations.

## Request Lifecycle

1. Client calls API route.
2. If protected, `authenticate` validates JWT and sets `req.user.id`.
3. Controller executes domain logic and reads/writes Supabase.
4. For AI/audio operations, controller also calls Gemini/TTS/Python/ffmpeg integrations.
5. API returns JSON payloads with either data or error messages.

## Current API Surface

Base URL defaults to `http://localhost:3001`.

### Health and Utility Core

- `GET /health`: service health status.
- `GET /api/arxiv-pdf/:id`: proxy fetch for arXiv PDFs.

### Auth (`/auth`)

- `POST /signup`
- `POST /verify-otp`
- `POST /login`
- `POST /request-reset-password`
- `POST /verify-reset-otp`
- `POST /set-new-password`
- `GET /user-profile`
- `GET /check-email`

Highlights:
- Institution-domain email validation (`ALLOWED_EMAIL_DOMAINS`).
- OTP resend behavior for unverified users (signup/login paths).
- Periodic cleanup of stale unverified users.

### Profile (`/api/profile`)

- `PUT /update-profile` (auth)
- `PUT /update-interests` (auth)
- `GET /bookmarks` (auth)
- `GET /recommendations` (auth)
- `GET /explore-recommendations` (auth)
- `GET /likes` (auth)
- `GET /comments` (auth)
- `GET /interests` (auth)
- `GET /categories`
- `GET /auth/orcid/callback`
- `GET /auth/orcid/publications`
- `POST /auth/orcid/claim` (auth)
- `GET /auth/orcid/check` (auth)

Highlights:
- ORCID OAuth callback + publication fetch.
- ORCID-based authorship claim/check against paper metadata.
- Interest updates trigger embedding regeneration.

### Papers (`/api/paper`)

- Social actions:
	- `POST /like` (auth)
	- `POST /unlike` (auth)
	- `POST /comment` (auth)
	- `POST /bookmark` (auth)
	- `POST /unbookmark` (auth)
- Status and metrics:
	- `GET /:id/like-count`
	- `GET /:id/bookmark-count`
	- `GET /:id/comment-count`
	- `GET /:id/comments`
	- `GET /:id/like-status` (auth)
	- `GET /:id/bookmark-status` (auth)
- Retrieval and ranking:
	- `GET /papers` (auth)
	- `GET /paper/:id`
	- `POST /search` (auth)
	- `GET /papers-by-click-count`
	- `GET /papers-by-click-count-limit`
	- `POST /increment-click` (auth)
- Audio/TTS:
	- `POST /audio`
	- `GET /audio-status/:doi`
	- `GET /streamAudioSegment/:doi/:segmentIndex`
	- `GET /tts-transcript/:doi`
- Maintenance/ops:
	- `POST /generate-missing-embeddings`

Highlights:
- Personalized recommendations use weighted scoring:
	- embedding similarity
	- click signal
	- like signal
	- bookmark signal
	- freshness decay
- Explore recommendations support pagination (`offset`, `limit`).
- Robust transcript cleanup removes malformed section names and maps section titles from LaTeX/plain text.
- Category codes are mapped to human-readable labels.

### Chatbot (`/api/chatbot`)

- `POST /`

Highlights:
- Gemini context-aware Q&A.
- Overload retry handling for transient 503/service overload cases.

### Conversations (`/api/conversations`)

- `GET /paper/:paperId`
- `GET /user/:userId`
- `POST /save-exchange`
- `GET /all`
- `GET /sample-papers`
- `DELETE /paper/:paperId`

### Notes (`/api/notes`)

- `GET /paper/:paperId`
- `GET /user/:userId`
- `GET /paper/:paperId/user/:userId`
- `POST /save-note`
- `GET /all`
- `GET /sample-papers`
- `DELETE /paper/:paperId`

### Follow (`/api/follow`)

- `POST /follow` (auth)
- `DELETE /unfollow` (auth)
- `GET /check-following/:userId` (auth)
- `GET /followers/:userId`
- `GET /following/:userId`

### User Search (`/api`)

- `GET /users/:id`
- `GET /search-users`

### Utilities (`/utilities`)

- `POST /updateAvailableInterest`
- `GET /getCategories`
- `POST /extract-pdf-text`

## Data Model (Observed)

Main Supabase tables used by controllers:

- `users`
- `paper`
- `likes`
- `bookmarks`
- `comments`
- `follows`
- `chat_history`
- `note_history`
- `category`
- `utilities`

Storage bucket:
- `audios` (audio segments under `audio_segments/<doi>/...`)

Additional schema helper:
- `sql/chat_persistence_schema.sql` includes an alternative/extended conversation model (`conversations`, `conversation_messages`) with RLS policies.

## Background Jobs and Automation

Defined in `paperController.js`:

- Weekly arXiv ingestion cron:
	- Schedule: `0 9 * * 0` (Sunday 09:00)
	- Fetches latest arXiv items, inserts/upserts papers, attempts content enrichment.
- Weekly newsletter cron:
	- Schedule: `0 9 * * 0` (Sunday 09:00)
	- Sends top-clicked papers to subscribed users.

Operational note:
- Both jobs currently use the same cron expression and run on server local time.

## Environment Variables

Create a `.env` in `tictectoe-backend/` with values for:

- `PORT`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY` (Google Cloud Text-to-Speech)
- `SENDGRID_API_KEY`
- `ORCID_CLIENT_ID`
- `ORCID_CLIENT_SECRET`
- `ORCID_REDIRECT_URI`
- `ALLOWED_EMAIL_DOMAINS` (comma-separated; defaults to `dal.ca,dalhousie.ca`)

## Setup and Run

### Prerequisites

- Node.js 18+
- npm
- Python 3 (for helper scripts)
- ffmpeg binary available at `ffmpeg/bin/ffmpeg.exe` (already bundled in this repo)
- Supabase project and required tables/buckets

### Install

```bash
npm install
```

### Start (development)

```bash
npm run dev
```

### Start (node)

```bash
node app.js
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm test
```

## Operations Scripts

- Generate processed section JSON for one DOI:

```bash
node scripts/generateProcessedJson.js <doi>
```

- Ensure `latex_content` exists for one DOI:

```bash
node scripts/ensureLatexContentForPaper.js <doi>
```

- Debug weekly newsletter flow:

```bash
node test-weekly-popular-newsletter.js
```

## Testing Coverage (Current)

`tests/` currently includes suites for:
- app bootstrap/middleware behavior
- auth controller
- authentication middleware
- conversation controller
- follow controller
- paper controller
- profile controller
- route wiring and integration behavior
- search controller
- utilities controller

## Latest Features Reflected in This Backend

- Email availability flow now distinguishes verified vs unverified accounts.
- OTP resend for unverified login/sign-up continuation path.
- Recommendation ranking combines semantic similarity with engagement and freshness weighting.
- Explore recommendations support offset/limit pagination.
- Transcript endpoint cleans malformed section artifacts and resolves human-friendly titles.
- Background/async section-wise audio generation with progress polling (`/audio-status/:doi`).
- ORCID publication linking and authorship claim/check endpoints.
- Weekly top-popular newsletter for subscribed users.

## Known Implementation Notes for Future Teams

- `app.js` logs API key presence to console at startup; remove sensitive logging in production.
- A static placeholder IP string is used in startup logs; prefer dynamic host logging.
- In `package.json`, some runtime libs are in `devDependencies` and vice versa; consider normalizing dependency groups.
- `paperController.js` is very large and contains multiple domains (ingestion, ranking, audio, newsletters, transcript); splitting into domain services will improve maintainability.
- Two different conversation persistence models exist (`chat_history` in controller logic and `conversations/conversation_messages` in SQL helper). Align on one model long-term.

## Suggested Next Refactors

1. Extract `paperController.js` into modules:
	 - ingestion
	 - recommendation
	 - engagement
	 - audio/tts
	 - newsletter
	 - transcript
2. Introduce centralized config validation on startup (fail fast for missing env vars).
3. Add OpenAPI/Swagger spec for route contracts.
4. Add migration/versioned schema docs and a seeded local dev dataset.
5. Add queue-based worker for TTS generation to decouple long-running jobs from request handlers.
