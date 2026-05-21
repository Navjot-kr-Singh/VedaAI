<div align="center">
  <img src="https://img.shields.io/badge/VedaAI-Assessment_Platform-6366f1?style=for-the-badge&logo=openai" alt="VedaAI Logo" />
  <br />
  <p>
    <strong>A production-grade, AI-powered assessment generation tool for modern educators.</strong>
  </p>
</div>

---

## ✨ Features

VedaAI is designed to streamline the assessment creation process using advanced AI. By simply providing a topic or uploading study material, VedaAI orchestrates a robust generation pipeline to deliver print-ready question papers.

- **🤖 Google Gemini Integration**: Leverages `gemini-2.5-flash` for high-speed, highly structured reasoning and multiple-choice generation.
- **📄 Document Processing**: Upload PDF or TXT reference materials. The backend automatically extracts and synthesizes the content.
- **🛡️ Ironclad Validation**: Uses `Zod` schemas and a discriminated union architecture to guarantee the AI outputs strict JSON structures (e.g. enforcing 4 options for MCQs).
- **🔁 Autonomous Self-Correction**: The AI service automatically catches validation failures and prompts the LLM to correct its own schema formatting, retrying up to 3 times before failing gracefully.
- **⚡ Asynchronous Queue Processing**: Powered by `BullMQ` and `Redis`. Heavy generation tasks run in background workers, preventing API timeouts and ensuring UI responsiveness.
- **📡 Real-Time WebSockets**: Live progress tracking via `Socket.IO`. Watch as the backend parses documents, queries the AI, and formats the PDF in real-time.
- **🖨️ High-Fidelity PDF Export**: Uses `pdf-lib` to generate beautifully formatted, student-ready, printable exam papers instantly.
- **UI/UX**: Stunning `Next.js 14` App Router frontend with glassmorphism design, built with `Tailwind CSS`, `Zustand`, and `Lucide React`.

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14, Zustand, Tailwind CSS, Lucide React, Axios, React Hook Form |
| **Backend** | Node.js, Express, TypeScript, Zod, Socket.IO, pdf-lib, pdf-parse, Winston |
| **AI Layer** | `@google/generative-ai` (Gemini SDK), Prompt Engineering |
| **Data & Queue** | MongoDB (Mongoose), Redis, BullMQ |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
*   [MongoDB](https://www.mongodb.com/) (Running locally or hosted)
*   [Redis](https://redis.io/) (Running locally or hosted)

---

## ⚙️ Environment Variables

### Backend Configuration
Create a `.env` file inside the `backend/` directory:
```env
PORT=4001
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend Configuration
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4001
```

---

## 🚀 Running the Project

### 1. Installation
Install dependencies in both directories:
```bash
# Backend dependencies
npm install --prefix backend

# Frontend dependencies
npm install --prefix frontend
```

### 2. Databases & Broker (Local)
Start your MongoDB and Redis servers:
```bash
# Start MongoDB (if using Brew on macOS)
brew services start mongodb-community

# Start Redis (if using Brew on macOS)
brew services start redis
```

### 3. Run Development Servers
Start both servers concurrently or in separate terminal tabs:

#### Start Backend Service
```bash
npm run dev --prefix backend
```
*Runs on port **4001**.*

#### Start Frontend Service
```bash
npm run dev --prefix frontend
```
*Runs on port **3000**.*

---

## 📁 Project Architecture

```
VedaAI/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Logger, Redis configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── listeners/       # Event-based database & websocket broadcasters
│   │   ├── middlewares/     # Rate limiter and Zod validator middlewares
│   │   ├── models/          # MongoDB Assignment schema
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/
│   │   │   ├── ai/          # Gemini Provider, Zod Validators, Retry Loops, Parsers
│   │   │   ├── chunking.ts  # Text chunker & summarizer
│   │   │   └── pdf.ts       # pdf-lib layout formatter
│   │   ├── sockets/         # Socket.IO Gateway configuration
│   │   └── workers/         # BullMQ queue consumer with DB persistence
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (Dashboard, Create, Details)
│   │   ├── hooks/           # Websocket custom listener hook
│   │   ├── store/           # Zustand stores (assignment, UI status)
│   │   └── utils/           # Axios instance
│   ├── package.json
│   └── tsconfig.json
└── README.md
```
