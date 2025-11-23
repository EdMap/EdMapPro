# Migration Plan: Workspace Simulator to Django/Preact

## Overview
This document outlines how to migrate the Workspace Simulator features (multi-step wizard, status ribbon, welcome modal, etc.) from the current React/Express codebase to your Django/Preact architecture.

## What We've Built (Current Codebase)

### 1. Workspace Simulator Frontend Features
Located in: `client/src/pages/workspace-simulator.tsx`

**Multi-Step Wizard**
- 3-step guided flow: Choose Project → Select Role → Confirm & Start
- Visual progress indicator with step status (completed, current, upcoming)
- Linear progression with automatic step advancement
- Expandable project cards showing team roster, features, difficulty
- Expandable role cards with tasks, scenarios, skills to practice

**Welcome Modal**
- Appears after starting simulation
- Shows project overview, role, team size
- Role-specific guidance (PM → Requirements tab, Developer → Codebase tab)
- Estimated time commitment

**Status Ribbon**
- Located in: `client/src/components/simulation/enterprise-feature-session.tsx`
- Always-visible gradient banner showing:
  - Current phase badge
  - Objectives progress (X/Y completed)
  - Context-aware next step recommendations
- Safety guards for sessions without phase data

**Rich Preview Data**
- PROJECT_SCENARIOS constant with full team details
- ROLE_DETAILS constant with specific tasks and scenarios
- Hero text explaining simulator purpose

### 2. Backend Storage Structure
Located in: `server/storage.ts` and `shared/schema.ts`

**WorkspaceSession**
```typescript
{
  id: number
  userId: number
  projectId: string
  activeRole: string
  status: 'active' | 'completed' | 'abandoned'
  createdAt: Date
  lastActive: Date
  configuration: {
    activeRole: string
    phaseData: Phase[]
    teamMembers: TeamMember[]
  }
}
```

**Phase Structure**
```typescript
{
  name: string
  description: string
  objectives: string[]
  completedObjectives: number[]
}
```

## Migration to Django/Preact

### Backend (Django)

#### 1. Create New Django App: `WorkspaceSimulation`

```bash
cd backend/src/apps
python ../../manage.py startapp WorkspaceSimulation
```

#### 2. Models (`backend/src/apps/WorkspaceSimulation/models.py`)

```python
from django.db import models
from src.apps.UserProfile.models import UserProfile
from src.apps.core.models import MessageOwnerType

class WorkspaceSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    project_id = models.CharField(max_length=100)
    active_role = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # JSON field for configuration (phase data, team members, etc.)
    configuration = models.JSONField(default=dict)
    
    creation_date = models.DateTimeField(auto_now_add=True)
    last_update_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'workspace_sessions'

class WorkspaceMessage(models.Model):
    session = models.ForeignKey(WorkspaceSession, on_delete=models.CASCADE)
    message = models.TextField()
    owner_type = models.CharField(
        max_length=10,
        choices=MessageOwnerType.choices,
        default=MessageOwnerType.USER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Additional metadata (channel, mention, etc.)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'workspace_messages'
        ordering = ['created_at']
```

#### 3. Serializers (`backend/src/apps/WorkspaceSimulation/serializers.py`)

```python
from rest_framework import serializers
from .models import WorkspaceSession, WorkspaceMessage

class WorkspaceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceSession
        fields = '__all__'
        read_only_fields = ['creation_date', 'last_update_date']

class StartWorkspaceRequest(serializers.Serializer):
    project_id = serializers.CharField(max_length=100)
    active_role = serializers.CharField(max_length=100)
    configuration = serializers.JSONField()

class WorkspaceMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceMessage
        fields = '__all__'
        read_only_fields = ['created_at']

class SendMessageRequest(serializers.Serializer):
    message = serializers.CharField()
    channel = serializers.CharField(required=False)
    mentioned_user = serializers.CharField(required=False)
```

#### 4. Views (`backend/src/apps/WorkspaceSimulation/views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from .models import WorkspaceSession, WorkspaceMessage
from .serializers import *

