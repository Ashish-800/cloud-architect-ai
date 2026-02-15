import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Moon, Sun, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Cpu className="h-6 w-6 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/30 rounded-full" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            AI Cloud <span className="gradient-text">Mentor</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
