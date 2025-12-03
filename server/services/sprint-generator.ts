import {
  BugTemplate,
  FeatureTemplate,
  SoftSkillTemplate,
  ProblemTemplate,
  SprintTheme,
  GeneratedSprintBacklog,
  TemplateDifficulty,
  MasteryBand,
  SprintGenerationRequest,
} from "@shared/schema";
import fs from "fs";
import path from "path";

const TEMPLATES_BASE_PATH = path.join(process.cwd(), "shared/catalogue/templates");

interface TemplateIndex {
  version: string;
  templates: {
    bugs: Array<{ id: string; file: string; name: string; difficulty: string[] }>;
    features: Array<{ id: string; file: string; name: string; difficulty: string[] }>;
    soft_skills: Array<{ id: string; file: string; name: string; skillType: string }>;
  };
  themes: Array<{
    id: string;
    name: string;
    description: string;
    suggestedTemplates: {
      bugs: string[];
      features: string[];
      softSkills: string[];
    };
  }>;
}

export class SprintGenerator {
  private templateIndex: TemplateIndex | null = null;
  private templateCache: Map<string, ProblemTemplate> = new Map();
  private themeCache: Map<string, SprintTheme> = new Map();

  constructor() {
    this.loadIndex();
  }

  private loadIndex(): void {
    try {
      const indexPath = path.join(TEMPLATES_BASE_PATH, "index.json");
      const indexContent = fs.readFileSync(indexPath, "utf-8");
      this.templateIndex = JSON.parse(indexContent);
      
      if (this.templateIndex?.themes) {
        for (const theme of this.templateIndex.themes) {
          this.themeCache.set(theme.id, {
            id: theme.id,
            name: theme.name,
            description: theme.description,
            industries: [],
            suggestedTemplates: theme.suggestedTemplates,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load template index:", error);
      this.templateIndex = null;
    }
  }

  private loadTemplate(category: 'bugs' | 'features' | 'soft_skills', id: string): ProblemTemplate | null {
    const cacheKey = `${category}:${id}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    if (!this.templateIndex) return null;

    const categoryTemplates = this.templateIndex.templates[category];
    const templateMeta = categoryTemplates.find(t => t.id === id);
    
    if (!templateMeta) return null;

    try {
      const templatePath = path.join(TEMPLATES_BASE_PATH, templateMeta.file);
      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const template = JSON.parse(templateContent) as ProblemTemplate;
      this.templateCache.set(cacheKey, template);
      return template;
    } catch (error) {
      console.error(`Failed to load template ${id}:`, error);
      return null;
    }
  }

  getAvailableThemes(): SprintTheme[] {
    return Array.from(this.themeCache.values());
  }

  getTheme(themeId: string): SprintTheme | null {
    return this.themeCache.get(themeId) || null;
  }

  getTemplatesByDifficulty(masteryBand: MasteryBand): {
    bugs: string[];
    features: string[];
    softSkills: string[];
  } {
    if (!this.templateIndex) {
      return { bugs: [], features: [], softSkills: [] };
    }

    const difficultyMap: Record<MasteryBand, TemplateDifficulty[]> = {
      explorer: ["guided"],
      contributor: ["guided", "supported"],
      junior_ready: ["supported", "independent"],
    };

    const targetDifficulties = difficultyMap[masteryBand];

    const bugs = this.templateIndex.templates.bugs
      .filter(t => t.difficulty.some(d => targetDifficulties.includes(d as TemplateDifficulty)))
      .map(t => t.id);

    const features = this.templateIndex.templates.features
      .filter(t => t.difficulty.some(d => targetDifficulties.includes(d as TemplateDifficulty)))
      .map(t => t.id);

    const softSkills = this.templateIndex.templates.soft_skills.map(t => t.id);

    return { bugs, features, softSkills };
  }

  private mapMasteryBandToTemplateDifficulty(band: MasteryBand): TemplateDifficulty {
    const mapping: Record<MasteryBand, TemplateDifficulty> = {
      explorer: "guided",
      contributor: "supported",
      junior_ready: "independent",
    };
    return mapping[band];
  }

  private difficultyBandToMasteryBand(difficultyBand: TemplateDifficulty): MasteryBand {
    const mapping: Record<TemplateDifficulty, MasteryBand> = {
      guided: "explorer",
      supported: "contributor",
      independent: "junior_ready",
      expert: "junior_ready",
    };
    return mapping[difficultyBand];
  }

  private validateContextVariables(
    template: string,
    context: Record<string, string>
  ): { isValid: boolean; missingVars: string[] } {
    const placeholderRegex = /\{([^}]+)\}/g;
    const missingVars: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(template)) !== null) {
      const varName = match[1];
      if (!context[varName] && varName !== 'Feature') {
        missingVars.push(varName);
      }
    }
    
    return { isValid: missingVars.length === 0, missingVars };
  }

  private applyContextVariables(
    template: string,
    context: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      const placeholder = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(placeholder, value);
    }
    
    result = result.replace(/\{([^}]+)\}/g, (match, varName) => {
      console.warn(`Missing context variable: ${varName}, using placeholder`);
      return `[${varName}]`;
    });
    
    return result;
  }

  private selectContextValues(
    template: ProblemTemplate,
    industry: string = "saas"
  ): Record<string, string> {
    const context: Record<string, string> = {};
    
    for (const variable of template.contextVariables) {
      const example = variable.examples[industry] || Object.values(variable.examples)[0];
      context[variable.key] = example;
    }
    
    return context;
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async generateSprint(request: SprintGenerationRequest): Promise<GeneratedSprintBacklog> {
    const theme = this.selectTheme(request);
    const masteryBand = this.difficultyBandToMasteryBand(request.difficultyBand);
    const availableTemplates = this.getTemplatesByDifficulty(masteryBand);
    
    const themeConfig = this.themeCache.get(theme.id);
    let bugPool = themeConfig?.suggestedTemplates.bugs || availableTemplates.bugs;
    let featurePool = themeConfig?.suggestedTemplates.features || availableTemplates.features;
    let softSkillPool = themeConfig?.suggestedTemplates.softSkills || availableTemplates.softSkills;

    const usedTemplatesFromPreviousSprints = this.extractUsedTemplates(request.previousSprints);
    
    bugPool = bugPool.filter(id => 
      !request.avoidTemplates.includes(id) && 
      !usedTemplatesFromPreviousSprints.includes(id)
    );
    featurePool = featurePool.filter(id => 
      !request.avoidTemplates.includes(id) && 
      !usedTemplatesFromPreviousSprints.includes(id)
    );
    softSkillPool = softSkillPool.filter(id => 
      !request.avoidTemplates.includes(id) &&
      !usedTemplatesFromPreviousSprints.includes(id)
    );

    if (request.userCompetencyGaps.length > 0) {
      bugPool = this.prioritizeByCompetencyGaps(bugPool, 'bugs', request.userCompetencyGaps);
      featurePool = this.prioritizeByCompetencyGaps(featurePool, 'features', request.userCompetencyGaps);
    }

    if (bugPool.length === 0) {
      console.warn("No bugs available after filtering, using all bugs for mastery band");
      bugPool = availableTemplates.bugs;
    }
    if (featurePool.length === 0) {
      console.warn("No features available after filtering, using all features for mastery band");
      featurePool = availableTemplates.features;
    }
    if (softSkillPool.length === 0) {
      console.warn("No soft skills available after filtering, using all soft skills");
      softSkillPool = this.getAllTemplateIds().softSkills;
    }

    const targetBugCount = Math.min(2, bugPool.length);
    const targetFeatureCount = Math.min(1, featurePool.length);
    const targetSoftSkillCount = Math.min(2, softSkillPool.length);

    const selectedBugs = this.selectRandomItems(bugPool, targetBugCount);
    const selectedFeatures = this.selectRandomItems(featurePool, targetFeatureCount);
    const selectedSoftSkills = this.selectRandomItems(softSkillPool, targetSoftSkillCount);

    const tickets = this.generateTickets(
      selectedBugs,
      selectedFeatures,
      request.difficultyBand
    );
    
    const softSkillEvents = this.generateSoftSkillEvents(selectedSoftSkills);
    const ceremonies = this.generateCeremonies(theme, tickets);

    const validatedBacklog = this.validateAndRepairBacklog({
      theme,
      tickets,
      softSkillEvents,
      ceremonies,
    }, request.difficultyBand);

    console.log(`Generated sprint for journey ${request.journeyId}: ${validatedBacklog.tickets.length} tickets, ${validatedBacklog.softSkillEvents.length} soft skill events`);

    return validatedBacklog;
  }

  private validateAndRepairBacklog(
    backlog: GeneratedSprintBacklog,
    difficultyBand: TemplateDifficulty
  ): GeneratedSprintBacklog {
    const validated = { ...backlog };
    const warnings: string[] = [];

    if (validated.tickets.length === 0) {
      warnings.push("No tickets generated - adding fallback ticket");
      validated.tickets = [{
        templateId: "fallback-bug",
        type: "bug",
        day: 1,
        appliedContext: {},
        generatedTicket: {
          title: "Review and fix console warnings",
          description: "Check the browser console and server logs for any warnings or non-critical errors. Document and address the most common issues.",
          acceptanceCriteria: [
            "Identify at least 3 console warnings",
            "Fix or document each warning with a resolution plan",
            "Verify no new warnings are introduced"
          ],
          difficulty: this.mapMasteryBandToTemplateDifficulty(
            this.difficultyBandToMasteryBand(difficultyBand)
          ),
        },
      }];
    }

    for (const ticket of validated.tickets) {
      if (!ticket.generatedTicket) {
        warnings.push(`Ticket ${ticket.templateId} missing generatedTicket, creating default`);
        ticket.generatedTicket = {
          title: `Task: ${ticket.templateId}`,
          description: "Complete the assigned task as specified.",
          acceptanceCriteria: ["Task completed as described", "Code follows conventions"],
          difficulty: this.mapMasteryBandToTemplateDifficulty(
            this.difficultyBandToMasteryBand(difficultyBand)
          ),
        };
      }
      
      if (!ticket.generatedTicket.title) {
        warnings.push(`Ticket ${ticket.templateId} has missing title`);
        ticket.generatedTicket.title = `Task: ${ticket.templateId}`;
      } else if (ticket.generatedTicket.title.includes('[')) {
        warnings.push(`Ticket ${ticket.templateId} has incomplete title`);
        ticket.generatedTicket.title = ticket.generatedTicket.title.replace(/\[([^\]]+)\]/g, 'the $1');
      }
      
      if (!ticket.generatedTicket.description || ticket.generatedTicket.description.length < 10) {
        warnings.push(`Ticket ${ticket.templateId} has missing/short description`);
        ticket.generatedTicket.description = ticket.generatedTicket.description || 
          `Complete the task as described in the title: ${ticket.generatedTicket.title}`;
      }
      
      if (!ticket.generatedTicket.acceptanceCriteria?.length) {
        warnings.push(`Ticket ${ticket.templateId} missing acceptance criteria`);
        ticket.generatedTicket.acceptanceCriteria = [
          "Task is completed as described",
          "Code is clean and follows project conventions",
          "Changes are tested"
        ];
      }
    }

    for (const event of validated.softSkillEvents) {
      if (!event.generatedScenario) {
        warnings.push(`Soft skill event ${event.templateId} missing generatedScenario, creating default`);
        event.generatedScenario = {
          setup: "A team member needs your input.",
          message: "Hey, got a moment to help with something?",
          sender: "Team Member",
          senderRole: "Developer",
        };
      }
      
      if (!event.generatedScenario.message) {
        warnings.push(`Soft skill event ${event.templateId} has missing message`);
        event.generatedScenario.message = "Hey, got a moment to help with something?";
      } else if (event.generatedScenario.message.includes('[')) {
        warnings.push(`Soft skill event ${event.templateId} has incomplete message`);
        event.generatedScenario.message = event.generatedScenario.message.replace(/\[([^\]]+)\]/g, 'the $1');
      }
    }

    if (!validated.ceremonies?.planning?.script?.length) {
      warnings.push("Missing planning ceremony, using fallback");
      validated.ceremonies = validated.ceremonies || {} as any;
      validated.ceremonies.planning = {
        day: 1,
        script: [
          "Welcome to Sprint Planning!",
          "Let's review what we'll be working on this sprint.",
          `We have ${validated.tickets.length} tickets to discuss.`,
          "Let's estimate and commit to our goals."
        ]
      };
    }

    if (warnings.length > 0) {
      console.warn(`Sprint generation warnings:\n${warnings.join('\n')}`);
    }

    return validated;
  }

  private extractUsedTemplates(previousSprints: SprintGenerationRequest['previousSprints']): string[] {
    const usedTemplates: string[] = [];
    
    for (const sprint of previousSprints) {
      try {
        const metadata = sprint.generationMetadata as any;
        if (metadata?.usedTemplateIds && Array.isArray(metadata.usedTemplateIds)) {
          usedTemplates.push(...metadata.usedTemplateIds);
        }
      } catch (e) {
        continue;
      }
    }
    
    return usedTemplates;
  }

  private prioritizeByCompetencyGaps(
    templateIds: string[],
    category: 'bugs' | 'features',
    gaps: string[]
  ): string[] {
    const prioritized: { id: string; priority: number }[] = [];
    
    for (const id of templateIds) {
      const template = this.loadTemplate(category, id);
      if (!template) continue;
      
      const matchingCompetencies = template.competencies.filter(c => 
        gaps.some(gap => c.toLowerCase().includes(gap.toLowerCase()))
      );
      
      prioritized.push({
        id,
        priority: matchingCompetencies.length,
      });
    }
    
    prioritized.sort((a, b) => b.priority - a.priority);
    return prioritized.map(p => p.id);
  }

  private selectTheme(request: SprintGenerationRequest): SprintTheme {
    const previousThemes = request.previousSprints
      .map(s => (s.generationMetadata as any)?.themeId || s.theme)
      .filter(Boolean);

    const availableThemes = Array.from(this.themeCache.values())
      .filter(t => !request.avoidThemes.includes(t.id))
      .filter(t => !previousThemes.includes(t.id));

    if (availableThemes.length === 0) {
      return Array.from(this.themeCache.values())[0] || {
        id: "default",
        name: "General Development",
        description: "A mix of development tasks",
        industries: [],
        suggestedTemplates: { bugs: [], features: [], softSkills: [] },
      };
    }

    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    return availableThemes[randomIndex];
  }

  private generateTickets(
    bugIds: string[],
    featureIds: string[],
    difficultyBand: TemplateDifficulty
  ): GeneratedSprintBacklog["tickets"] {
    const tickets: GeneratedSprintBacklog["tickets"] = [];
    const masteryBand = this.difficultyBandToMasteryBand(difficultyBand);
    const difficulty = this.mapMasteryBandToTemplateDifficulty(masteryBand);
    
    let day = 1;

    for (const bugId of bugIds) {
      const template = this.loadTemplate("bugs", bugId) as BugTemplate | null;
      if (!template) continue;

      const context = this.selectContextValues(template);
      
      tickets.push({
        templateId: bugId,
        type: "bug",
        day: day++,
        appliedContext: context,
        generatedTicket: {
          title: this.applyContextVariables(template.scenarioTemplate.ticketTitle, context),
          description: this.applyContextVariables(template.scenarioTemplate.ticketDescription, context),
          acceptanceCriteria: template.scenarioTemplate.acceptanceCriteria.map(
            ac => this.applyContextVariables(ac, context)
          ),
          difficulty,
        },
      });
    }

    for (const featureId of featureIds) {
      const template = this.loadTemplate("features", featureId) as FeatureTemplate | null;
      if (!template) continue;

      const context = this.selectContextValues(template);
      
      tickets.push({
        templateId: featureId,
        type: "feature",
        day: day++,
        appliedContext: context,
        generatedTicket: {
          title: this.applyContextVariables(template.scenarioTemplate.ticketTitle, context),
          description: this.applyContextVariables(template.scenarioTemplate.ticketDescription, context),
          acceptanceCriteria: template.scenarioTemplate.acceptanceCriteria.map(
            ac => this.applyContextVariables(ac, context)
          ),
          difficulty,
        },
      });
    }

    return tickets;
  }

  private generateSoftSkillEvents(
    softSkillIds: string[]
  ): GeneratedSprintBacklog["softSkillEvents"] {
    const events: GeneratedSprintBacklog["softSkillEvents"] = [];

    for (let i = 0; i < softSkillIds.length; i++) {
      const template = this.loadTemplate("soft_skills", softSkillIds[i]) as SoftSkillTemplate | null;
      if (!template) continue;

      const context = this.selectContextValues(template);
      
      events.push({
        templateId: softSkillIds[i],
        day: i + 2,
        trigger: template.trigger,
        appliedContext: context,
        generatedScenario: {
          setup: this.applyContextVariables(template.scenarioTemplate.setup, context),
          message: this.applyContextVariables(template.scenarioTemplate.message, context),
          sender: this.applyContextVariables(template.scenarioTemplate.sender, context),
          senderRole: template.scenarioTemplate.senderRole,
        },
      });
    }

    return events;
  }

  private generateCeremonies(
    theme: SprintTheme,
    tickets: GeneratedSprintBacklog["tickets"]
  ): GeneratedSprintBacklog["ceremonies"] {
    const ticketSummary = tickets.map(t => t.generatedTicket.title).join(", ");
    
    return {
      planning: {
        day: 1,
        script: [
          `Welcome to Sprint Planning! This sprint we're focusing on ${theme.name}.`,
          `Our main focus: ${theme.description}`,
          `We have ${tickets.length} tickets in the backlog: ${ticketSummary}`,
          "Let's estimate and commit to what we can deliver this sprint.",
          "Any questions before we dive in?",
        ],
      },
      standups: [
        {
          day: 2,
          script: [
            "Good morning! Let's do our daily standup.",
            "Yesterday: Sprint kicked off, planning completed.",
            `Today: Working on ${tickets[0]?.generatedTicket.title || "first ticket"}.`,
            "Blockers: None so far.",
          ],
        },
        {
          day: 3,
          script: [
            "Standup time! How's everyone doing?",
            "Progress check on current tickets.",
            "Any blockers or concerns?",
          ],
        },
        {
          day: 4,
          script: [
            "Almost end of sprint! Final standup.",
            "Let's make sure we're on track for the demo.",
            "Any last-minute issues?",
          ],
        },
      ],
      review: {
        day: 5,
        script: [
          "Welcome to Sprint Review!",
          `This sprint we focused on ${theme.name}.`,
          "Let's demo what we've accomplished.",
          "Stakeholders, feel free to ask questions.",
          "Great work team!",
        ],
      },
      retro: {
        day: 5,
        script: [
          "Time for our Retrospective!",
          "What went well this sprint?",
          "What could we improve?",
          "Any action items for next sprint?",
          "Thanks for the honest feedback!",
        ],
      },
    };
  }

  getTemplateDetails(category: 'bugs' | 'features' | 'soft_skills', id: string): ProblemTemplate | null {
    return this.loadTemplate(category, id);
  }

  getAllTemplateIds(): {
    bugs: string[];
    features: string[];
    softSkills: string[];
  } {
    if (!this.templateIndex) {
      return { bugs: [], features: [], softSkills: [] };
    }

    return {
      bugs: this.templateIndex.templates.bugs.map(t => t.id),
      features: this.templateIndex.templates.features.map(t => t.id),
      softSkills: this.templateIndex.templates.soft_skills.map(t => t.id),
    };
  }

  getTemplateStats(): {
    totalBugs: number;
    totalFeatures: number;
    totalSoftSkills: number;
    totalThemes: number;
  } {
    if (!this.templateIndex) {
      return { totalBugs: 0, totalFeatures: 0, totalSoftSkills: 0, totalThemes: 0 };
    }

    return {
      totalBugs: this.templateIndex.templates.bugs.length,
      totalFeatures: this.templateIndex.templates.features.length,
      totalSoftSkills: this.templateIndex.templates.soft_skills.length,
      totalThemes: this.templateIndex.themes.length,
    };
  }
}

export const sprintGenerator = new SprintGenerator();
