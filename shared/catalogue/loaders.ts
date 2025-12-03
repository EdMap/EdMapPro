import { z } from "zod";

// ============================================================================
// WORKSPACE CATALOGUE SCHEMAS
// ============================================================================

export const TeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  personality: z.string(),
  expertise: z.array(z.string()),
  availability: z.string(),
  bio: z.string().optional(),
  avatar: z.object({
    seed: z.string(),
    style: z.string(),
    backgroundColor: z.string()
  })
});

export const StandupMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.string(),
  content: z.string(),
  delay: z.number(),
  order: z.number(),
  isUserCue: z.boolean().optional(),
  placeholder: z.string().optional()
});

export const StandupScriptSchema = z.object({
  version: z.string(),
  type: z.literal("standup_script"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string()
  }),
  content: z.object({
    meeting: z.object({
      name: z.string(),
      team: z.string(),
      time: z.string(),
      format: z.string()
    }),
    script: z.array(StandupMessageSchema),
    userGuidance: z.object({
      promptAfterScript: z.string(),
      exampleUpdates: z.array(z.string()),
      tips: z.array(z.string())
    })
  })
});

export const SetupStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  instruction: z.string(),
  hint: z.string(),
  validPatterns: z.array(z.string()),
  validationRules: z.object({
    mustInclude: z.array(z.string()).optional(),
    mustIncludeAny: z.array(z.string()).optional(),
    exactMatch: z.array(z.string()).optional()
  }),
  successOutput: z.string(),
  acceptedCommands: z.array(z.string())
});

export const DevSetupStepsSchema = z.object({
  version: z.string(),
  type: z.literal("dev_setup_steps"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string()
  }),
  content: z.object({
    introduction: z.object({
      title: z.string(),
      description: z.string()
    }),
    project: z.object({
      name: z.string(),
      org: z.string(),
      repoUrl: z.string()
    }),
    steps: z.array(SetupStepSchema)
  })
});

export const GitStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  instruction: z.string(),
  hint: z.string(),
  validPatterns: z.array(z.string()),
  validationRules: z.object({
    mustStartWith: z.array(z.string()).optional(),
    mustContainAnyQuote: z.array(z.string()).optional(),
    mustContainAnyKeyword: z.array(z.string()).optional()
  }),
  successOutput: z.string(),
  acceptedCommands: z.array(z.string())
});

export const GitWorkflowStepsSchema = z.object({
  version: z.string(),
  type: z.literal("git_workflow_steps"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string()
  }),
  content: z.object({
    introduction: z.object({
      title: z.string(),
      description: z.string()
    }),
    steps: z.array(GitStepSchema)
  })
});

export const FileNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(["folder", "file"]),
    highlight: z.boolean().optional(),
    target: z.boolean().optional(),
    children: z.array(FileNodeSchema).optional()
  })
);

export const CodebaseStructureSchema = z.object({
  version: z.string(),
  type: z.literal("codebase_structure"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string()
  }),
  content: z.object({
    introduction: z.object({
      title: z.string(),
      description: z.string()
    }),
    targetFile: z.object({
      name: z.string(),
      path: z.string(),
      description: z.string()
    }),
    fileStructure: z.array(FileNodeSchema)
  })
});

export const CodeBlankSchema = z.object({
  id: z.string(),
  placeholder: z.string(),
  correctAnswer: z.string(),
  hint: z.string(),
  caseSensitive: z.boolean()
});

export const CodeExerciseSchema = z.object({
  version: z.string(),
  type: z.literal("code_exercise"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string(),
    ticketId: z.string()
  }),
  content: z.object({
    introduction: z.object({
      title: z.string(),
      description: z.string()
    }),
    file: z.object({
      path: z.string(),
      name: z.string()
    }),
    codeTemplate: z.object({
      language: z.string(),
      code: z.string()
    }),
    blanks: z.array(CodeBlankSchema),
    testScenario: z.object({
      title: z.string(),
      description: z.string(),
      beforeFix: z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string()
      }),
      afterFix: z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string()
      })
    })
  })
});

export const BranchCreationSchema = z.object({
  version: z.string(),
  type: z.literal("branch_creation"),
  metadata: z.object({
    day: z.number(),
    role: z.string(),
    language: z.string()
  }),
  content: z.object({
    introduction: z.object({
      title: z.string(),
      description: z.string()
    }),
    whyBranch: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string()
    })),
    namingConvention: z.object({
      pattern: z.string(),
      examples: z.array(z.object({
        name: z.string(),
        description: z.string()
      })),
      badExamples: z.array(z.object({
        name: z.string(),
        reason: z.string()
      }))
    }),
    validation: z.object({
      validPrefixes: z.array(z.string()),
      mustContainKeywords: z.array(z.string()),
      minLength: z.number(),
      maxLength: z.number(),
      regex: z.string()
    }),
    successMessage: z.object({
      title: z.string(),
      description: z.string()
    })
  })
});

