# AI Content Creator - Powered by Portia

A full-stack application that generates engaging social media posts and YouTube scripts using AI agents powered by Portia.

## Features

- 🤖 **Multi-Agent Content Generation**: Uses Portia's agent orchestration to create both posts and scripts
- 📱 **Real-time Progress Tracking**: Live streaming of generation progress and logs
- 🎨 **Beautiful UI**: Modern NextJS frontend with Tailwind CSS
- 📋 **Easy Copy-to-Clipboard**: One-click copying of generated content
- 🔄 **Plan Visualization**: See how Portia plans and executes the content generation

## Tech Stack

### Backend
- **Portia SDK**: AI agent orchestration and tool management
- **FastAPI**: High-performance API server
- **Python**: Core backend logic
- **Streaming**: Real-time progress updates

### Frontend
- **Next.js 15**: React framework with latest features
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development
- **Lucide React**: Beautiful icons

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- uv (Python package manager)

### Backend Setup
```bash
cd backend
./start_server.sh
```
Server will run on http://localhost:8000

### Frontend Setup
```bash
cd frontend
./start_frontend.sh
```
Frontend will run on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter your content idea (e.g., "I am a UI/UX designer making my intro")
3. Click "Generate Content"
4. Watch the real-time progress as Portia plans and executes
5. Copy your generated social media post and YouTube script

## API Endpoints

- `POST /api/generate` - Start content generation
- `GET /api/status/{plan_id}` - Get generation status
- `GET /api/stream/{plan_id}` - Stream live progress
- `GET /api/plans` - List all plans

## Project Structure

```
├── backend/
│   ├── tools/              # Portia tools (PostCreation, YoutubeScript)
│   ├── content_types/       # Pydantic models
│   ├── utilities/          # Helper functions
│   ├── server.py           # FastAPI server
│   └── main.py             # CLI version
└── frontend/
    ├── app/
    │   ├── components/     # React components
    │   └── page.tsx        # Main page
    └── package.json
```

## Features Showcase

This project demonstrates:
- **Agent Orchestration**: Portia automatically plans multi-step content generation
- **Tool Chaining**: Seamless integration of multiple AI tools
- **Real-time Streaming**: Live progress updates during generation
- **Modern Full-stack**: FastAPI + NextJS architecture
- **Production Ready**: Error handling, CORS, proper TypeScript

Perfect for the Portia Hackathon! 🚀
