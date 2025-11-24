import { 
  users, simulationSessions, userProgress,
  workspaceProjects, workspaceRoles, workspaceArtifacts, workspaceTasks, workspaceInteractions, workspaceEvaluations,
  type User, type InsertUser, type SimulationSession, type InsertSimulationSession, type UserProgress, type InsertUserProgress,
  type WorkspaceProject, type InsertWorkspaceProject,
  type WorkspaceRole, type InsertWorkspaceRole,
  type WorkspaceArtifact, type InsertWorkspaceArtifact,
  type WorkspaceTask, type InsertWorkspaceTask,
  type WorkspaceInteraction, type InsertWorkspaceInteraction,
  type WorkspaceEvaluation, type InsertWorkspaceEvaluation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Simulation session operations
  getSimulationSession(id: number): Promise<SimulationSession | undefined>;
  getUserSimulationSessions(userId: number, type?: string): Promise<SimulationSession[]>;
  createSimulationSession(session: InsertSimulationSession): Promise<SimulationSession>;
  updateSimulationSession(id: number, updates: Partial<SimulationSession>): Promise<SimulationSession | undefined>;
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserProgressByType(userId: number, type: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, type: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined>;
  
  // Workspace project operations
  getWorkspaceProjects(): Promise<WorkspaceProject[]>;
  getWorkspaceProject(id: number): Promise<WorkspaceProject | undefined>;
  createWorkspaceProject(project: InsertWorkspaceProject): Promise<WorkspaceProject>;
  
  // Workspace role operations
  getWorkspaceRoles(): Promise<WorkspaceRole[]>;
  getWorkspaceRole(id: number): Promise<WorkspaceRole | undefined>;
  createWorkspaceRole(role: InsertWorkspaceRole): Promise<WorkspaceRole>;
  
  // Workspace artifact operations
  getWorkspaceArtifacts(sessionId: number): Promise<WorkspaceArtifact[]>;
  getWorkspaceArtifact(id: number): Promise<WorkspaceArtifact | undefined>;
  createWorkspaceArtifact(artifact: InsertWorkspaceArtifact): Promise<WorkspaceArtifact>;
  updateWorkspaceArtifact(id: number, updates: Partial<WorkspaceArtifact>): Promise<WorkspaceArtifact | undefined>;
  
  // Workspace task operations
  getWorkspaceTasks(sessionId: number): Promise<WorkspaceTask[]>;
  getWorkspaceTask(id: number): Promise<WorkspaceTask | undefined>;
  createWorkspaceTask(task: InsertWorkspaceTask): Promise<WorkspaceTask>;
  updateWorkspaceTask(id: number, updates: Partial<WorkspaceTask>): Promise<WorkspaceTask | undefined>;
  
  // Workspace interaction operations
  getWorkspaceInteractions(sessionId: number, channel?: string): Promise<WorkspaceInteraction[]>;
  createWorkspaceInteraction(interaction: InsertWorkspaceInteraction): Promise<WorkspaceInteraction>;
  
  // Workspace evaluation operations
  getWorkspaceEvaluations(sessionId: number): Promise<WorkspaceEvaluation[]>;
  createWorkspaceEvaluation(evaluation: InsertWorkspaceEvaluation): Promise<WorkspaceEvaluation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, SimulationSession>;
  private progress: Map<string, UserProgress>; // key: `${userId}-${type}`
  private workspaceProjects: Map<number, WorkspaceProject>;
  private workspaceRoles: Map<number, WorkspaceRole>;
  private workspaceArtifacts: Map<number, WorkspaceArtifact>;
  private workspaceTasks: Map<number, WorkspaceTask>;
  private workspaceInteractions: Map<number, WorkspaceInteraction>;
  private workspaceEvaluations: Map<number, WorkspaceEvaluation>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentProgressId: number;
  private currentProjectId: number;
  private currentRoleId: number;
  private currentArtifactId: number;
  private currentTaskId: number;
  private currentInteractionId: number;
  private currentEvaluationId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.progress = new Map();
    this.workspaceProjects = new Map();
    this.workspaceRoles = new Map();
    this.workspaceArtifacts = new Map();
    this.workspaceTasks = new Map();
    this.workspaceInteractions = new Map();
    this.workspaceEvaluations = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentProgressId = 1;
    this.currentProjectId = 1;
    this.currentRoleId = 1;
    this.currentArtifactId = 1;
    this.currentTaskId = 1;
    this.currentInteractionId = 1;
    this.currentEvaluationId = 1;
    
    // Create a default user
    this.createUser({
      username: "arsen",
      password: "password",
      email: "arsen@edmap.com",
      firstName: "Arsen",
      lastName: "User"
    });

    // Seed workspace data
    this.seedWorkspaceData();
  }

  private async seedWorkspaceData() {
    // Seed roles
    const roles = [
      {
        name: 'Developer',
        description: 'Build features, write code, and fix bugs',
        competencies: ['coding', 'problem-solving', 'technical-communication'],
        availableActions: ['write-code', 'review-code', 'create-ticket', 'update-task', 'ask-question'],
        evaluationCriteria: ['code-quality', 'technical-accuracy', 'collaboration', 'communication']
      },
      {
        name: 'Product Manager',
        description: 'Define requirements, prioritize features, and coordinate team',
        competencies: ['strategic-thinking', 'stakeholder-management', 'prioritization'],
        availableActions: ['create-ticket', 'prioritize-backlog', 'clarify-requirements', 'run-meeting'],
        evaluationCriteria: ['clarity', 'prioritization', 'stakeholder-communication', 'decision-making']
      },
      {
        name: 'Designer',
        description: 'Create designs, conduct user research, and ensure great UX',
        competencies: ['visual-design', 'user-research', 'prototyping'],
        availableActions: ['create-design', 'provide-feedback', 'conduct-research', 'update-design-system'],
        evaluationCriteria: ['design-quality', 'user-focus', 'collaboration', 'communication']
      },
      {
        name: 'QA Engineer',
        description: 'Write tests, find bugs, and ensure quality',
        competencies: ['testing', 'attention-to-detail', 'bug-reporting'],
        availableActions: ['write-test', 'report-bug', 'verify-fix', 'create-test-plan'],
        evaluationCriteria: ['test-coverage', 'bug-quality', 'thoroughness', 'communication']
      },
      {
        name: 'DevOps Engineer',
        description: 'Manage infrastructure, deployments, and system reliability',
        competencies: ['infrastructure', 'automation', 'monitoring'],
        availableActions: ['configure-deployment', 'monitor-systems', 'optimize-performance', 'fix-infrastructure'],
        evaluationCriteria: ['reliability', 'automation', 'security', 'problem-solving']
      }
    ];

    for (const role of roles) {
      await this.createWorkspaceRole(role);
    }

    // Seed projects
    const projects = [
      {
        name: 'Task Management App',
        description: 'Build a modern task management application for teams',
        category: 'web-app',
        teamStructure: [
          {
            name: 'Sarah',
            role: 'Developer',
            personality: 'experienced and helpful',
            expertise: ['React', 'Node.js', 'TypeScript'],
            availability: 'usually'
          },
          {
            name: 'Marcus',
            role: 'Product Manager',
            personality: 'strategic and detail-oriented',
            expertise: ['product-strategy', 'user-research', 'agile'],
            availability: 'usually'
          },
          {
            name: 'Elena',
            role: 'Designer',
            personality: 'creative and user-focused',
            expertise: ['UI-design', 'UX-research', 'prototyping'],
            availability: 'sometimes'
          },
          {
            name: 'Raj',
            role: 'QA Engineer',
            personality: 'thorough and analytical',
            expertise: ['automated-testing', 'manual-testing', 'bug-tracking'],
            availability: 'always'
          }
        ],
        requirements: {
          features: ['User authentication', 'Task creation and editing', 'Team collaboration', 'Deadline tracking'],
          techStack: ['React', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
          milestones: [
            { name: 'MVP Launch', deadline: '2 weeks', tasks: 8 },
            { name: 'Beta Release', deadline: '4 weeks', tasks: 12 }
          ]
        },
        scenarioScript: {
          events: [
            { trigger: 'task_3_complete', type: 'bug-report', from: 'Raj', severity: 'high' },
            { trigger: 'day_3', type: 'requirement-change', from: 'Marcus', impact: 'medium' },
            { trigger: 'review_requested', type: 'design-feedback', from: 'Elena', detail: 'positive' }
          ]
        },
        difficulty: 'mid',
        estimatedDuration: 45
      },
      {
        name: 'E-commerce Platform API',
        description: 'Design and build REST APIs for an e-commerce platform',
        category: 'api',
        teamStructure: [
          {
            name: 'David',
            role: 'Developer',
            personality: 'senior and mentoring',
            expertise: ['API-design', 'database-optimization', 'security'],
            availability: 'usually'
          },
          {
            name: 'Lisa',
            role: 'Product Manager',
            personality: 'business-focused and pragmatic',
            expertise: ['API-products', 'technical-specs', 'pricing'],
            availability: 'sometimes'
          },
          {
            name: 'Tom',
            role: 'DevOps Engineer',
            personality: 'security-conscious and systematic',
            expertise: ['cloud-infrastructure', 'CI-CD', 'monitoring'],
            availability: 'usually'
          }
        ],
        requirements: {
          features: ['Product catalog API', 'Order management', 'Payment integration', 'Admin dashboard'],
          techStack: ['Node.js', 'Express', 'MongoDB', 'Redis'],
          milestones: [
            { name: 'Core APIs', deadline: '2 weeks', tasks: 6 },
            { name: 'Integration', deadline: '3 weeks', tasks: 8 }
          ]
        },
        scenarioScript: null,
        difficulty: 'senior',
        estimatedDuration: 60
      },
      {
        name: 'Mobile Fitness App',
        description: 'Create a mobile fitness tracking application',
        category: 'mobile-app',
        teamStructure: [
          {
            name: 'Alex',
            role: 'Developer',
            personality: 'enthusiastic and fast-paced',
            expertise: ['React-Native', 'mobile-development', 'animations'],
            availability: 'always'
          },
          {
            name: 'Priya',
            role: 'Designer',
            personality: 'detail-oriented and empathetic',
            expertise: ['mobile-UI', 'micro-interactions', 'accessibility'],
            availability: 'usually'
          },
          {
            name: 'Jordan',
            role: 'Product Manager',
            personality: 'data-driven and collaborative',
            expertise: ['mobile-products', 'analytics', 'user-retention'],
            availability: 'usually'
          },
          {
            name: 'Sam',
            role: 'QA Engineer',
            personality: 'meticulous and patient',
            expertise: ['mobile-testing', 'device-testing', 'performance'],
            availability: 'usually'
          }
        ],
        requirements: {
          features: ['Workout tracking', 'Progress charts', 'Social features', 'Goal setting'],
          techStack: ['React Native', 'Firebase', 'TypeScript'],
          milestones: [
            { name: 'Core Features', deadline: '3 weeks', tasks: 10 },
            { name: 'Social Features', deadline: '5 weeks', tasks: 8 }
          ]
        },
        scenarioScript: null,
        difficulty: 'junior',
        estimatedDuration: 40
      },
      {
        name: 'PulseOps IQ - Executive Heatmap Feature',
        description: 'Enterprise incident analytics platform - Add executive incident heatmap and forecasting module',
        category: 'enterprise-feature',
        teamStructure: [
          {
            name: 'Claire',
            role: 'Product Manager',
            personality: 'strategic and stakeholder-focused',
            expertise: ['enterprise-products', 'analytics', 'SLA-management', 'roadmap-planning'],
            availability: 'usually'
          },
          {
            name: 'Ravi',
            role: 'Developer',
            personality: 'architectural and thorough',
            expertise: ['TypeScript', 'API-design', 'data-aggregation', 'PostgreSQL', 'performance-optimization'],
            availability: 'always'
          },
          {
            name: 'Maya',
            role: 'Designer',
            personality: 'design-conscious and detail-oriented',
            expertise: ['data-visualization', 'design-systems', 'enterprise-UI', 'accessibility'],
            availability: 'usually'
          },
          {
            name: 'Jon',
            role: 'Data Scientist',
            personality: 'analytical and collaborative',
            expertise: ['forecasting-algorithms', 'statistical-analysis', 'trend-detection', 'data-validation'],
            availability: 'sometimes'
          },
          {
            name: 'Elena',
            role: 'QA Engineer',
            personality: 'methodical and regression-aware',
            expertise: ['test-automation', 'regression-testing', 'data-validation', 'integration-testing'],
            availability: 'always'
          },
          {
            name: 'Luis',
            role: 'DevOps Engineer',
            personality: 'reliability-focused and automation-minded',
            expertise: ['CI-CD', 'monitoring', 'deployment-automation', 'performance-testing'],
            availability: 'usually'
          }
        ],
        requirements: {
          scenario: 'enterprise-existing-codebase',
          existingProduct: {
            name: 'PulseOps IQ',
            description: 'Enterprise incident & service analytics SaaS for ITSM teams',
            existingFeatures: [
              'Incident ingestion dashboard',
              'SLA reporting',
              'Automation playbooks',
              'Stakeholder reporting',
              'Alert management'
            ],
            techStack: ['React', 'Vite', 'TypeScript', 'Express', 'PostgreSQL', 'TailwindCSS'],
            codebaseSize: '~15,000 LOC',
            architecture: 'Monorepo with client/, server/, shared/ structure'
          },
          featureRequest: {
            title: 'Executive Incident Heatmap & Forecasting',
            businessContext: 'Enterprise customers need proactive SLA management - visibility into incident patterns and prediction of future hotspots',
            requirements: [
              'New API endpoint: /api/analytics/heatmap - aggregates incidents by service & business unit',
              'Frontend heatmap visualization with color intensity = incident volume',
              'Trend forecasts (7-day, 30-day) with statistical confidence',
              'Alert threshold configuration for hotspot detection',
              'Export functionality (CSV, PDF) for executive reports',
              'Permission checks - executive role required',
              'Performance: <2s page load, handle 10k+ incidents'
            ],
            acceptanceCriteria: [
              'Heatmap displays accurate incident counts per service/unit',
              'Forecasting algorithm validated with historical test data (±10% accuracy)',
              'UI matches existing design system and component patterns',
              'All existing dashboard tests continue to pass (regression)',
              'New feature has ≥80% test coverage',
              'Documentation updated (API reference, user guide)'
            ]
          },
          productDocumentation: {
            executiveSummary: 'The Executive Heatmap & Forecasting feature enables C-level executives and IT directors to proactively identify incident patterns and predict future service hotspots. This strategic capability transforms PulseOps IQ from a reactive monitoring tool into a proactive SLA management platform, directly addressing our enterprise customers\' #1 feature request (mentioned in 73% of Q3 customer interviews).',
            stakeholders: [
              {
                name: 'Sarah Chen',
                title: 'VP of Product',
                priority: 'Critical - Q4 strategic initiative',
                concerns: ['Market differentiation', 'Enterprise upsell opportunity', 'Competitive parity with ServiceNow'],
                successMetrics: ['30% increase in enterprise tier conversions', 'Feature mentioned in 80% of sales demos']
              },
              {
                name: 'Michael Torres',
                title: 'Head of Customer Success',
                priority: 'High - reduces escalations',
                concerns: ['Ease of use for executives', 'Actionable insights', 'Reduces "firefighting" support'],
                successMetrics: ['50% reduction in SLA breach escalations', '4.5+ satisfaction rating']
              },
              {
                name: 'Enterprise Customer Council',
                title: 'Beta testers (5 Fortune 500 companies)',
                priority: 'Critical - retention risk',
                concerns: ['Accuracy of forecasts', 'Performance with large datasets', 'Export for board presentations'],
                successMetrics: ['±10% forecast accuracy', '<2s load time', 'PDF export used weekly']
              }
            ],
            userStories: [
              {
                persona: 'IT Director (Emily)',
                goal: 'Prevent SLA breaches before they happen',
                story: 'As an IT Director managing 200+ services, I want to see which services are trending toward incidents so that I can proactively allocate resources and avoid costly SLA breaches.',
                painPoint: 'Currently reacts to incidents after they occur - wants to be proactive',
                jobs: ['Weekly exec report preparation', 'Budget planning for support team', 'Vendor management']
              },
              {
                persona: 'CTO (David)',
                goal: 'Strategic visibility into operational health',
                story: 'As a CTO reporting to the board, I want exportable heatmaps showing incident trends so that I can demonstrate we\'re managing technical debt and service reliability strategically.',
                painPoint: 'Board asks "why so many incidents?" - needs data-driven answer',
                jobs: ['Monthly board presentations', 'Strategic planning', 'Technology investment decisions']
              },
              {
                persona: 'Service Owner (Priya)',
                goal: 'Understand impact of my service on business units',
                story: 'As a Service Owner for the payments API, I want to see incident distribution across business units so that I can prioritize fixes for the most critical customers.',
                painPoint: 'Doesn\'t know which incidents matter most to the business',
                jobs: ['Sprint planning', 'Incident post-mortems', 'Stakeholder communication']
              }
            ],
            successMetrics: {
              primary: [
                'Enterprise tier conversion rate: +30% (baseline: 12% of trials)',
                'Feature adoption: 70% of enterprise users within 60 days',
                'Forecast accuracy: ±10% of actual incident volume',
                'Customer satisfaction: 4.5/5.0 rating for feature'
              ],
              secondary: [
                'Page load performance: <2 seconds (95th percentile)',
                'Export usage: 40% of users export weekly',
                'Support ticket reduction: -25% SLA-related escalations',
                'Sales cycle impact: -15% time to close for enterprise'
              ],
              technical: [
                'API response time: <500ms for 10k incidents',
                'Test coverage: ≥80% for new code',
                'Zero regression bugs in existing dashboards',
                'Accessibility: WCAG 2.1 AA compliance'
              ]
            },
            roadmapContext: {
              quarterlyTheme: 'Q4 2024: Enterprise Proactive Operations',
              positioning: 'Flagship feature for enterprise tier - enables pricing increase from $499 to $799/month',
              dependencies: [
                'Q3: Analytics engine optimization (completed)',
                'Q4: Executive dashboard redesign (in parallel)',
                'Q1 2025: Machine learning model refinement (follow-up)'
              ],
              futureEnhancements: [
                'Q1 2025: Anomaly detection with ML',
                'Q2 2025: Predictive resource auto-scaling recommendations',
                'Q3 2025: Integration with PagerDuty for auto-escalation'
              ]
            },
            competitiveAnalysis: [
              {
                competitor: 'ServiceNow',
                theirCapability: 'Incident trending with basic visualization',
                ourDifferentiator: 'Statistical forecasting + business unit segmentation + executive export',
                gap: 'They lack predictive capabilities - reactive only'
              },
              {
                competitor: 'Datadog',
                theirCapability: 'APM monitoring with alerts',
                ourDifferentiator: 'Business-context layered heatmaps (not just technical metrics)',
                gap: 'Dev-focused, not exec-friendly. No business unit view.'
              },
              {
                competitor: 'PagerDuty',
                theirCapability: 'On-call scheduling and incident response',
                ourDifferentiator: 'Strategic analytics vs. tactical response - prevention vs. reaction',
                gap: 'Doesn\'t answer "where should we invest to prevent incidents?"'
              }
            ],
            goToMarketStrategy: {
              launchDate: 'December 15, 2024',
              targetSegment: 'Enterprise customers (500+ employees) with complex service architectures',
              messagingPillars: [
                'Transform from reactive to proactive - predict incidents before they happen',
                'Executive visibility - board-ready insights in minutes, not hours',
                'ROI proof - prevent costly SLA breaches with data-driven forecasting'
              ],
              salesEnablement: [
                'Demo video showing 2-minute executive workflow (produce by Dec 1)',
                'ROI calculator: "If you prevent 3 SLA breaches/month = $X saved"',
                'Competitive battlecard vs. ServiceNow (highlight forecast gap)',
                'Customer testimonial video from beta program (schedule Dec 10)'
              ],
              pricing: 'Enterprise tier exclusive - justifies $799/mo price point',
              launchActivities: [
                'Product Hunt launch (Dec 16)',
                'Webinar: "Proactive SLA Management" (Dec 18, 200 registrants goal)',
                'Blog post: "How Fortune 500 Companies Predict Incidents" (Dec 15)',
                'LinkedIn ad campaign targeting IT Directors (2-week campaign, $5k budget)'
              ]
            },
            riskAssessment: [
              {
                risk: 'Forecast accuracy below ±10% threshold',
                probability: 'Medium',
                impact: 'High - erodes trust in feature',
                mitigation: 'Extensive testing with historical data, phased rollout with beta customers, clearly communicate confidence intervals in UI'
              },
              {
                risk: 'Performance degrades with enterprise-scale data (>50k incidents)',
                probability: 'Low',
                impact: 'Critical - unusable for largest customers',
                mitigation: 'Load testing with 100k incident dataset, implement data aggregation caching, query optimization review with Jon (Data Scientist)'
              },
              {
                risk: 'Sales team lacks confidence to demo feature',
                probability: 'Medium',
                impact: 'Medium - slow adoption, missed revenue',
                mitigation: 'Dedicated training session Dec 8, simple demo script, pre-recorded video backup, involve sales in beta testing'
              },
              {
                risk: 'Feature too complex for target users',
                probability: 'Low',
                impact: 'High - low adoption despite development effort',
                mitigation: 'User testing with 3 customer personas, built-in tooltips, guided onboarding tour, "Quick Start" template presets'
              }
            ],
            resourcePlanning: {
              teamAllocation: {
                engineering: '2 backend (Ravi, Jon for forecasting), 1 frontend (Maya), 1 QA (Elena), 0.5 DevOps (Luis)',
                design: '0.5 FTE (Maya - UI design)',
                pm: '0.8 FTE (Claire - coordinate, stakeholder mgmt, launch prep)',
                dataScience: '0.3 FTE (Jon - forecasting model)'
              },
              timeline: '5 sprints (10 weeks) - Dec 15 target launch',
              budget: {
                development: '$85k (team time)',
                infrastructure: '$2k/month (increased analytics compute)',
                marketing: '$5k (launch campaign)',
                total: '$92k estimated'
              },
              dependencies: [
                'Analytics DB optimization (must complete by Nov 20)',
                'Design system v2 (parallel track, low risk)',
                'Sales enablement materials (Dec 1-8 window)'
              ]
            }
          },
          phases: [
            {
              name: 'onboarding',
              duration: 5,
              objectives: [
                'Welcome to PulseOps IQ team',
                'Review product overview and architecture',
                'Explore existing codebase structure',
                'Understand feature requirements and business context'
              ],
              deliverables: ['Understanding of codebase', 'Questions answered by team']
            },
            {
              name: 'planning',
              duration: 5,
              objectives: [
                'Break down feature into implementation tasks',
                'Discuss technical approach with team',
                'Identify dependencies and potential risks',
                'Define timeline and milestones'
              ],
              deliverables: ['Task breakdown', 'Technical design decisions', 'Sprint plan']
            },
            {
              name: 'implementation',
              duration: 30,
              objectives: [
                'Implement backend aggregation API',
                'Build frontend heatmap visualization',
                'Add forecasting algorithm integration',
                'Write unit and integration tests',
                'Update documentation'
              ],
              deliverables: ['Working code', 'Tests passing', 'PR ready for review']
            },
            {
              name: 'review',
              duration: 10,
              objectives: [
                'Submit PR for team review',
                'Address code review feedback',
                'Ensure all tests pass',
                'Verify no regression on existing features'
              ],
              deliverables: ['PR approved', 'All feedback addressed', 'CI passing']
            },
            {
              name: 'release',
              duration: 5,
              objectives: [
                'Merge feature to main branch',
                'Deploy to staging environment',
                'Sprint retrospective with team',
                'Receive performance evaluation'
              ],
              deliverables: ['Feature deployed', 'Release notes', 'Team feedback']
            }
          ],
          simulatedCodebase: {
            structure: {
              'client/src/pages/dashboard': ['incident-dashboard.tsx', 'sla-reports.tsx', 'automation-playbooks.tsx'],
              'client/src/pages/analytics': ['overview.tsx', 'service-health.tsx'],
              'client/src/components/charts': ['line-chart.tsx', 'bar-chart.tsx', 'pie-chart.tsx'],
              'server/routes': ['incidents.ts', 'reports.ts', 'analytics.ts', 'playbooks.ts'],
              'server/services': ['incident-service.ts', 'sla-calculator.ts', 'analytics-engine.ts'],
              'shared': ['schema.ts', 'types.ts', 'validation.ts'],
              'docs': ['README.md', 'ARCHITECTURE.md', 'API_REFERENCE.md']
            },
            keyFiles: [
              {
                path: 'server/routes/analytics.ts',
                description: 'Analytics API endpoints - you\'ll add heatmap endpoint here',
                snippet: 'export async function analyticsRoutes(app: Express) {\n  app.get("/api/analytics/overview", ...);\n  app.get("/api/analytics/service-health", ...);\n  // Add heatmap endpoint here\n}'
              },
              {
                path: 'client/src/pages/analytics/overview.tsx',
                description: 'Analytics dashboard page - good reference for adding heatmap',
                snippet: 'export default function AnalyticsOverview() {\n  const { data: metrics } = useQuery({ queryKey: [\'/api/analytics/overview\'] });\n  return <div>...</div>;\n}'
              },
              {
                path: 'shared/schema.ts',
                description: 'Data models and types - check incident schema',
                snippet: 'export const incidents = pgTable("incidents", {\n  id: serial("id"),\n  serviceId: integer("service_id"),\n  severity: text("severity"),\n  status: text("status"),\n  ...\n});'
              }
            ]
          }
        },
        scenarioScript: {
          phases: {
            onboarding: [
              { from: 'Claire', time: 1, message: 'Welcome to PulseOps IQ! Excited to have you on the team. We\'re building the Executive Heatmap feature - it\'s a high-priority request from our enterprise customers.' },
              { from: 'Ravi', time: 2, message: 'Hey! I can give you a quick tour of the codebase. We use a monorepo structure - client/ for React frontend, server/ for Express backend, shared/ for types.' },
              { from: 'Maya', time: 3, message: 'From a design perspective, we have an established design system in client/src/components. The heatmap should follow our existing chart patterns.' },
              { from: 'Claire', time: 4, message: 'Just to clarify - you\'re taking the lead on this feature. I\'ll be here to help with onboarding and then step back to a standby role. Feel free to @mention me anytime you need guidance or get stuck!' }
            ],
            planning: [
              { from: 'Jon', time: 1, message: 'For forecasting, I can provide a statistical model API you can call. We\'ll use exponential smoothing for trend prediction.' },
              { from: 'Elena', time: 2, message: 'Make sure we have test coverage for the new endpoints and regression tests for existing dashboards. I\'ll help with test strategy.' }
            ],
            implementation: [
              { from: 'Ravi', time: 10, message: 'How\'s the implementation going? Let me know if you hit any roadblocks with the aggregation logic.' },
              { from: 'Maya', time: 15, message: 'I\'d love to review the heatmap UI once you have something visual. Make sure it\'s responsive and accessible!' },
              { from: 'Luis', time: 20, message: 'FYI - deployment process is automated via GitHub Actions. Just make sure your tests pass locally first.' }
            ]
          }
        },
        difficulty: 'senior',
        estimatedDuration: 55
      }
    ];

    for (const project of projects) {
      await this.createWorkspaceProject(project);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getSimulationSession(id: number): Promise<SimulationSession | undefined> {
    return this.sessions.get(id);
  }

  async getUserSimulationSessions(userId: number, type?: string): Promise<SimulationSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && (!type || session.type === type))
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async createSimulationSession(insertSession: InsertSimulationSession): Promise<SimulationSession> {
    const id = this.currentSessionId++;
    const session: SimulationSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null,
      score: null,
      feedback: null,
      duration: null,
      status: insertSession.status || 'active',
      messages: insertSession.messages || []
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSimulationSession(id: number, updates: Partial<SimulationSession>): Promise<SimulationSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.progress.values())
      .filter(p => p.userId === userId);
  }

  async getUserProgressByType(userId: number, type: string): Promise<UserProgress | undefined> {
    return this.progress.get(`${userId}-${type}`);
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentProgressId++;
    const progress: UserProgress = {
      ...insertProgress,
      id,
      totalSessions: insertProgress.totalSessions || 0,
      completedSessions: insertProgress.completedSessions || 0,
      totalTime: insertProgress.totalTime || 0,
      averageScore: insertProgress.averageScore || null,
      lastSessionAt: null
    };
    this.progress.set(`${progress.userId}-${progress.simulationType}`, progress);
    return progress;
  }

  async updateUserProgress(userId: number, type: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const key = `${userId}-${type}`;
    const progress = this.progress.get(key);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.progress.set(key, updatedProgress);
    return updatedProgress;
  }

  // Workspace project operations
  async getWorkspaceProjects(): Promise<WorkspaceProject[]> {
    return Array.from(this.workspaceProjects.values());
  }

  async getWorkspaceProject(id: number): Promise<WorkspaceProject | undefined> {
    return this.workspaceProjects.get(id);
  }

  async createWorkspaceProject(insertProject: InsertWorkspaceProject): Promise<WorkspaceProject> {
    const id = this.currentProjectId++;
    const project: WorkspaceProject = {
      ...insertProject,
      id,
      scenarioScript: insertProject.scenarioScript || null,
      createdAt: new Date()
    };
    this.workspaceProjects.set(id, project);
    return project;
  }

  // Workspace role operations
  async getWorkspaceRoles(): Promise<WorkspaceRole[]> {
    return Array.from(this.workspaceRoles.values());
  }

  async getWorkspaceRole(id: number): Promise<WorkspaceRole | undefined> {
    return this.workspaceRoles.get(id);
  }

  async createWorkspaceRole(insertRole: InsertWorkspaceRole): Promise<WorkspaceRole> {
    const id = this.currentRoleId++;
    const role: WorkspaceRole = {
      ...insertRole,
      id,
      createdAt: new Date()
    };
    this.workspaceRoles.set(id, role);
    return role;
  }

  // Workspace artifact operations
  async getWorkspaceArtifacts(sessionId: number): Promise<WorkspaceArtifact[]> {
    return Array.from(this.workspaceArtifacts.values())
      .filter(artifact => artifact.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getWorkspaceArtifact(id: number): Promise<WorkspaceArtifact | undefined> {
    return this.workspaceArtifacts.get(id);
  }

  async createWorkspaceArtifact(insertArtifact: InsertWorkspaceArtifact): Promise<WorkspaceArtifact> {
    const id = this.currentArtifactId++;
    const artifact: WorkspaceArtifact = {
      ...insertArtifact,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedRole: insertArtifact.assignedRole || null,
      metadata: insertArtifact.metadata || null,
      versionHistory: insertArtifact.versionHistory || []
    };
    this.workspaceArtifacts.set(id, artifact);
    return artifact;
  }

  async updateWorkspaceArtifact(id: number, updates: Partial<WorkspaceArtifact>): Promise<WorkspaceArtifact | undefined> {
    const artifact = this.workspaceArtifacts.get(id);
    if (!artifact) return undefined;
    
    const updatedArtifact = { 
      ...artifact, 
      ...updates,
      updatedAt: new Date()
    };
    this.workspaceArtifacts.set(id, updatedArtifact);
    return updatedArtifact;
  }

  // Workspace task operations
  async getWorkspaceTasks(sessionId: number): Promise<WorkspaceTask[]> {
    return Array.from(this.workspaceTasks.values())
      .filter(task => task.sessionId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getWorkspaceTask(id: number): Promise<WorkspaceTask | undefined> {
    return this.workspaceTasks.get(id);
  }

  async createWorkspaceTask(insertTask: InsertWorkspaceTask): Promise<WorkspaceTask> {
    const id = this.currentTaskId++;
    const task: WorkspaceTask = {
      ...insertTask,
      id,
      status: insertTask.status || 'todo',
      priority: insertTask.priority || 'medium',
      assignedRole: insertTask.assignedRole || null,
      complexity: insertTask.complexity || null,
      dependencies: insertTask.dependencies || [],
      artifactId: insertTask.artifactId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workspaceTasks.set(id, task);
    return task;
  }

  async updateWorkspaceTask(id: number, updates: Partial<WorkspaceTask>): Promise<WorkspaceTask | undefined> {
    const task = this.workspaceTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updates,
      updatedAt: new Date()
    };
    this.workspaceTasks.set(id, updatedTask);
    return updatedTask;
  }

  // Workspace interaction operations
  async getWorkspaceInteractions(sessionId: number, channel?: string): Promise<WorkspaceInteraction[]> {
    return Array.from(this.workspaceInteractions.values())
      .filter(interaction => 
        interaction.sessionId === sessionId && 
        (!channel || interaction.channel === channel)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkspaceInteraction(insertInteraction: InsertWorkspaceInteraction): Promise<WorkspaceInteraction> {
    const id = this.currentInteractionId++;
    const interaction: WorkspaceInteraction = {
      ...insertInteraction,
      id,
      metadata: insertInteraction.metadata || null,
      threadId: insertInteraction.threadId || null,
      createdAt: new Date()
    };
    this.workspaceInteractions.set(id, interaction);
    return interaction;
  }

  // Workspace evaluation operations
  async getWorkspaceEvaluations(sessionId: number): Promise<WorkspaceEvaluation[]> {
    return Array.from(this.workspaceEvaluations.values())
      .filter(evaluation => evaluation.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkspaceEvaluation(insertEvaluation: InsertWorkspaceEvaluation): Promise<WorkspaceEvaluation> {
    const id = this.currentEvaluationId++;
    const evaluation: WorkspaceEvaluation = {
      ...insertEvaluation,
      id,
      collaborationScore: insertEvaluation.collaborationScore || null,
      deliveryScore: insertEvaluation.deliveryScore || null,
      communicationScore: insertEvaluation.communicationScore || null,
      feedback: insertEvaluation.feedback || null,
      createdAt: new Date()
    };
    this.workspaceEvaluations.set(id, evaluation);
    return evaluation;
  }
}

export const storage = new MemStorage();
