import { Link, useLocation } from "wouter";
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
  Route
} from "lucide-react";

const navigationItems = [
  {
    title: "Simulations Map",
    href: "/",
    icon: Map,
    section: "simulations"
  },
  {
    title: "Job Board",
    href: "/jobs",
    icon: Briefcase,
    section: "journey"
  },
  {
    title: "My Journey",
    href: "/journey",
    icon: Route,
    section: "journey"
  },
  {
    title: "Interview Sessions", 
    href: "/interview",
    icon: MessageCircle,
    section: "simulations"
  },
  {
    title: "Negotiation Sessions",
    href: "/negotiation", 
    icon: Handshake,
    section: "simulations"
  },
  {
    title: "Workspace Simulation",
    href: "/workspace",
    icon: Users,
    section: "simulations"
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

export default function Sidebar() {
  const [location] = useLocation();

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

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
                {section === "simulations" ? "Simulations" : section === "journey" ? "Job Journey" : "Account"}
              </h3>
            </div>
            
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
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
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
