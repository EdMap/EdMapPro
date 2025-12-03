import { db } from "./db";
import { 
  competencies, 
  roleAdapters, 
  simulationCatalogue,
  type InsertCompetency,
  type InsertRoleAdapter,
  type InsertSimulationCatalogue
} from "@shared/schema";
import { eq } from "drizzle-orm";

import competenciesData from "../shared/catalogue/competencies.json";
import roleAdaptersData from "../shared/catalogue/role-adapters.json";

import standupScript from "../shared/catalogue/workspace/standup-script.json";
import devSetupSteps from "../shared/catalogue/workspace/dev-setup-steps.json";
import gitWorkflowSteps from "../shared/catalogue/workspace/git-workflow-steps.json";
import codebaseStructure from "../shared/catalogue/workspace/codebase-structure.json";
import codeExercise from "../shared/catalogue/workspace/code-exercise-timezone.json";
import branchCreation from "../shared/catalogue/workspace/branch-creation.json";
import teamMembers from "../shared/catalogue/workspace/team-members.json";
import documentationDay1 from "../shared/catalogue/workspace/documentation-day1.json";
import activitiesDay1 from "../shared/catalogue/workspace/activities-day1.json";
import activitiesDay2 from "../shared/catalogue/workspace/activities-day2.json";
import ticketTimezoneBug from "../shared/catalogue/workspace/ticket-timezone-bug.json";
import interviewConfig from "../shared/catalogue/interview/interview-config.json";
import questionBanks from "../shared/catalogue/interview/question-banks.json";
import evaluationRubrics from "../shared/catalogue/interview/evaluation-rubrics.json";
import teamPersonas from "../shared/catalogue/interview/team-personas.json";

async function seedCompetencies() {
  console.log("Seeding competencies...");
  
  for (const comp of competenciesData.competencies) {
    const existing = await db.select().from(competencies).where(eq(competencies.slug, comp.slug));
    
    const competencyData: InsertCompetency = {
      slug: comp.slug,
      name: comp.name,
      summary: comp.summary,
      category: comp.category,
      role: comp.role,
      rubric: comp.rubric,
      skills: comp.skills,
    };
    
    if (existing.length > 0) {
      await db.update(competencies)
        .set(competencyData)
        .where(eq(competencies.slug, comp.slug));
      console.log(`  Updated competency: ${comp.slug}`);
    } else {
      await db.insert(competencies).values(competencyData);
      console.log(`  Inserted competency: ${comp.slug}`);
    }
  }
  
  console.log(`Seeded ${competenciesData.competencies.length} competencies`);
}

async function seedRoleAdapters() {
  console.log("Seeding role adapters...");
  
  for (const adapter of roleAdaptersData.adapters) {
    const existing = await db.select().from(roleAdapters).where(eq(roleAdapters.role, adapter.role));
    
    const adapterData: InsertRoleAdapter = {
      role: adapter.role,
      displayName: adapter.displayName,
      description: adapter.description,
      levels: adapter.levels,
      languageOverrides: (adapter as any).languageOverrides || null,
      simulatorSettings: adapter.simulatorSettings,
      metadata: null,
    };
    
    if (existing.length > 0) {
      await db.update(roleAdapters)
        .set(adapterData)
        .where(eq(roleAdapters.role, adapter.role));
      console.log(`  Updated role adapter: ${adapter.role}`);
    } else {
      await db.insert(roleAdapters).values(adapterData);
      console.log(`  Inserted role adapter: ${adapter.role}`);
    }
  }
  
  console.log(`Seeded ${roleAdaptersData.adapters.length} role adapters`);
}

interface CatalogueFile {
  version: string;
  type: string;
  description?: string;
  metadata?: {
    role?: string;
    language?: string;
    day?: number;
    level?: string;
  };
  content: Record<string, unknown>;
}

