import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cpu, LayoutDashboard, MessageSquare, User, Settings, LogOut, Plus, Moon, Sun, Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analyse", label: "New Analysis", icon: Plus },
  { path: "/chats", label: "Chat History", icon: MessageSquare },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearch?: boolean;
}

const AppSidebar = ({ searchQuery = "", onSearchChange, showSearch }: AppSidebarProps) => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex flex-col h-screen sticky top-0 glass-panel border-r border-border/50 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 p-4 border-b border-border/50">
        <div className="relative flex-shrink-0">
          <Cpu className="h-6 w-6 text-primary" />
          <div className="absolute inset-0 blur-md bg-primary/30 rounded-full" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight text-foreground">
            AI Cloud <span className="gradient-text">Mentor</span>
          </span>
        )}
      </div>

      {/* Search */}
      {showSearch && !collapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full bg-muted/50 border border-border/50 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border/50 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {user && (
          <>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{profile?.name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Log out</span>}
            </button>
          </>
        )}
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