class WorkspaceSessionsListView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        operation_id="get_workspace_sessions",
        responses={"200": WorkspaceSessionSerializer(many=True)}
    )
    def get(self, request):
        profile = request.user.userprofile
        sessions = WorkspaceSession.objects.filter(user=profile).order_by('-creation_date')
        serializer = WorkspaceSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        operation_id="create_workspace_session",
        request=StartWorkspaceRequest,
        responses={"201": WorkspaceSessionSerializer}
    )
    def post(self, request):
        serializer = StartWorkspaceRequest(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session = WorkspaceSession.objects.create(
            user=request.user.userprofile,
            project_id=serializer.validated_data['project_id'],
            active_role=serializer.validated_data['active_role'],
            configuration=serializer.validated_data['configuration'],
            status='active'
        )
        
        return Response(
            WorkspaceSessionSerializer(session).data,
            status=status.HTTP_201_CREATED
        )

class WorkspaceSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_session(self, session_id, user):
        try:
            return WorkspaceSession.objects.get(id=session_id, user=user.userprofile)
        except WorkspaceSession.DoesNotExist:
            return None
    
    @extend_schema(
        operation_id="get_workspace_session",
        responses={"200": WorkspaceSessionSerializer}
    )
    def get(self, request, session_id):
        session = self.get_session(session_id, request.user)
        if not session:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = WorkspaceSessionSerializer(session)
        return Response(serializer.data)

class WorkspaceMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        operation_id="send_workspace_message",
        request=SendMessageRequest,
        responses={"201": WorkspaceMessageSerializer}
    )
    def post(self, request, session_id):
        session = WorkspaceSession.objects.get(id=session_id)
        
        # Validate request
        serializer = SendMessageRequest(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save user message
        user_message = WorkspaceMessage.objects.create(
            session=session,
            message=serializer.validated_data['message'],
            owner_type='USER',
            metadata={
                'channel': serializer.validated_data.get('channel', 'general'),
                'mentioned_user': serializer.validated_data.get('mentioned_user')
            }
        )
        
        # TODO: Generate AI response using workspace orchestrator
        # ai_response = workspace_orchestrator.generate_response(...)
        
        return Response(
            WorkspaceMessageSerializer(user_message).data,
            status=status.HTTP_201_CREATED
        )
```

#### 5. URLs (`backend/src/apps/WorkspaceSimulation/urls.py`)

```python
from django.urls import path
from .views import *

urlpatterns = [
    path('sessions', WorkspaceSessionsListView.as_view(), name='workspace-sessions'),
    path('sessions/<int:session_id>', WorkspaceSessionDetailView.as_view(), name='workspace-session-detail'),
    path('sessions/<int:session_id>/messages', WorkspaceMessagesView.as_view(), name='workspace-messages'),
]
```

Add to `backend/src/apps/urls.py`:
```python
path("workspace_simulation/", include("src.apps.WorkspaceSimulation.urls")),
```

#### 6. AI Agent (Optional - if you want AI teammates)

Create `backend/src/agents/workspace/workspace_orchestrator.py`:

```python
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from src.agents.llm import groq_llm

class WorkspaceOrchestrator:
    def __init__(self):
        self.llm = groq_llm
    
    def generate_response(self, session_config, message, context):
        """
        Generate AI teammate response based on:
        - session_config: role, project, phase
        - message: user's message
        - context: conversation history, mentioned user
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are {role_name}, a {role_type} on the team..."),
            ("human", "{message}")
        ])
        
        chain = prompt | self.llm
        response = chain.invoke({
            "role_name": context.get('mentioned_user', 'Team'),
            "role_type": session_config.get('active_role'),
            "message": message
        })
        
        return response.content
```

### Frontend (Preact)

#### 1. File Structure

```
frontend/src/
├── features/
│   └── workspace/
│       ├── components/
│       │   ├── WorkspaceWizard.tsx          # Multi-step project/role selection
│       │   ├── ProjectPreview.tsx           # Expandable project cards
│       │   ├── RolePreview.tsx              # Expandable role cards
│       │   ├── WelcomeModal.tsx             # First-session onboarding
│       │   ├── StatusRibbon.tsx             # Phase/objectives ribbon
│       │   └── WorkspaceSession.tsx         # Main simulation view
│       ├── data/
│       │   ├── projects.ts                  # PROJECT_SCENARIOS data
│       │   └── roles.ts                     # ROLE_DETAILS data
│       ├── api/
│       │   └── workspaceApi.ts              # API client functions
│       └── index.tsx                        # Route entry point
└── pages/
    └── WorkspaceSimulatorPage.tsx           # Main page wrapper
```

#### 2. Port Key Components

**Multi-Step Wizard** (`frontend/src/features/workspace/components/WorkspaceWizard.tsx`)
- Copy logic from `client/src/pages/workspace-simulator.tsx`
- Adapt React hooks to Preact hooks (mostly compatible)
- Update state management to use Preact signals or Redux
- Replace shadcn components with Shoelace equivalents

**Status Ribbon** (`frontend/src/features/workspace/components/StatusRibbon.tsx`)
- Copy from `client/src/components/simulation/enterprise-feature-session.tsx`
- Keep safety guards: `if (!phases.length || !currentPhaseData) return null`
- Adapt styling to Shoelace theme

**Project/Role Data** (`frontend/src/features/workspace/data/`)
- Copy PROJECT_SCENARIOS and ROLE_DETAILS constants
- Convert TypeScript types to match Preact conventions

#### 3. API Integration

**API Client** (`frontend/src/features/workspace/api/workspaceApi.ts`)

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1.0';

export const workspaceApi = {
  // Get all sessions
  getSessions: async () => {
    const response = await axios.get(`${API_BASE}/workspace_simulation/sessions`);
    return response.data;
  },
  
  // Start new session
  startSession: async (projectId: string, role: string, config: any) => {
    const response = await axios.post(`${API_BASE}/workspace_simulation/sessions`, {
      project_id: projectId,
      active_role: role,
      configuration: config
    });
    return response.data;
  },
  
  // Get session details
  getSession: async (sessionId: number) => {
    const response = await axios.get(`${API_BASE}/workspace_simulation/sessions/${sessionId}`);
    return response.data;
  },
  
  // Send message
  sendMessage: async (sessionId: number, message: string, channel?: string, mentionedUser?: string) => {
    const response = await axios.post(
      `${API_BASE}/workspace_simulation/sessions/${sessionId}/messages`,
      { message, channel, mentioned_user: mentionedUser }
    );
    return response.data;
  }
};
```

#### 4. Redux Store (if using Redux)

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workspaceApi } from './api/workspaceApi';

export const fetchSessions = createAsyncThunk(
  'workspace/fetchSessions',
  async () => await workspaceApi.getSessions()
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    sessions: [],
    currentSession: null,
    loading: false
  },
  reducers: {
    // ... reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      });
  }
});
```

## Migration Steps (Prioritized)

### Phase 1: Backend Foundation (1-2 hours)
1. ✅ Create `WorkspaceSimulation` Django app
2. ✅ Define models for WorkspaceSession and WorkspaceMessage
3. ✅ Create serializers
4. ✅ Implement basic CRUD views
5. ✅ Add URL routes
6. ✅ Run migrations
7. ✅ Test endpoints via Swagger

### Phase 2: Frontend Structure (2-3 hours)
1. ✅ Create workspace feature directory structure
2. ✅ Copy project and role data constants
3. ✅ Create API client functions
4. ✅ Set up routing for workspace simulator page

### Phase 3: Core UI Components (3-4 hours)
1. ✅ Port WorkspaceWizard component
   - Adapt React → Preact
   - Replace shadcn → Shoelace components
   - Test step navigation
2. ✅ Port ProjectPreview and RolePreview
   - Expandable cards with full details
   - Selection state management
3. ✅ Port WelcomeModal
   - Role-specific content
   - Dismissible state

### Phase 4: Session Interface (4-5 hours)
1. ✅ Port StatusRibbon component
   - Phase tracking
   - Objectives progress
   - Next step recommendations
2. ✅ Create main WorkspaceSession view
   - Tab navigation (Team, Requirements, Codebase, etc.)
   - Chat interface
   - Document viewer integration
3. ✅ Integrate all components together

### Phase 5: AI Integration (Optional - 5-6 hours)
1. Create WorkspaceOrchestrator agent
2. Define teammate personalities and behaviors
3. Implement message routing logic
4. Add streaming responses
5. Test AI interactions

## Component Compatibility: React → Preact

Most React code works in Preact with minimal changes:

**Differences:**
- `className` → same in Preact
- Hooks work the same (useState, useEffect, etc.)
- No need to import React
- Some React-specific libs need Preact equivalents

**shadcn → Shoelace Mapping:**
- `<Button>` → `<sl-button>`
- `<Card>` → `<sl-card>`
- `<Badge>` → `<sl-badge>`
- `<Dialog>` → `<sl-dialog>`
- `<Select>` → `<sl-select>`

**Example Conversion:**

```tsx
// React (current)
import { Button } from "@/components/ui/button"
<Button onClick={handleClick}>Click me</Button>

// Preact (target)
<sl-button onClick={handleClick}>Click me</sl-button>
```

## Testing Strategy

1. **Backend API Tests**
   - Test session creation via Swagger
   - Test message sending
   - Verify configuration storage

2. **Frontend Integration Tests**
   - Test wizard flow end-to-end
   - Verify API calls work correctly
   - Check state persistence

3. **End-to-End Tests**
   - Complete user journey: select project → select role → start → interact
   - Verify all features work together

## Rollback Plan

If migration issues arise:
1. Both codebases exist independently (backend/, frontend/ vs client/, server/)
2. Can compare working React version with Preact version
3. Easy to reference original implementation
4. No data loss risk (new Django models, separate from existing)

## Estimated Timeline

- **Minimal Viable Migration** (just workspace CRUD): 1-2 days
- **Full UI Migration** (all components): 3-4 days
- **With AI Integration**: 5-7 days

## Next Immediate Steps

1. Clean up old code (remove client/, server/, shared/)
2. Start Django backend on port 8000
3. Start Preact frontend on port 5175
4. Create WorkspaceSimulation Django app
5. Begin Phase 1 of migration
