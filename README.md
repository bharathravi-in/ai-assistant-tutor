# AI-Enabled Just-in-Time Teaching & Classroom Support Platform

An AI-powered web application to provide government school teachers with instant, contextual teaching support.

## Features

- **AI Tutor Mode**: Get explanations on how to teach concepts
- **Classroom Assistant**: Real-time help for classroom challenges
- **Lesson Planner**: Generate lesson plans with AI
- **Multilingual Support**: Voice & text in local languages
- **CRP/ARP Dashboard**: Async coaching and oversight
- **Admin Analytics**: System-wide insights and reports

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL + Redis
- **AI**: LLM Integration (OpenAI/Gemini/LiteLLM)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Development Setup

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Start all services:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
Gov_Teaching/
├── backend/          # FastAPI Python Backend
├── frontend/         # React + TypeScript Frontend
├── docker-compose.yml
└── README.md
```

## Environment Variables

See `.env.example` for required configuration.

## License

Proprietary - Government of India
# ai-assistant-tutor
