import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FolderOpen, 
  FileCode, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Eye,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodebaseExplorationConfig, CodebaseMission, CodebaseExplorationProgress } from "@shared/adapters/onboarding/types";

interface ExploreCodebaseStepProps {
  config: CodebaseExplorationConfig;
  onComplete: (progress: CodebaseExplorationProgress) => void;
  onBack: () => void;
  onSkip?: () => void;
  initialProgress?: CodebaseExplorationProgress;
}

interface FilePreviewData {
  path: string;
  name: string;
  content: string;
  type: 'file' | 'folder';
}

const MOCK_FILE_CONTENTS: Record<string, FilePreviewData> = {
  'README.md': {
    path: 'README.md',
    name: 'README.md',
    type: 'file',
    content: `# NovaPay Merchant Dashboard

A React-based dashboard for payment management and merchant operations.

## Features
- Real-time transaction monitoring
- Merchant onboarding workflow
- Payment analytics and reporting
- API key management

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **ORM**: Drizzle ORM
- **Build**: Vite

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure
- \`/client\` - React frontend
- \`/server\` - Express backend
- \`/shared\` - Shared types and adapters`
  },
  'package.json': {
    path: 'package.json',
    name: 'package.json',
    type: 'file',
    content: `{
  "name": "merchant-dashboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "react": "^18.2.0",
    "express": "^4.18.2",
    "drizzle-orm": "^0.29.0",
    "@tanstack/react-query": "^5.0.0"
  }
}`
  },
  'src/main.tsx': {
    path: 'src/main.tsx',
    name: 'main.tsx',
    type: 'file',
    content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);`
  },
  'shared/schema.ts': {
    path: 'shared/schema.ts',
    name: 'schema.ts',
    type: 'file',
    content: `import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").default("merchant"),
  createdAt: timestamp("created_at").defaultNow()
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => users.id),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => users.id),
  key: text("key").notNull(),
  active: boolean("active").default(true)
});`
  },
  'server/routes.ts': {
    path: 'server/routes.ts',
    name: 'routes.ts',
    type: 'file',
    content: `import { Router } from "express";
import { db } from "./db";
import { users, transactions } from "@shared/schema";

const router = Router();

// Get all merchants
router.get("/api/merchants", async (req, res) => {
  const merchants = await db.select().from(users);
  res.json(merchants);
});

// Get transactions for a merchant
router.get("/api/merchants/:id/transactions", async (req, res) => {
  const { id } = req.params;
  const txns = await db.select()
    .from(transactions)
    .where(eq(transactions.merchantId, parseInt(id)));
  res.json(txns);
});

// Create new transaction
router.post("/api/transactions", async (req, res) => {
  const { merchantId, amount } = req.body;
  const [txn] = await db.insert(transactions)
    .values({ merchantId, amount })
    .returning();
  res.json(txn);
});

export default router;`
  },
  'client/src/components': {
    path: 'client/src/components',
    name: 'components',
    type: 'folder',
    content: `📁 components/
├── 📁 ui/           # Shadcn UI components (Button, Card, etc.)
├── 📁 dashboard/    # Dashboard views and widgets
├── 📁 merchants/    # Merchant management components
├── 📁 layout/       # Layout components (Sidebar, Header)
└── 📄 theme-provider.tsx`
  },
  'client/src/hooks': {
    path: 'client/src/hooks',
    name: 'hooks',
    type: 'folder',
    content: `📁 hooks/
├── 📄 use-toast.ts      # Toast notifications
├── 📄 use-mobile.ts     # Mobile detection
└── 📄 use-sprint-workflow.ts  # Sprint workflow state`
  },
  'shared/adapters': {
    path: 'shared/adapters',
    name: 'adapters',
    type: 'folder',
    content: `📁 adapters/
├── 📁 onboarding/   # Onboarding configuration adapters
├── 📁 planning/     # Sprint planning adapters
├── 📁 execution/    # Sprint execution adapters
└── 📄 index.ts      # Role and Level type exports

Adapters customize behavior based on:
- Role (developer, pm, qa, devops)
- Level (intern, junior, mid, senior)`
  },
  'docs': {
    path: 'docs',
    name: 'docs',
    type: 'folder',
    content: `📁 docs/
├── 📄 PRD.md           # Product Requirements Document
├── 📄 ARCHITECTURE.md  # System architecture overview
├── 📄 API.md           # API documentation
└── 📄 ONBOARDING.md    # New developer guide`
  }
};

function getMockFileContent(targetFile?: string): FilePreviewData | null {
  if (!targetFile) return null;
  return MOCK_FILE_CONTENTS[targetFile] || null;
}

