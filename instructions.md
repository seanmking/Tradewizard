# Export Readiness Assessment Platform - Implementation Guide

## 1. System Architecture

### 1.1 Core Components
```
Frontend (Next.js + TypeScript)
├── Components
│   ├── shadcn/ui Components
│   ├── Custom Assessment Components
│   └── Shared Components
├── Hooks
│   ├── Assessment Logic
│   └── Chat Management
└── Styles (TailwindCSS)

Backend (Python/Flask)
├── Routes
│   ├── Assessment Endpoints
│   └── Chat Endpoints
├── Services
│   ├── Ollama Integration
│   └── Scoring Logic
└── Models
    ├── Assessment
    └── Conversation

Local Storage (POC Phase)
├── In-memory Storage
└── JSON File System
```

### 1.2 Technology Stack
- Frontend:
  - Next.js with TypeScript
  - shadcn/ui component library
  - TailwindCSS for styling
  - Lucide Icons
  - Framer Motion for animations
  - react-markdown for text formatting

- Backend:
  - Python 3.8+
  - Flask framework
  - Flask-CORS
  - Flask-Session
  - Pydantic
  - Ollama for LLM integration

### 1.3 Key Components
```typescript
// Core shadcn/ui Components
import {
  Card,
  Dialog,
  Form,
  Input,
  Button,
  Progress,
  Select,
  Textarea,
  Toast,
  Sheet,
  ScrollArea,
  Separator,
  Tabs,
  Table,
  Accordion,
  Collapsible,
  HoverCard,
} from "@/components/ui"

// Custom Components
interface ChatBubbleProps {
  message: string;
  type: 'user' | 'assistant';
  metadata?: MessageMetadata;
}

interface AssessmentProgressProps {
  currentStage: string;
  totalStages: number;
  category: string;
}

interface RequirementChecklistProps {
  requirements: Requirement[];
  onStatusChange: (id: string, status: string) => void;
}
```

## 2. Project Structure

```
export-readiness/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── assessment.py
│   │   │   └── chat.py
│   │   ├── models/
│   │   │   ├── assessment.py
│   │   │   └── conversation.py
│   │   └── services/
│   │       ├── ollama_service.py
│   │       └── scoring_service.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── assessment/
│   │   │   │   ├── ChatBubble.tsx
│   │   │   │   ├── ProgressTracker.tsx
│   │   │   │   └── RequirementsList.tsx
│   │   │   └── shared/
│   │   ├── hooks/
│   │   │   ├── useAssessment.ts
│   │   │   └── useChat.ts
│   │   └── styles/
│   │       └── globals.css
│   └── package.json
```

## 3. Assessment Flow

### 3.1 Question Categories and Flow
```python
ASSESSMENT_STAGES = {
    'introduction': {
        'id': 'intro',
        'questions': [
            {
                'id': 'greeting',
                'text': "Hey there! I'm excited to help you take your business global. First things first - what's your name?",
                'type': 'text',
                'required': True
            }
        ]
    },
    'business_info': {
        'id': 'business',
        'questions': [
            {
                'id': 'business_overview',
                'text': "Great to meet you {name}! Tell me about your business - what amazing product are you creating, and how long have you been making it?",
                'type': 'text',
                'required': True
            }
        ]
    }
    # ... additional stages
}
```

### 3.2 Conversation Management
- State management using custom hooks
- Context preservation between questions
- Dynamic question flow based on responses
- Progress tracking and stage management

### 3.3 Response Processing
- Natural language processing via Ollama
- Response validation and scoring
- Context-aware follow-up questions
- Progress tracking and stage transitions

## 4. Data Management (POC Phase)

### 4.1 Local Storage Structure
```python
class LocalStorage:
    def __init__(self):
        self.assessments = {}
        self.responses = {}
        self.current_sessions = {}

    def save_response(self, session_id: str, response_data: dict):
        if session_id not in self.responses:
            self.responses[session_id] = []
        self.responses[session_id].append(response_data)
```

### 4.2 File System Storage
- JSON-based storage for persistence
- Session management
- Response history
- Assessment progress tracking

## 5. Implementation Phases

### Phase 1: Core Setup
- Initialize Python/Flask backend
- Set up Next.js frontend with shadcn/ui
- Implement basic routing and component structure

### Phase 2: Assessment Flow
- Implement conversation management
- Create UI components for chat interface
- Set up Ollama integration
- Implement response processing

### Phase 3: Scoring and Analysis
- Implement scoring logic
- Create progress tracking
- Generate recommendations
- Build results display

### Phase 4: Polish and Optimization
- Add animations and transitions
- Implement error handling
- Add loading states
- Optimize performance

## 6. Development Guidelines

### 6.1 Code Style
- Python: PEP 8 standards
- TypeScript: Strict mode
- Component-based architecture
- Custom hooks for logic separation

### 6.2 Testing
- Unit tests for core functions
- Integration tests for API endpoints
- Component testing with React Testing Library
- End-to-end testing with Cypress

### 6.3 Documentation
- Inline code documentation
- API documentation
- Component documentation
- Setup and deployment guides

## 7. Running the Application

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Ollama Setup
```bash
# Ensure Ollama is running with the required model
ollama run llama2
``` 