// ============================================================================
// INTERVIEW CATALOGUE SCHEMAS
// ============================================================================

export const InterviewQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  followUps: z.array(z.string()).optional(),
  evaluationCriteria: z.array(z.string()).optional(),
  timeEstimate: z.string().optional()
});

export const QuestionBanksSchema = z.object({
  version: z.string(),
  type: z.literal("question_bank"),
  metadata: z.object({
    lastUpdated: z.string(),
    totalQuestions: z.number()
  }),
  content: z.object({
    roles: z.record(z.object({
      types: z.record(z.record(z.array(InterviewQuestionSchema)))
    }))
  })
});

export const InterviewPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  title: z.string(),
  personality: z.string(),
  focusAreas: z.array(z.string()),
  style: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    borderColor: z.string(),
    iconColor: z.string()
  }),
  promptGuidance: z.object({
    tone: z.string(),
    priorities: z.array(z.string()),
    avoidTopics: z.array(z.string()).optional()
  })
});

export const TeamPersonasSchema = z.object({
  version: z.string(),
  type: z.literal("team_personas"),
  metadata: z.object({
    lastUpdated: z.string()
  }),
  content: z.object({
    personas: z.record(InterviewPersonaSchema),
    teamConfigurations: z.record(z.object({
      name: z.string(),
      description: z.string(),
      personas: z.array(z.string()),
      interviewFlow: z.object({
        introduction: z.string(),
        questionDistribution: z.record(z.number()),
        transitions: z.record(z.string())
      })
    }))
  })
});

export const EvaluationRubricsSchema = z.object({
  version: z.string(),
  type: z.literal("evaluation_rubrics"),
  metadata: z.object({
    lastUpdated: z.string()
  }),
  content: z.object({
    scoringScale: z.object({
      min: z.number(),
      max: z.number(),
      labels: z.record(z.string())
    }),
    evaluationDimensions: z.record(z.object({
      name: z.string(),
      weight: z.number(),
      criteria: z.array(z.object({
        level: z.number(),
        description: z.string()
      }))
    })),
    finalReportStructure: z.object({
      sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        type: z.string()
      }))
    })
  })
});

export const InterviewConfigSchema = z.object({
  version: z.string(),
  type: z.literal("interview_configuration"),
  metadata: z.object({
    lastUpdated: z.string()
  }),
  content: z.object({
    targetRoles: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string()
    })),
    interviewTypes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
      questionTypes: z.array(z.string())
    })),
    difficulties: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string()
    })),
    stageSettings: z.record(z.object({
      name: z.string(),
      durationMinutes: z.number().optional(),
      instructions: z.string().optional()
    }))
  })
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type StandupMessage = z.infer<typeof StandupMessageSchema>;
export type StandupScript = z.infer<typeof StandupScriptSchema>;
export type SetupStep = z.infer<typeof SetupStepSchema>;
export type DevSetupSteps = z.infer<typeof DevSetupStepsSchema>;
export type GitStep = z.infer<typeof GitStepSchema>;
export type GitWorkflowSteps = z.infer<typeof GitWorkflowStepsSchema>;
export type FileNode = z.infer<typeof FileNodeSchema>;
export type CodebaseStructure = z.infer<typeof CodebaseStructureSchema>;
export type CodeBlank = z.infer<typeof CodeBlankSchema>;
export type CodeExercise = z.infer<typeof CodeExerciseSchema>;
export type BranchCreation = z.infer<typeof BranchCreationSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type QuestionBanks = z.infer<typeof QuestionBanksSchema>;
export type InterviewPersona = z.infer<typeof InterviewPersonaSchema>;
export type TeamPersonas = z.infer<typeof TeamPersonasSchema>;
export type EvaluationRubrics = z.infer<typeof EvaluationRubricsSchema>;
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateSetupCommand(input: string, step: SetupStep): boolean {
  const normalized = input.trim().toLowerCase();
  
  if (step.validationRules.exactMatch) {
    return step.validationRules.exactMatch.some(cmd => 
      normalized === cmd.toLowerCase()
    );
  }
  
  if (step.validationRules.mustInclude) {
    const allContained = step.validationRules.mustInclude.every(term =>
      normalized.includes(term.toLowerCase())
    );
    if (!allContained) return false;
  }
  
  if (step.validationRules.mustIncludeAny) {
    const anyContained = step.validationRules.mustIncludeAny.some(term =>
      normalized.includes(term.toLowerCase())
    );
    if (!anyContained) return false;
  }
  
  if (step.validPatterns && step.validPatterns.length > 0) {
    return step.validPatterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(input.trim());
      } catch {
        return false;
      }
    });
  }
  
  return true;
}

