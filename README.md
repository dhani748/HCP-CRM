# HCP CRM - AI-Powered Healthcare Professional Interaction Logger

A full-stack AI-powered CRM module for logging interactions with Healthcare Professionals (HCPs) using natural language processing and LangGraph orchestration.

## Project Setup

### Prerequisites

- Python 3.12
- Node.js 18+

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GROQ_API_KEY="your_groq_api_key"

# The database is SQLite by default (backend/hcp_crm.db).
# To use PostgreSQL, set DATABASE_URL in backend/app/database/database.py.

# Start server
uvicorn app.main:app --reload
```

### Project Structure

```
hcp-crm/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── redux/           # Redux store and slices
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/             # Static assets
│   ├── .env.example        # Environment variables example
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── database/              # Database connection and base
│   │   ├── healthcare_professionals/  # HCP model, DTOs
│   │   ├── interaction_records/   # Interaction model, routes, DTOs
│   │   ├── services/              # AI agent (LangGraph + tools)
│   │   └── main.py                # FastAPI application entry point
│   ├── requirements.txt
│   └── hcp_crm.db                 # SQLite database (auto-created)
└── README.md
```

## AI Capabilities

The application features:

1. **Natural Language Processing**: Convert natural language interactions into structured data
2. **LangGraph Orchestration**: Intent detection, tool selection, and response generation
3. **LLM Integration**: Groq + llama-3.3-70b-versatile for AI-powered analysis
4. **Multi-tool Support**: Five dedicated tools for interaction management

## Key Features

- **CRM Form**: Structured data entry for HCP interactions
- **AI Assistant**: Conversational chatbot with automatic form population
- **Interaction History**: View and manage previous meetings
- **HCP Profiles**: Search and manage healthcare professional profiles
- **Follow-up Recommendations**: AI-generated next visit suggestions

## Technologies Used

**Frontend**: React 19, Redux Toolkit, React Router, Axios, TailwindCSS, Google Inter Font, React Hook Form, Framer Motion, Lucide Icons

**Backend**: FastAPI, SQLAlchemy, SQLite/PostgreSQL, Pydantic

**AI**: LangGraph, LangChain, Groq API, llama-3.3-70b-versatile