export function ExploreCodebaseStep({
  config,
  onComplete,
  onBack,
  onSkip,
  initialProgress
}: ExploreCodebaseStepProps) {
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>(
    initialProgress?.missions || {}
  );
  const [reflection, setReflection] = useState(initialProgress?.reflection || '');
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);

  const requiredMissions = config.missions.filter(m => m.required);
  const optionalMissions = config.missions.filter(m => !m.required);
  const completedCount = Object.values(completedMissions).filter(Boolean).length;
  const requiredCompletedCount = requiredMissions.filter(m => completedMissions[m.id]).length;
  const allRequiredComplete = requiredCompletedCount >= requiredMissions.length;
  const reflectionValid = reflection.length >= config.reflectionMinLength;
  const canComplete = allRequiredComplete && reflectionValid;
  const progressPercent = (completedCount / config.missions.length) * 100;

  const toggleMission = (missionId: string) => {
    setCompletedMissions(prev => ({
      ...prev,
      [missionId]: !prev[missionId]
    }));
  };

  const handleViewFile = (mission: CodebaseMission) => {
    const fileData = getMockFileContent(mission.targetFile);
    if (fileData) {
      // Set both states together to avoid showing stale data
      setExpandedMission(mission.id);
      // Use a timeout to ensure the UI updates after expansion
      setTimeout(() => setPreviewFile(fileData), 0);
    }
  };
  
  // Update preview file when expanded mission changes (for when clicking the collapsible trigger)
  useEffect(() => {
    if (expandedMission) {
      const mission = config.missions.find(m => m.id === expandedMission);
      if (mission?.targetFile) {
        const fileData = getMockFileContent(mission.targetFile);
        if (fileData) {
          setPreviewFile(fileData);
        }
      }
    }
  }, [expandedMission, config.missions]);

  const handleComplete = () => {
    onComplete({
      missions: completedMissions,
      reflection,
      completedAt: new Date().toISOString()
    });
  };

  const renderMissionItem = (mission: CodebaseMission) => {
    const isCompleted = completedMissions[mission.id];
    const isExpanded = expandedMission === mission.id;
    const showHint = config.hintVisibility === 'always' || 
      (config.hintVisibility === 'hover' && isExpanded);

    return (
      <Collapsible
        key={mission.id}
        open={isExpanded}
        onOpenChange={(open) => setExpandedMission(open ? mission.id : null)}
      >
        <div className={cn(
          "border rounded-lg transition-all",
          isCompleted ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700",
          isExpanded ? "shadow-sm" : ""
        )}>
          <div className="p-3 flex items-start gap-3">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => toggleMission(mission.id)}
              className="mt-0.5"
              data-testid={`checkbox-mission-${mission.id}`}
            />
            <div className="flex-1 min-w-0">
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                <span className={cn(
                  "font-medium text-sm",
                  isCompleted ? "text-green-700 dark:text-green-300 line-through" : ""
                )}>
                  {mission.label}
                </span>
                {mission.required && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>
                )}
                <span className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </span>
              </CollapsibleTrigger>
              {showHint && mission.hint && !isExpanded && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  {mission.hint}
                </p>
              )}
            </div>
            {mission.targetFile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewFile(mission);
                }}
                data-testid={`button-view-${mission.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
          <CollapsibleContent>
            {mission.hint && (
              <div className="px-3 pb-2 pt-0">
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{mission.hint}</span>
                </div>
              </div>
            )}
            {mission.targetFile && previewFile && expandedMission === mission.id && (
              <div className="px-3 pb-3">
                <div className="border rounded-lg bg-gray-900 text-gray-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
                    {previewFile.type === 'folder' ? (
                      <FolderOpen className="h-4 w-4 text-blue-400" />
                    ) : (
                      <FileCode className="h-4 w-4 text-green-400" />
                    )}
                    <span className="text-sm font-mono">{previewFile.path}</span>
                  </div>
                  <ScrollArea className="h-48">
                    <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                      {previewFile.content}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6" data-testid="explore-codebase-step">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-teal-600" />
            {config.header.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{config.header.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {config.skippable && onSkip && (
            <Button variant="ghost" onClick={onSkip} data-testid="button-skip">
              Skip
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
        <Clock className="h-5 w-5 text-teal-600" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-teal-800 dark:text-teal-200">
              Exploration Progress
            </span>
            <span className="text-sm text-teal-600">
              {completedCount}/{config.missions.length} missions
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        <Badge variant="outline" className="text-teal-700 dark:text-teal-300">
          ~{config.estimatedMinutes} min
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Exploration Missions
            </CardTitle>
            <CardDescription>
              Check off each item as you explore the codebase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredMissions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Required ({requiredCompletedCount}/{requiredMissions.length})
                </div>
                <div className="space-y-2">
                  {requiredMissions.map(renderMissionItem)}
                </div>
              </div>
            )}
            
            {optionalMissions.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Optional
                </div>
                <div className="space-y-2">
                  {optionalMissions.map(renderMissionItem)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCode className="h-5 w-5 text-green-600" />
              Reflection
            </CardTitle>
            <CardDescription>
              {config.reflectionPrompt}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your observations..."
              className="min-h-[160px] resize-none"
              data-testid="textarea-reflection"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {reflection.length} / {config.reflectionMinLength} min characters
              </span>
              {reflectionValid && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Good length
                </span>
              )}
            </div>

            {config.highlightedFiles.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-gray-500 mb-2">Key files to explore:</div>
                <div className="flex flex-wrap gap-1">
                  {config.highlightedFiles.map(file => (
                    <Badge key={file} variant="secondary" className="text-xs font-mono">
                      {file}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-500">
          {!allRequiredComplete && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Complete all required missions to continue
            </span>
          )}
          {allRequiredComplete && !reflectionValid && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Add your reflection ({config.reflectionMinLength - reflection.length} more characters needed)
            </span>
          )}
        </div>
        <Button
          onClick={handleComplete}
          disabled={!canComplete}
          className="bg-teal-600 hover:bg-teal-700"
          data-testid="button-continue"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