export function validateGitCommand(input: string, step: GitStep): boolean {
  const normalized = input.trim().toLowerCase();
  const original = input.trim();
  
  if (step.validationRules.mustStartWith) {
    const startsCorrectly = step.validationRules.mustStartWith.some(prefix =>
      normalized.startsWith(prefix.toLowerCase())
    );
    if (!startsCorrectly) return false;
  }
  
  if (step.validationRules.mustContainAnyQuote) {
    const hasQuote = step.validationRules.mustContainAnyQuote.some(q =>
      original.includes(q)
    );
    if (!hasQuote) return false;
  }
  
  if (step.validationRules.mustContainAnyKeyword) {
    const hasKeyword = step.validationRules.mustContainAnyKeyword.some(kw =>
      normalized.includes(kw.toLowerCase())
    );
    if (!hasKeyword) return false;
  }
  
  if (step.validPatterns && step.validPatterns.length > 0) {
    return step.validPatterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(original);
      } catch {
        return false;
      }
    });
  }
  
  return true;
}

export function validateBranchName(name: string, validation: BranchCreation['content']['validation']): { valid: boolean; error?: string } {
  const trimmed = name.trim().toLowerCase();
  
  if (trimmed.length < validation.minLength) {
    return { valid: false, error: `Branch name must be at least ${validation.minLength} characters` };
  }
  
  if (trimmed.length > validation.maxLength) {
    return { valid: false, error: `Branch name must be at most ${validation.maxLength} characters` };
  }
  
  const hasValidPrefix = validation.validPrefixes.some(prefix =>
    trimmed.startsWith(prefix.toLowerCase())
  );
  if (!hasValidPrefix) {
    return { valid: false, error: `Branch name must start with one of: ${validation.validPrefixes.join(', ')}` };
  }
  
  const hasKeyword = validation.mustContainKeywords.some(kw =>
    trimmed.includes(kw.toLowerCase())
  );
  if (!hasKeyword) {
    return { valid: false, error: `Branch name should relate to the ticket (timezone, date, etc.)` };
  }
  
  try {
    const regex = new RegExp(validation.regex);
    if (!regex.test(trimmed)) {
      return { valid: false, error: 'Branch name contains invalid characters' };
    }
  } catch {
    // If regex is invalid, skip this check
  }
  
  return { valid: true };
}

export function validateCodeBlank(input: string, blank: CodeBlank): boolean {
  const trimmed = input.trim();
  const answer = blank.correctAnswer;
  
  if (blank.caseSensitive) {
    return trimmed === answer;
  }
  return trimmed.toLowerCase() === answer.toLowerCase();
}

// ============================================================================
// ADAPTER HELPERS
// ============================================================================

export function getQuestionsForRoleAndLevel(
  questionBanks: QuestionBanks,
  role: string,
  questionType: string,
  level: string
): InterviewQuestion[] {
  const roleData = questionBanks.content.roles[role];
  if (!roleData) return [];
  
  const typeData = roleData.types[questionType];
  if (!typeData) return [];
  
  return typeData[level] || [];
}

export function getPersonaById(
  teamPersonas: TeamPersonas,
  personaId: string
): InterviewPersona | undefined {
  return teamPersonas.content.personas[personaId];
}

export function getTeamConfiguration(
  teamPersonas: TeamPersonas,
  configId: string
) {
  return teamPersonas.content.teamConfigurations[configId];
}

export function getAvatarUrl(member: TeamMember): string {
  const { seed, style, backgroundColor } = member.avatar;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${backgroundColor}`;
}

export function getTeamMemberColor(name: string): string {
  const colors: Record<string, string> = {
    'Sarah': 'bg-blue-500',
    'Marcus': 'bg-green-500',
    'Priya': 'bg-purple-500',
    'Alex': 'bg-orange-500',
    'Jordan': 'bg-teal-500'
  };
  return colors[name] || 'bg-gray-500';
}

export function getTeamMemberInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function interpolateUserName(content: string, userName: string): string {
  return content.replace(/\{userName\}/g, userName);
}
