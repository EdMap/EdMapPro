import { Link, useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  Map, 
  MessageCircle, 
  Handshake, 
  Users, 
  TrendingUp, 
  Settings,
  Briefcase,
  Route,
  History
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: "My Journey",
    href: "/",
    icon: Map,
    section: "journey"
  },
  {
    title: "Job Board",
    href: "/jobs",
    icon: Briefcase,
    section: "journey"
  },
  {
    title: "Application Details",
    href: "/journey",
    icon: Route,
    section: "journey"
  },
  {
    title: "Interview Practice", 
    href: "/interview",
    icon: MessageCircle,
    section: "practice",
    children: [
      {
        title: "Practice History",
        href: "/interview/history",
        icon: History,
        section: "practice"
      }
    ]
  },
  {
    title: "Negotiation Practice",
    href: "/negotiation", 
    icon: Handshake,
    section: "practice"
  },
  {
    title: "Workspace Practice",
    href: "/workspace",
    icon: Users,
    section: "practice"
  },
  {
    title: "Progress & Analytics",
    href: "/progress",
    icon: TrendingUp,
    section: "account"
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    section: "account"
  }
];

// Paths that can be in Journey mode when they have specific URL params
const journeyModeIndicators: Record<string, string[]> = {
  "/interview": ["stageId", "journeyMode"],
  "/negotiation": ["applicationId", "journeyMode"],
};

export default function Sidebar() {
  const [location] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  // Check if current page is in Journey mode (has journey-related URL params)
  const isInJourneyMode = Object.entries(journeyModeIndicators).some(
    ([path, params]) => location === path && params.some(p => searchParams.has(p))
  );

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Determine which item should be active
  const getIsActive = (item: NavItem) => {
    // If we're in Journey mode on a simulator page, highlight "Application Details" instead
    if (isInJourneyMode && item.href === "/journey") {
      return true;
    }
    
    // If we're in Journey mode, don't highlight the practice section items
    if (isInJourneyMode && item.section === "practice") {
      return false;
    }
    
    // Normal path matching - also check if we're on a child route
    if (location === item.href) return true;
    
    // Check if any child is active (for parent highlighting)
    if (item.children?.some(child => location === child.href)) return true;
    
    return false;
  };
  
  // Check if a parent item should be expanded (has active child or is active itself)
  const shouldExpand = (item: NavItem) => {
    if (!item.children) return false;
    return location.startsWith(item.href);
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">edmap</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-8">
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section === "simulations" ? "Simulations" : section === "journey" ? "Job Journey" : section === "practice" ? "Practice" : "Account"}
              </h3>
            </div>
            
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = getIsActive(item);
              const isExpanded = shouldExpand(item);
              
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "simulation-nav-item",
                      isActive && "active"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                  
                  {/* Nested children - always visible when parent exists */}
                  {item.children && (
                    <div className="ml-4 border-l border-gray-200">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location === child.href;
                        
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "simulation-nav-item pl-4 text-sm",
                              isChildActive && "active"
                            )}
                          >
                            <ChildIcon className={cn(
                              "w-3.5 h-3.5",
                              isChildActive ? "text-blue-600" : "text-gray-400"
                            )} />
                            <span className={cn(
                              isChildActive ? "text-blue-600" : "text-gray-600"
                            )}>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