function getCatalogueItems(): { id: string; file: CatalogueFile; simulator: string; title: string; competencies?: string[] }[] {
  return [
    { 
      id: "workspace-standup-day2", 
      file: standupScript as CatalogueFile, 
      simulator: "workspace",
      title: "Day 2 Daily Standup",
      competencies: ["communication", "time-management"]
    },
    { 
      id: "workspace-dev-setup-day2", 
      file: devSetupSteps as CatalogueFile, 
      simulator: "workspace",
      title: "Development Environment Setup",
      competencies: ["codebase-navigation"]
    },
    { 
      id: "workspace-git-workflow-day2", 
      file: gitWorkflowSteps as CatalogueFile, 
      simulator: "workspace",
      title: "Git Workflow Commands",
      competencies: ["git-workflow"]
    },
    { 
      id: "workspace-codebase-structure", 
      file: codebaseStructure as CatalogueFile, 
      simulator: "workspace",
      title: "Codebase Structure Exploration",
      competencies: ["codebase-navigation"]
    },
    { 
      id: "workspace-code-exercise-timezone", 
      file: codeExercise as CatalogueFile, 
      simulator: "workspace",
      title: "Timezone Bug Fix Exercise",
      competencies: ["debugging", "problem-solving"]
    },
    { 
      id: "workspace-branch-creation", 
      file: branchCreation as CatalogueFile, 
      simulator: "workspace",
      title: "Git Branch Creation",
      competencies: ["git-workflow"]
    },
    { 
      id: "workspace-team-members", 
      file: teamMembers as CatalogueFile, 
      simulator: "workspace",
      title: "Team Members Configuration"
    },
    { 
      id: "workspace-documentation-day1", 
      file: documentationDay1 as CatalogueFile, 
      simulator: "workspace",
      title: "Day 1 Onboarding Documentation",
      competencies: ["codebase-navigation", "communication"]
    },
    { 
      id: "workspace-activities-day1", 
      file: activitiesDay1 as CatalogueFile, 
      simulator: "workspace",
      title: "Day 1 Activities"
    },
    { 
      id: "workspace-activities-day2", 
      file: activitiesDay2 as CatalogueFile, 
      simulator: "workspace",
      title: "Day 2 Activities"
    },
    { 
      id: "workspace-ticket-timezone-bug", 
      file: ticketTimezoneBug as CatalogueFile, 
      simulator: "workspace",
      title: "Timezone Bug Ticket",
      competencies: ["debugging", "problem-solving"]
    },
    { 
      id: "interview-configuration", 
      file: interviewConfig as CatalogueFile, 
      simulator: "interview",
      title: "Interview Configuration"
    },
    { 
      id: "interview-question-banks", 
      file: questionBanks as CatalogueFile, 
      simulator: "interview",
      title: "Interview Question Banks",
      competencies: ["communication", "problem-solving"]
    },
    { 
      id: "interview-evaluation-rubrics", 
      file: evaluationRubrics as CatalogueFile, 
      simulator: "interview",
      title: "Interview Evaluation Rubrics"
    },
    { 
      id: "interview-team-personas", 
      file: teamPersonas as CatalogueFile, 
      simulator: "interview",
      title: "Interview Team Personas"
    },
  ];
}

async function seedSimulationCatalogue() {
  console.log("Seeding simulation catalogue...");
  
  const items = getCatalogueItems();
  
  for (const item of items) {
    const existing = await db.select().from(simulationCatalogue).where(eq(simulationCatalogue.externalId, item.id));
    
    const catalogueData: InsertSimulationCatalogue = {
      externalId: item.id,
      type: item.file.type,
      simulator: item.simulator,
      role: item.file.metadata?.role || null,
      level: item.file.metadata?.level || null,
      language: item.file.metadata?.language || null,
      day: item.file.metadata?.day || null,
      version: item.file.version,
      title: item.title,
      summary: item.file.description || null,
      content: item.file.content,
      competencySlugs: item.competencies || null,
    };
    
    if (existing.length > 0) {
      await db.update(simulationCatalogue)
        .set(catalogueData)
        .where(eq(simulationCatalogue.externalId, item.id));
      console.log(`  Updated catalogue item: ${item.id}`);
    } else {
      await db.insert(simulationCatalogue).values(catalogueData);
      console.log(`  Inserted catalogue item: ${item.id}`);
    }
  }
  
  console.log(`Seeded ${items.length} catalogue items`);
}

export async function seedPhase1Data() {
  console.log("\n=== Phase 1 Data Seeding ===\n");
  
  try {
    await seedCompetencies();
    console.log("");
    await seedRoleAdapters();
    console.log("");
    await seedSimulationCatalogue();
    console.log("\n=== Phase 1 Seeding Complete ===\n");
  } catch (error) {
    console.error("Error seeding Phase 1 data:", error);
    throw error;
  }
}

import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedPhase1Data()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
