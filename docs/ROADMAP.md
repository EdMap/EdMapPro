# edmap Product Roadmap

> **Last Updated**: December 2024

---

## Current Focus: Sprint Cycle Finalization

Completing the core sprint experience before adding advanced features.

---

## Roadmap Items

### 🔜 Phase 1: Sprint Cycle Polish (Current)

*Finalize the standard sprint cycle experience*

- [ ] Sprint phase transitions and completion flows
- [ ] Sprint review ceremony refinements
- [ ] Sprint retrospective ceremony refinements
- [ ] 1:1 coaching integration
- [ ] Final evaluation/recommendation system

---

### 📋 Phase 2: Soft Skill Event System

*Inject realistic workplace scenarios into sprints to practice professional communication*

**Status**: Design Complete, Implementation Deferred

#### Architecture Overview

**One event per sprint** - Single, meaningful soft skill moment injected contextually during sprint execution.

#### Event Taxonomy (5 Categories)

| Category | Primary Competency | Evaluation Focus | Default Channel | Outcome |
|----------|-------------------|------------------|-----------------|---------|
| Task-Generating Negotiations | Negotiation & Commitment | Scope clarity, realistic commitments, timeline awareness | `chat_dm` | Ticket created |
| Support/Escalation Requests | Boundary Management | Helpfulness vs. overcommitment, knowing when to escalate | `chat_dm` | Ticket or deferred |
| Feedback & Review Exchanges | Professional Receptiveness | Non-defensiveness, actionable responses, growth mindset | `pr_review_thread` | Acknowledgement |
| Team Dynamics & Ceremony Moments | Conflict Resolution | Empathy, de-escalation, finding common ground | `ceremony_agenda` | Alignment note |
| Context & Discovery Dialogues | Inquiry & Synthesis | Asking good questions, summarizing understanding | `chat_dm` | Understanding summary |

#### Data Model

**Templates** (the catalog)
```typescript
interface SoftSkillEventTemplate {
  templateId: string;
  category: SoftSkillEventCategory;
  targetCompetency: string;
  channelProfile: {
    primary: CommunicationChannelId;
    auxiliaries?: ChannelDescriptor[];
  };
  actionSet: ActionSetDefinition;
  rubricFocus: Record<string, number>;
  scenarioData: ScenarioConfig;
}
```

**Instances** (runtime occurrences)
```typescript
interface SoftSkillEventInstance {
  instanceId: string;
  templateId: string;
  userId: number;
  sprintId: number;
  triggeredAt: string;
  completedAt?: string;
  userResponse: SoftSkillEventUserResponse;
  evaluation: SoftSkillEventEvaluation;
  outcomeArtifacts: OutcomeArtifact[];
  traceIds: { ticketId?: number; alignmentNoteId?: string };
}
```

#### Selection Mechanism

**Progressive personalization using confidence thresholds:**

| Stage | Trigger | Selection Method |
|-------|---------|------------------|
| Cold start | No data | Uniform random sampling |
| Interview-seeded | Workspace profile exists | Blend interview competency data into weights |
| Personalized | ≥2 assessments per competency OR confidence >0.6 | Deficit-weighted targeting |

**Weighted lottery** for smooth personalization ramp (not hard flip).

**Cadence gate**: Open window on Day 2-4 of sprint, single decision: fire or skip.

#### Action Set Abstraction

Extensible action definitions with optional follow-through:

```typescript
interface ActionSetDefinition {
  actionType: 'ticket.create' | 'escalation.decide' | 'conflict.mitigate' | 'ack.record';
  decisionOutcome: DecisionConfig;
  followThrough?: FollowThroughConfig;  // Optional, for future extension
}
```

**MVP**: Evaluate decision only (e.g., "should I escalate to HR?")
**Future**: Add follow-through simulations (HR conversation, manager discussion)

#### Evaluation → Progression Pipeline

```
Event Evaluation
     ↓
Progression Engine (as SoftSkillAssessment record)
     ↓
Competency Ledger Update
     ↓
┌────────────────┬─────────────────┐
│ 1:1 Coaching   │ Sprint Review   │
│ (coaching      │ (summary cards  │
│ prompts)       │ for final eval) │
└────────────────┴─────────────────┘
```

#### Adapter Compatibility

Reuses existing Role + Level adapter pattern:
- **Role Base Adapter**: Default rubric weights, evaluation focus, prompt style
- **Level Overlay**: Suggestion visibility, feedback tone, strictness
- **Template Metadata**: Scenario-specific channel, action set, personas

No new adapter types needed.

#### Implementation Tasks (Deferred)

1. Add `communicationChannelId` and `channels` fields to adapter types
2. Create `SoftSkillChannelRenderer` interface and channel registry
3. Build channel renderers (chat_dm, pr_review_thread, ceremony_agenda, notification)
4. Create event log surface in workspace sidebar
5. Implement selector service (cadence gate + gap-based targeting)
6. Build competency ledger and integrate with progression engine
7. Connect event evaluations to 1:1 and final evaluation surfaces

#### Guardrails

- **Load protection**: Skip events if user's sprint is overloaded
- **Privacy controls**: HR-oriented events need careful handling
- **Retry safety**: Idempotent action execution
- **LLM fallback**: Graceful degradation when API unavailable

---

### 📋 Phase 3: Advanced Features

*Future enhancements after core experience is solid*

- [ ] Multi-role support (PM, QA, DevOps, Data Science)
- [ ] Multiple programming language support
- [ ] Advanced competency analytics dashboard
- [ ] Escalation follow-through simulations (HR, manager conversations)
- [ ] Team collaboration scenarios (pair programming, mob reviews)

---

## Design Documents

- **UI Architecture**: `docs/DESIGN_GUIDELINES.md`
- **Adapter Patterns**: `shared/adapters/` directory
- **Soft Skill Types**: `shared/adapters/soft-skills/types.ts`
