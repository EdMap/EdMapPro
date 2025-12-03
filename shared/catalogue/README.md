# edmap Simulation Catalogue

This directory contains the extracted content for both Interview and Workspace simulators, organized as JSON files that can be queried, filtered, and adapted based on role, level, and language.

## Directory Structure

```
shared/catalogue/
├── index.json                   # Catalogue index and structure definition
├── README.md                    # This file
├── interview/                   # Interview Simulator content
│   ├── question-banks.json          # Questions by role/type/level
│   ├── interview-config.json        # Types, roles, difficulties, settings
│   ├── evaluation-rubrics.json      # Scoring and evaluation criteria
│   └── team-personas.json           # Panel interview personas
└── workspace/                   # Workspace Simulator content
    ├── team-members.json            # Team member definitions
    ├── documentation-day1.json      # Day 1 onboarding docs
    ├── activities-day1.json         # Day 1 activities
    ├── activities-day2.json         # Day 2 activities
    ├── ticket-timezone-bug.json     # Day 2 ticket definition
    ├── standup-script.json          # Day 2 standup meeting script
    ├── dev-setup-steps.json         # Dev environment setup commands
    ├── git-workflow-steps.json      # Git commands (add, commit, push)
    ├── codebase-structure.json      # Simulated file tree for exploration
    ├── code-exercise-timezone.json  # Timezone bug fix exercise
    └── branch-creation.json         # Branch creation exercise
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
| `ticket-timezone-bug.json` | Ticket definition with title, description, acceptance criteria |
| `standup-script.json` | Daily standup meeting script with timed team messages |
| `dev-setup-steps.json` | Dev environment setup: clone, cd, npm install, npm run dev |
| `git-workflow-steps.json` | Git workflow: stage, commit, push with validation |
| `codebase-structure.json` | Simulated project file tree for codebase exploration |
| `code-exercise-timezone.json` | Code fix exercise with blanks, validation, test scenarios |
| `branch-creation.json` | Branch creation with naming conventions and validation |

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

### Catalogue Service (Recommended)

The catalogue service provides a query-based interface that mirrors the Phase 1 API signature. Components should use this service instead of direct JSON imports to enable seamless transition to the database-backed API.

```typescript
import { catalogue, getCatalogueItems } from '@shared/catalogue/service';

// Query-based access (matches future API signature)
const items = await getCatalogueItems({
  simulator: 'workspace',
  type: 'standup_script',
  role: 'developer',
  day: 2
});

// Typed convenience methods
const standupContent = await catalogue.getStandupScript({ day: 2 });
const devSetupContent = await catalogue.getDevSetupSteps({ role: 'developer' });
const gitWorkflowContent = await catalogue.getGitWorkflowSteps();
const codebaseContent = await catalogue.getCodebaseStructure();
const codeExerciseContent = await catalogue.getCodeExercise();
const branchContent = await catalogue.getBranchCreation();
const interviewConfig = await catalogue.getInterviewConfig();

// Access specific item by ID
const item = await catalogue.getItem('workspace-standup-day2');
```

### CatalogueItem Structure

Each item returned by the service has a normalized structure:

```typescript
interface CatalogueItem<T> {
  meta: {
    id: string;           // Unique identifier
    type: string;         // Content type (e.g., 'standup_script')
    simulator: string;    // 'workspace' or 'interview'
    version: string;      // Content version
    role?: string;        // 'developer', 'pm', 'qa', etc.
    level?: string;       // 'intern', 'junior', 'mid', 'senior'
    language?: string;    // 'javascript', 'python', 'c_cpp'
    day?: number;         // Day number for daily content
  };
  content: T;             // Type-specific content
}
```

### Direct JSON Import (Legacy)

For simple cases, direct imports are still supported:

```typescript
import teamMembers from '@shared/catalogue/workspace/team-members.json';
import questionBanks from '@shared/catalogue/interview/question-banks.json';

const members = teamMembers.content.members;
const questions = questionBanks.content.roles.software_engineer.types.behavioral.junior;
```

### Validation Helpers

The loaders module provides validation functions for user input:

```typescript
import { 
  validateSetupCommand, 
  validateGitCommand, 
  validateBranchName,
  validateCodeBlank 
} from '@shared/catalogue/loaders';

// Validate dev setup command
const isValid = validateSetupCommand(userInput, setupStep);

// Validate git command
const gitValid = validateGitCommand(userInput, gitStep);

// Validate branch name
const branchValid = validateBranchName(userInput, branchConfig);

// Validate code exercise blank
const codeValid = validateCodeBlank(userInput, blankConfig);
```

## Phase 1 Transition

The service layer is designed for seamless Phase 1 transition:

| Phase 0 (Current) | Phase 1 (Future) |
|-------------------|------------------|
| Service loads JSON files | Service calls `/api/catalogue` API |
| In-memory filtering | Database queries with adapter tags |
| Static content | Dynamic, database-backed content |

**No component changes required** - components that use the service layer will work unchanged in Phase 1.

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
