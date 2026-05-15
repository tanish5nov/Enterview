# Enterview

An AI-powered mock interview platform that conducts real technical interviews — not a linear chatbot. It builds a conversation tree as you answer, follows up on weak spots, and generates a scored report at the end.

Runs entirely on your local machine. No API keys, no cloud costs.

---

## Features

- **10 interview subjects** — DSA, OS, DBMS, CN, OOPs, OOD, System Design, Tech Stack, Resume Cross Questions, Resume Roasting
- **Conversation tree engine** — the interviewer tracks topics, depth, and coverage rather than following a fixed script
- **In-browser C++ IDE** — Monaco editor with compile + run (g++ with a 5-second execution limit)
- **Resume upload** — PDF or text; heuristic extraction of name, skills, and projects
- **Resume Roast mode** — LLM reads your resume and delivers a brutally honest critique
- **Post-interview report** — overall score, strengths, areas to improve, per-topic scores, verdict, and hire recommendation
- **Interview history** — all past sessions stored in MongoDB, viewable any time
- **Text-to-speech** — interviewer questions read aloud via the browser's Web Speech API

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                      │
│  ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│  │  Frontend   │   │   Backend   │  │  MongoDB   │  │
│  │  React/Vite │──▶│  Node/Express│ │  (mongo:7) │  │
│  │  :5173      │   │  :8080      │──▶  :27017    │  │
│  └─────────────┘   └──────┬──────┘  └────────────┘  │
│                           │                          │
└───────────────────────────┼──────────────────────────┘
                            │ host.docker.internal:11434
                            ▼
                   ┌─────────────────┐
                   │  Ollama (native)│
                   │  qwen2.5:0.5b   │
                   │  Apple Silicon  │
                   └─────────────────┘
```

**Why Ollama runs outside Docker:** Docker on macOS runs inside a Linux VM. Running the LLM natively on the host uses Apple Metal/MLX and gets ~230 tokens/second vs ~0.4 tokens/second inside Docker.

### Key components

| Path | Role |
|------|------|
| `server/src/engine/orchestrator.js` | LLM call orchestration, session state machine |
| `server/src/engine/prompts.js` | All prompt templates and builders |
| `server/src/engine/tree.js` | Conversation tree — nodes, context, topic tracking |
| `server/src/llm/index.js` | Ollama client with retry, timeout, structured output |
| `server/src/ws/` | WebSocket server and event handlers |
| `server/src/routes/` | REST endpoints (session, upload, code, history, roast) |
| `client/src/ws.js` | WebSocket client with auto-reconnect |
| `client/src/screens/` | React screens (Home, Setup, Interview, Report, History) |

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs frontend, backend, MongoDB |
| [Homebrew](https://brew.sh) | Latest | Used to install Ollama |
| Ollama | Installed below | Runs the LLM natively on the host |

> **Apple Silicon recommended.** The setup is optimised for M1/M2/M3/M4/M5 Macs using Metal GPU acceleration. Intel Macs will work but LLM responses will be slower.

---

## Setup

### 1. Install Ollama

```bash
brew install ollama
```

### 2. Start Ollama and pull the model

```bash
brew services start ollama
ollama pull qwen2.5:0.5b
```

This starts Ollama as a background service (auto-starts on login) and downloads the ~400 MB model. Verify it's running:

```bash
curl http://localhost:11434/api/tags
```

You should see `qwen2.5:0.5b` in the models list.

### 3. Clone the repo

```bash
git clone https://github.com/tanish5nov/Enterview.git
cd Enterview
```

### 4. Start the Docker stack

```bash
docker compose up --build
```

This builds and starts three containers:

| Container | Port | Notes |
|-----------|------|-------|
| `frontend` | 5173 | React + Vite dev server |
| `backend` | 8080 | Express + WebSocket |
| `mongodb` | 27017 | Persistent interview history |

First build takes ~2 minutes (installs npm dependencies). Subsequent starts are instant.

### 5. Open the app

```
http://localhost:5173
```

---

## Environment variables

The backend reads from Docker Compose environment (no `.env` file needed for Docker). For local development without Docker, create `server/.env`:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/enterview
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

---

## Running without Docker (local dev)

### Backend

```bash
cd server
npm install
npm run dev        # uses nodemon with --legacy-watch
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Make sure MongoDB is running locally (`mongod`) and Ollama is running (`brew services start ollama`).

---

## How an interview works

1. **Upload resume** (optional) — PDF or plain text; parsed instantly with no LLM call
2. **Choose subject** — DSA, OS, System Design, etc., or Resume Roasting
3. **Session starts** — backend generates an opening question via Ollama
4. **You answer** — type in the chat panel; optionally include code from the IDE
5. **Conversation tree** — the LLM decides whether to follow up, probe a weakness, or move to a new topic
6. **End session** — click End or the interviewer wraps up after 10-15 turns
7. **Report** — overall score, per-topic breakdown, strengths, areas to improve, and a hire/no-hire recommendation

