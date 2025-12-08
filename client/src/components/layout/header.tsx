import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/interview": "Interview Simulator",
  "/negotiation": "Negotiation Simulator", 
  "/workspace": "Workspace Simulator",
  "/progress": "Progress & Analytics"
};

function getPageTitle(location: string): string {
  if (pageTitles[location]) {
    return pageTitles[location];
  }
  
  if (location.includes('/workspace/')) {
    if (location.includes('/onboarding')) return 'Onboarding';
    if (location.includes('/planning')) return 'Sprint Planning';
    if (location.includes('/execution') || location.includes('/sprint-hub')) return 'Sprint Execution';
    if (location.includes('/review')) return 'Sprint Review';
    if (location.includes('/retro')) return 'Sprint Retrospective';
    if (location.includes('/ticket/')) return 'Ticket Workspace';
    return 'Workspace';
  }
  
  if (location.includes('/journey')) return 'Job Journey';
  if (location.includes('/interview')) return 'Interview Simulator';
  if (location.includes('/negotiation')) return 'Negotiation Practice';
  
  return 'Dashboard';
}

export default function Header() {
  const [location] = useLocation();
  const pageTitle = getPageTitle(location);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-4 w-4 text-gray-500" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-300 text-gray-700 text-sm font-medium">
                {user ? getInitials(user.firstName, user.lastName) : "AA"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">
              {user ? user.firstName : "Arsen"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
