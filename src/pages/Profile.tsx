import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, BarChart3, TrendingUp, DollarSign, Save, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ count: 0, avg: 0, best: 0, totalCost: 0 });

  useEffect(() => {
    if (profile) setName(profile.name || "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chats")
      .select("score, cost_estimate")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const scores = data.filter(d => d.score).map(d => d.score!);
        setStats({
          count: data.length,
          avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          best: scores.length ? Math.max(...scores) : 0,
          totalCost: data.reduce((a, d) => a + (Number(d.cost_estimate) || 0), 0),
        });
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to update profile");
    else {
      toast.success("Profile updated");
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-foreground">
          Profile
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 space-y-6">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {(profile?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{profile?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Edit Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Analyses", value: stats.count, icon: BarChart3 },
            { label: "Average Score", value: stats.avg, icon: TrendingUp },
            { label: "Best Score", value: stats.best, icon: TrendingUp },
            { label: "Total Cost Analyzed", value: `$${Math.round(stats.totalCost).toLocaleString()}`, icon: DollarSign },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
