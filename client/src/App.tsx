import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import JourneyMap from "@/pages/journey-map";
import InterviewSimulator from "@/pages/interview-simulator";
import InterviewHistory from "@/pages/interview-history";
import NegotiationSimulator from "@/pages/negotiation-simulator";
import WorkspaceJourney from "@/pages/workspace-journey";
import WorkspacePractice from "@/pages/workspace-practice";
import DocumentViewer from "@/pages/document-viewer";
import Progress from "@/pages/progress";
import JobBoard from "@/pages/job-board";
import Journey from "@/pages/journey";
import JourneyDashboard from "@/pages/journey-dashboard";
import SprintHub from "@/pages/sprint-hub";
import WorkspaceDashboard from "@/pages/workspace-dashboard";
import WorkspaceOnboarding from "@/pages/workspace-onboarding";
import WorkspacePlanning from "@/pages/workspace-planning";
import WorkspaceExecution from "@/pages/workspace-execution";
import WorkspaceReview from "@/pages/workspace-review";
import WorkspaceRetro from "@/pages/workspace-retro";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={JourneyMap} />
      <Route path="/jobs" component={JobBoard} />
      <Route path="/journey" component={Journey} />
      <Route path="/journey/:journeyId" component={JourneyDashboard} />
      <Route path="/journey/:journeyId/sprint/:sprintId" component={SprintHub} />
      <Route path="/interview" component={InterviewSimulator} />
      <Route path="/interview/history" component={InterviewHistory} />
      <Route path="/negotiation" component={NegotiationSimulator} />
      <Route path="/workspace/journey" component={WorkspaceJourney} />
      <Route path="/workspace/practice" component={WorkspacePractice} />
      <Route path="/workspace/:workspaceId/onboarding" component={WorkspaceOnboarding} />
      <Route path="/workspace/:workspaceId/planning" component={WorkspacePlanning} />
      <Route path="/workspace/:workspaceId/execution" component={WorkspaceExecution} />
      <Route path="/workspace/:workspaceId/review" component={WorkspaceReview} />
      <Route path="/workspace/:workspaceId/retro" component={WorkspaceRetro} />
      <Route path="/workspace/:workspaceId" component={WorkspaceDashboard} />
      <Route path="/progress" component={Progress} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/workspace/:sessionId/document/:docType">
            <DocumentViewer />
          </Route>
          <Route>
            <AppLayout>
              <Router />
            </AppLayout>
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
