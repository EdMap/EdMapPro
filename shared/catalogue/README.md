# edmap Simulation Catalogue

This directory contains the extracted content for both Interview and Workspace simulators, organized as JSON files that can be queried, filtered, and adapted based on role, level, and language.

## Directory Structure

```
shared/catalogue/
├── index.json              # Catalogue index and structure definition
├── README.md               # This file
├── interview/              # Interview Simulator content
│   ├── question-banks.json     # Questions by role/type/level
│   ├── interview-config.json   # Types, roles, difficulties, settings
│   ├── evaluation-rubrics.json # Scoring and evaluation criteria
│   └── team-personas.json      # Panel interview personas
└── workspace/              # Workspace Simulator content
    ├── team-members.json       # Team member definitions
    ├── documentation-day1.json # Day 1 onboarding docs
    ├── activities-day1.json    # Day 1 activities
    ├── activities-day2.json    # Day 2 activities
    └── ticket-timezone-bug.json # Day 2 coding exercise
```

## Content Types

### Interview Catalogue

| File | Purpose |
|------|---------|
| `question-banks.json` | Interview questions organized by role (developer, PM, etc.), type (behavioral, technical), and level (junior, mid, senior) |
| `interview-config.json` | Configuration for interview types, stage settings, assessment criteria |
| `evaluation-rubrics.json` | Scoring scales, evaluation dimensions, final report structure |
| `team-personas.json` | Panel interview personas with roles, styles, and team configurations |

### Workspace Catalogue

| File | Purpose |
|------|---------|
| `team-members.json` | Team member definitions with personalities, expertise, and avatar configs |
| `documentation-day1.json` | Product documentation, team norms, development workflow |
| `activities-day1.json` | Day 1 activities: read docs, meet team, comprehension check |
| `activities-day2.json` | Day 2 activities: standup, dev setup, coding, git, PR |
| `ticket-timezone-bug.json` | Complete ticket with code exercise, file structure, git workflow |

## Adapter Pattern

Content is designed to be adapted based on:

### Role Adapters
- **Developer**: Technical problems, code-focused scenarios
- **PM**: Requirements, prioritization scenarios
- **QA**: Testing, edge case scenarios
- **DevOps**: Infrastructure, deployment scenarios
- **Data Science**: Data pipeline, ML scenarios

### Level Adapters
- **Intern**: Basic concepts, more guidance
- **Junior**: Foundational skills, standard complexity
- **Mid**: Increased complexity, less guidance
- **Senior**: Advanced challenges, leadership aspects

### Language Adapters (Developer only)
- **JavaScript**: React, Node.js, npm, Jest
- **Python**: Django/Flask, pip, pytest
- **C/C++**: Memory management, compilation, gtest

## Usage

### Reading Catalogue Content

```typescript
import teamMembers from '@shared/catalogue/workspace/team-members.json';
import questionBanks from '@shared/catalogue/interview/question-banks.json';

// Get team members
const members = teamMembers.content.members;

// Get junior developer behavioral questions
const questions = questionBanks.content.roles.software_engineer.types.behavioral.junior;
```

### Query Patterns

```typescript
// Get activities for Day 2
const day2Activities = activities.content.activities;

// Filter by completion status
const incomplete = day2Activities.filter(a => a.completionCheck === 'standupComplete');

// Get questions matching criteria
const techQuestions = questionBanks.content.roles.software_engineer.types.technical.mid;
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2025 | Initial extraction from hardcoded content (Phase 0) |

## Next Steps (Phase 1+)

1. Create TypeScript types for catalogue content
2. Build catalogue API endpoints (`GET /api/catalogue`)
3. Create adapter functions for role/level/language
4. Migrate components to consume catalogue data
5. Add enterprise customization layer
