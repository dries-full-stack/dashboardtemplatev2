import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ChevronLeft, Target, Headphones } from "lucide-react";
import profitPulseLogo from "@/assets/profit-pulse-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    group: "Dashboards",
    items: [
      { title: "Leadgeneratie", href: "/", icon: LayoutDashboard },
      { title: "Sales Resultaten", href: "/sales-resultaten", icon: Target },
      { title: "Call Center", href: "/call-center", icon: Headphones },
    ],
  },
];

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const isMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isMobile) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col overflow-hidden",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-16 lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <img src={profitPulseLogo} alt="Profit Pulse" className="h-8 w-auto" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hidden lg:flex"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map((group) => (
            <div key={group.group} className="mb-6">
              {isOpen && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {group.group}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        cn(
                          "nav-link",
                          isActive && "active",
                          !isOpen && "justify-center px-2"
                        )
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span>{item.title}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              Profit Pulse Dashboard
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

