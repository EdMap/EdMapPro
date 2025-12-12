# Sprint Ceremonies Specification

> **Status**: ✅ All ceremonies implemented

## Overview

This document details the Scrum ceremonies implemented in edmap's Workspace Simulator. Each ceremony uses the adapter architecture for role/level customization.

---

## Ceremony Summary

| Ceremony | Duration (Simulated) | Duration (Real) | Status |
|----------|---------------------|-----------------|--------|
| Sprint Planning | 30-60 min | 10-15 min | ✅ Built |
| Daily Standup | 5-10 min | 2-3 min | ✅ Built |
| Sprint Review | 15-20 min | 8-12 min | ✅ Built |
| Sprint Retrospective | 15-20 min | 8-12 min | ✅ Built |
| Manager 1:1 | 10-15 min | 5-8 min | ⏳ Planned |

---

## Sprint Planning

### Purpose

Collaborative session where AI team discusses sprint scope and user participates in selection.

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPRINT PLANNING FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. BRIEFING SCREEN                                              │
│     ├── Meeting agenda                                           │
│     ├── Attendees with avatars                                   │
│     └── Level-specific context notes                             │
│                                                                  │
│  2. CONTEXT PHASE                                                │
│     ├── Sarah introduces sprint goals                            │
│     ├── Priya presents prioritized backlog                       │
│     └── User can ask clarifying questions                        │
│                                                                  │
│  3. DISCUSSION PHASE                                             │
│     ├── AI team discusses items (staggered messages)             │
│     ├── User participates in discussion                          │
│     └── Marcus, Alex provide technical input                     │
│                                                                  │
│  4. COMMITMENT PHASE                                             │
│     ├── Team selects items for sprint                            │
│     ├── User confirms capacity                                   │
│     └── Sprint goal finalized                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Message Staggering

Level-aware delays prevent AI message flooding:

| Level | Base Delay | Typing Indicator |
|-------|------------|------------------|
| Intern | 1500ms | Persona-specific avatar |
| Junior | 1200ms | Persona-specific avatar |
| Mid | 1000ms | Generic typing |
| Senior | 800ms | Minimal |

### Adapter Configuration

```typescript
interface SprintPlanningConfig {
  facilitator: PersonaConfig;        // Usually Sarah
  participants: PersonaConfig[];     // Team members
  phases: PlanningPhaseConfig[];
  backlogItems: BacklogItem[];
  levelOverlay: LevelPlanningOverlay;
}
```

### Files

- Adapter: `shared/adapters/planning/`
- Component: `client/src/components/workspace/planning-module.tsx`
- Messages: `planning_messages` table

---

## Daily Standup

### Purpose

Short check-in where user shares progress and AI team provides context.

### Format

Each team member shares:
1. What they did yesterday
2. What they're doing today
3. Any blockers

User provides:
- Progress update on assigned tickets
- Questions or blockers

### Level-Based Evaluation

| Level | Update Evaluation | Follow-up Questions |
|-------|-------------------|---------------------|
| Intern | Encouraging, educational | Helpful prompts |
| Junior | Constructive feedback | On-topic questions |
| Mid | Direct assessment | Minimal follow-up |
| Senior | Peer-level discussion | Challenge assumptions |

### Files

- Component: `client/src/components/workspace/execution-module.tsx`
- AI Service: `server/services/workspace-orchestrator.ts`

---

## Sprint Review

### Purpose

Demo completed work to stakeholders and receive feedback.

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPRINT REVIEW FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INTRODUCTION                                                 │
│     └── Sarah opens review, introduces attendees                 │
│                                                                  │
│  2. USER DEMO                                                    │
│     ├── Present completed tickets                                │
│     ├── Show key functionality                                   │
│     └── Answer stakeholder questions                             │
│                                                                  │
│  3. STAKEHOLDER FEEDBACK                                         │
│     ├── Eng Manager: Technical assessment                        │
│     ├── Tech Lead: Code quality feedback                         │
│     └── Product: Business impact                                 │
│                                                                  │
│  4. CLOSING                                                      │
│     └── Summary and next steps                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Stakeholder Personas

**Developer Role**:
- Eng Manager - Team and process focus
- Tech Lead - Technical depth
- Product Manager (Priya) - Requirements alignment

**PM Role**:
- VP Product - Strategic alignment
- Customer Success - User impact
- Engineering Lead - Technical feasibility

### Demo Format by Level

| Level | Format | Feedback Tone |
|-------|--------|---------------|
| Intern | Guided prompts | 70% positive, encouraging |
| Junior | Structured with prompts | Balanced, constructive |
| Mid | Minimal prompts | Direct, specific |
| Senior | Freeform | Challenging, strategic |

