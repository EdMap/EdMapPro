import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import InterviewSimulator from "@/pages/interview-simulator";
import NegotiationSimulator from "@/pages/negotiation-simulator";
import WorkspaceSimulator from "@/pages/workspace-simulator";
import DocumentViewer from "@/pages/document-viewer";
import Progress from "@/pages/progress";
import JobBoard from "@/pages/job-board";
import Journey from "@/pages/journey";
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
      <Route path="/" component={Dashboard} />
      <Route path="/jobs" component={JobBoard} />
      <Route path="/journey" component={Journey} />
      <Route path="/interview" component={InterviewSimulator} />
      <Route path="/negotiation" component={NegotiationSimulator} />
      <Route path="/workspace" component={WorkspaceSimulator} />
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
