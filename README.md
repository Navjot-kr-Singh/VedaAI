🚀 VedaAI — AI Powered Assessment Generation Platform

<div align="center">

🧠 VedaAI

Production-Grade AI Assessment Creation Platform for Modern Educators

Generate structured, printable, AI-powered assessments using advanced queue processing, real-time streaming, intelligent validation pipelines, and Google Gemini.

</div>

⸻

✨ Overview

VedaAI is a full-stack AI-powered assessment generation system built for teachers, schools, universities, and educational institutions.

The platform allows educators to:

✅ Upload study material (PDF/TXT)
✅ Generate structured question papers using AI
✅ Create MCQs, Short Answers, Long Answers
✅ Stream live generation progress in real-time
✅ Export beautifully formatted printable PDFs
✅ Retry, cancel, and manage generation jobs safely

The application is designed using production-grade backend architecture patterns including:

* BullMQ background workers
* Redis queue orchestration
* Event-driven architecture
* WebSocket live updates
* AI validation & retry pipelines
* Strong schema enforcement using Zod

⸻

🔥 Features

🤖 AI Powered Assessment Generation

Powered by:

* Google Gemini 2.5 Flash
* Structured Prompt Engineering
* Zod Validation Pipelines
* Self-Healing AI Retry Logic

The AI can generate:

* MCQs
* Short Answer Questions
* Long Answer Questions
* Section-based assessments
* Difficulty-balanced papers

⸻

📄 Smart Document Processing

Upload:

* PDF files
* TXT files

The backend automatically:

* extracts text
* chunks large documents
* compresses syllabus references
* generates optimized AI prompts

⸻

🛡️ Strict Validation Pipeline

Every AI response is:

✅ Sanitized
✅ Parsed
✅ Validated
✅ Repaired automatically if malformed

Validation uses:

* Zod schemas
* discriminated unions
* retry correction prompts

This ensures:

* valid JSON only
* no malformed papers
* proper MCQ structures
* guaranteed rendering compatibility

⸻

⚡ Real-Time Queue System

Heavy AI generation tasks run asynchronously using:

* BullMQ
* Redis
* Worker architecture

Live progress updates stream to the frontend:

Queued
→ Compressing Reference Material
→ Generating Questions
→ Validating JSON
→ Formatting Paper
→ Completed

⸻

📡 WebSocket Streaming

Using Socket.IO, the frontend receives:

* real-time progress
* status updates
* failure notifications
* retry events
* completion events

without page refreshes.

⸻

🖨️ High Fidelity PDF Export

Generated assessments can be exported instantly as:

✅ printable PDFs
✅ multi-page layouts
✅ student-ready papers
✅ clean typography formatting

Built using:

* pdf-lib
* custom layout engine
* print-safe spacing system

⸻

🧠 AI Reliability Engineering

VedaAI includes several advanced AI reliability mechanisms:

Feature	Purpose
Zod Validation	Guarantees strict response structure
Retry Pipeline	Auto-corrects malformed AI output
JSON Sanitization	Removes markdown/code fences
Timeout Protection	Prevents infinite generation loops
Queue Cancellation	Terminates stuck jobs safely
Model Fallbacks	Handles Gemini model compatibility
Event Architecture	Decoupled processing pipeline

⸻

🛠️ Tech Stack

Frontend

* Next.js 14
* TypeScript
* Zustand
* Tailwind CSS
* Framer Motion
* React Hook Form
* Lucide React
* Socket.IO Client

Backend

* Node.js
* Express.js
* TypeScript
* BullMQ
* Redis
* MongoDB
* Mongoose
* Socket.IO
* pdf-lib
* pdf-parse
* Winston Logger
* Zod

AI Layer

* Google Gemini API
* Prompt Engineering
* Structured JSON Enforcement
* AI Retry Self-Correction System

⸻

🏗️ System Architecture

graph TD
Client[Next.js Frontend]
--> API[Express Backend API]
API --> Mongo[(MongoDB)]
API --> Queue[BullMQ Queue]
Queue --> Redis[(Redis)]
Worker[BullMQ Worker]
--> Gemini[Google Gemini API]
Worker --> Validator[Zod Validation]
Worker --> Parser[JSON Sanitizer]
Worker --> Events[Event Bus]
Events --> Socket[Socket.IO Gateway]
Events --> Logger[Winston Logger]
Events --> Database[(MongoDB)]
Socket --> Client

⸻

📁 Project Structure

VedaAI/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── utils/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── listeners/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── chunking/
│   │   │   └── pdf/
│   │   ├── sockets/
│   │   └── workers/
│
└── README.md

⸻

⚙️ Environment Variables

Backend (.env)

PORT=4001
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

⸻

Frontend (.env.local)

NEXT_PUBLIC_API_URL=http://localhost:4001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4001

⸻

🚀 Local Development Setup

1. Install Dependencies

npm install --prefix backend
npm install --prefix frontend

⸻

2. Start MongoDB & Redis

MongoDB

brew services start mongodb-community

Redis

brew services start redis

⸻

3. Run Backend

npm run dev --prefix backend

Runs on:

http://localhost:4001

⸻

4. Run Frontend

npm run dev --prefix frontend

Runs on:

http://localhost:3000

⸻

📡 API Endpoints

Method	Endpoint	Description
POST	/api/assignments	Create assignment
GET	/api/assignments	Get all assignments
GET	/api/assignments/:id	Get assignment
DELETE	/api/assignments/:id	Delete assignment
POST	/api/assignments/:id/regenerate	Retry generation
POST	/api/assignments/:id/cancel	Cancel generation
GET	/api/assignments/:id/pdf	Download PDF

⸻

🧪 Reliability & Failure Handling

VedaAI gracefully handles:

✅ malformed AI responses
✅ invalid JSON
✅ API quota failures
✅ model incompatibilities
✅ stuck generation jobs
✅ queue retries
✅ timeout protection
✅ websocket recovery

⸻

📈 Future Improvements

* Teacher answer-key mode
* Student authentication
* Role-based dashboards
* AI difficulty balancing
* Analytics & insights
* Multi-language assessments
* Cloud deployment pipeline
* Assessment templates
* OCR image extraction

⸻

👨‍💻 Author

Navjot Kumar Singh

Full Stack Developer • AI Systems Enthusiast • Backend Architecture Learner

GitHub:
https://github.com/Navjot-kr-Singh

⸻

⭐ Support

If you like this project, consider giving it a star ⭐

It helps support the project and motivates future improve

ts.
:::