### Adapter Configuration

```typescript
interface SprintReviewConfig {
  stakeholders: StakeholderPersona[];
  demoFormat: 'guided' | 'prompted' | 'freeform';
  feedbackTone: 'supportive' | 'balanced' | 'direct' | 'challenging';
  positiveFeedbackRatio: number;  // 0.7 for intern, 0.4 for senior
}
```

### Files

- Adapter: `shared/adapters/review/`
- Component: `client/src/components/workspace/review-module.tsx`

---

## Sprint Retrospective

### Purpose

Reflect on sprint process and identify improvements.

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   SPRINT RETROSPECTIVE FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SPRINT CONTEXT RECAP                                         │
│     ├── Tickets completed vs planned                             │
│     ├── Story points achieved                                    │
│     └── Key events summary                                       │
│                                                                  │
│  2. WHAT WENT WELL                                               │
│     ├── AI team contributions                                    │
│     └── User contributions                                       │
│                                                                  │
│  3. WHAT COULD IMPROVE                                           │
│     ├── AI team observations                                     │
│     ├── User input                                               │
│     └── Facilitated discussion                                   │
│                                                                  │
│  4. ACTION ITEMS                                                 │
│     ├── 1-2 specific improvements                                │
│     └── Owners assigned                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Starter Cards

AI-suggested cards help users contribute:

| Level | Cards Provided | Topics |
|-------|----------------|--------|
| Intern | 3 cards | Process clarity, learning, support |
| Junior | 2 cards | Technical challenges, collaboration |
| Mid | 1 card | Process improvement |
| Senior | None | Self-directed |

### Facilitation Style

| Level | Style | Prompting |
|-------|-------|-----------|
| Intern | Guided | Frequent prompts, explanations |
| Junior | Prompted | Occasional prompts |
| Mid | Collaborative | Minimal prompts |
| Senior | Self-directed | Challenge contributions |

### Adapter Configuration

```typescript
interface SprintRetroConfig {
  facilitator: PersonaConfig;        // Usually Sarah
  participants: PersonaConfig[];
  sprintContext: SprintContextData;
  starterCards: RetroCard[];
  facilitationStyle: 'guided' | 'prompted' | 'collaborative' | 'self-directed';
  actionItemRequirement: number;     // 1-2 typically
  focusAreas: string[];              // Role-specific
}
```

### Files

- Adapter: `shared/adapters/retro/`
- Component: `client/src/components/workspace/retro-module.tsx`

---

## Manager 1:1 (⏳ Planned)

### Purpose

Regular check-in with manager for feedback and goal-setting.

### Frequency

After each sprint retrospective.

### Topics

1. **Sprint Performance**
   - Positives from the sprint
   - Areas to improve
   - Specific examples

2. **Career Development**
   - Competency progress
   - Next focus areas

3. **User Agenda**
   - User brings topics
   - Manager responds

4. **Goal Setting** (not in final 1:1)
   - Review previous goals
   - Set new goals

### Final 1:1

The last sprint's 1:1 is extended to include:
- Complete journey review
- Final competency assessment
- Portfolio highlights
- Graduation badge (if earned)

---

## Soft Skill Events (🔄 Partial)

### Overview

Random events injected during sprints to practice soft skills.

### Event Types

| Event | Day | Description |
|-------|-----|-------------|
| Code Review Conflict | 2-3 | Peer disagrees with approach |
| Requirement Change | 4-5 | PM changes requirements mid-sprint |
| Deadline Pressure | 6-7 | Push to complete on time |
| Production Incident | 4-5 | Urgent interrupt |
| Scope Creep | 3-4 | PM requests additional work |

### Current Status

- ✅ Events are generated and stored in sprint backlog
- ❌ No triggering mechanism during sprint
- ❌ No UI to display/handle events
- ❌ No completion tracking

---

## AI Team Members

### Core Team

| Name | Role | Personality |
|------|------|-------------|
| Sarah | Team Lead | Supportive, organized, validates understanding |
| Marcus | Developer | Friendly, mentions chess/biryani, technical focus |
| Priya | Product Manager | Stakeholder-focused, mentions hiking/podcasts |
| Alex | QA Engineer | Detail-oriented, mentions puzzles/board games |

### Persona-Specific Styling

- Each persona has distinct avatar and color
- Messages labeled with persona name
- Typing indicators show persona avatar

---

## See Also

- [JOURNEY_SYSTEM.md](./JOURNEY_SYSTEM.md) - Overall user journey
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) - Current state and priorities
- [CODE_EXECUTION_ARCHITECTURE.md](./CODE_EXECUTION_ARCHITECTURE.md) - Code execution system