### WebSocket events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `session:start` | `{}` |
| Client → Server | `answer:submit` | `{ answer, includeCode, code, codeOutput }` |
| Client → Server | `session:end` | `{}` |
| Server → Client | `question:complete` | `{ question }` |
| Server → Client | `report:ready` | `{ report }` |
| Server → Client | `session:error` | `{ message }` |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/session/create` | Create session, returns `sessionId` |
| `POST` | `/upload/resume` | Upload PDF/text resume |
| `POST` | `/upload/jd` | Upload job description |
| `POST` | `/code/run` | Compile and run C++ (5s limit, max 10 runs/session) |
| `POST` | `/roast` | Trigger resume roast for a session |
| `GET` | `/history` | List all past sessions |
| `GET` | `/health` | Server + Ollama health check |

---

## Interview subjects

| Subject | What it covers |
|---------|---------------|
| DSA | Arrays, trees, graphs, DP, sorting, hashing |
| OS | Processes, scheduling, memory, file systems, deadlocks |
| DBMS | SQL, normalization, ACID, indexing, NoSQL |
| CN | OSI model, HTTP, TCP/UDP, DNS, TLS |
| OOPs | Classes, inheritance, polymorphism, SOLID |
| OOD | Requirements analysis, class diagrams, design problems |
| System Design | Scalability, caching, databases, message queues, microservices |
| Tech Stack | Your languages, frameworks, architecture decisions |
| Resume Cross Questions | Deep dives on your projects and experience |
| Resume Roasting | LLM critique of your resume: weaknesses, ATS issues, suggestions |

---

## Project structure

```
Enterview/
├── docker-compose.yml
├── docker/
│   └── ollama-entrypoint.sh      # (unused — Ollama runs on host)
├── client/
│   ├── Dockerfile.dev
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Screen router
│       ├── ws.js                  # WebSocket client
│       ├── tts.js                 # Text-to-speech
│       ├── api.js                 # REST helpers
│       └── screens/
│           ├── HomeScreen.jsx
│           ├── SetupScreen.jsx    # Resume upload + subject picker
│           ├── InterviewScreen.jsx # Chat panel + C++ IDE
│           ├── ReportScreen.jsx
│           └── HistoryScreen.jsx
└── server/
    ├── Dockerfile.dev
    ├── package.json
    └── src/
        ├── index.js               # Express app entry point
        ├── config.js              # Env var loader
        ├── constants.js           # Subjects and topic lists
        ├── session-store.js       # In-memory session state
        ├── engine/
        │   ├── orchestrator.js    # generateFirstQuestion, processTurn, generateReport
        │   ├── prompts.js         # All LLM prompt templates
        │   ├── tree.js            # Conversation tree data structure
        │   ├── sanitize.js        # Input sanitization
        │   └── schemas.js         # Zod schemas for tree nodes
        ├── llm/
        │   ├── index.js           # chat(), chatStructured(), checkOllama()
        │   └── validate.js        # JSON extraction + Zod validation
        ├── models/
        │   ├── Session.js         # Mongoose model
        │   └── Turn.js
        ├── routes/
        │   ├── session.js
        │   ├── upload.js
        │   ├── code.js
        │   ├── history.js
        │   └── roast.js
        └── ws/
            ├── index.js           # WebSocket server setup
            └── events.js          # Event name constants
```

---

## Troubleshooting

**"Ollama ready" never appears in backend logs**

Check Ollama is running on the host:
```bash
curl http://localhost:11434/api/tags
```
If it's not running: `brew services start ollama`

**"Interviewer thinking..." never resolves**

- Confirm Ollama is running natively (not inside Docker)
- Check backend logs: `docker logs enterview-backend-1`
- The first inference call loads the model (~2s); subsequent calls are near-instant

**File changes not hot-reloading**

Both servers use polling-based watch because Docker on macOS doesn't propagate inotify events:
- Backend: `nodemon --legacy-watch` (polls every 1s)
- Frontend: `vite --watch usePolling: true` (polls every 500ms)

Changes should reflect within 1-2 seconds.

**Port already in use**

```bash
docker compose down
docker compose up --build
```

**MongoDB data persists across restarts** in a Docker volume (`mongo_data`). To wipe it:
```bash
docker compose down -v
```

---

## Tech stack

**Frontend:** React 18, Vite, Monaco Editor (`@monaco-editor/react`), Web Speech API

**Backend:** Node.js 20, Express 4, `ws` (WebSocket), Mongoose 8, Zod, Multer, pdf-parse, uuid

**Database:** MongoDB 7

**LLM:** Ollama (native), qwen2.5:0.5b (GGUF Q4_K_M, ~400 MB)

**Infrastructure:** Docker Compose (frontend + backend + MongoDB), Ollama via Homebrew
