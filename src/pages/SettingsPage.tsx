import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trash2, Download, Loader2, Moon, Sun } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [aiStyle, setAiStyle] = useState(profile?.ai_response_style || "detailed");

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
    }
    setChangingPw(false);
  };

  const handleStyleChange = async (style: string) => {
    setAiStyle(style);
    if (user) {
      await supabase.from("profiles").update({ ai_response_style: style }).eq("user_id", user.id);
      await refreshProfile();
    }
  };

  const handleExport = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chat-history.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Chat history exported");
    }
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion requires admin action. Please contact support.");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-foreground">
          Settings
        </motion.h1>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground hover:bg-muted transition-colors"
            >
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </motion.div>

        {/* AI Style */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">AI Response Style</h3>
          <div className="grid grid-cols-2 gap-2">
            {["detailed", "concise", "technical", "executive"].map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  aiStyle === style
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h3>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPw}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </button>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Chat History
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Download all analyses as JSON</p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground hover:bg-muted transition-colors"
            >
              Export
            </button>
          </div>
        </motion.div>

        {/* Delete Account */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-5 border-destructive/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete Account
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive hover:bg-destructive/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
