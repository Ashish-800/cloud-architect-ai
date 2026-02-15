import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ChatRow {
  id: string;
  title: string;
  score: number | null;
  risk_level: string | null;
  cost_estimate: number | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chats")
      .select("id, title, score, risk_level, cost_estimate, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setChats(data || []));
  }, [user]);

  const avgScore = chats.length > 0
    ? Math.round(chats.filter(c => c.score).reduce((a, c) => a + (c.score || 0), 0) / chats.filter(c => c.score).length)
    : 0;
  const bestScore = chats.length > 0 ? Math.max(...chats.map(c => c.score || 0)) : 0;
  const totalCost = chats.reduce((a, c) => a + (Number(c.cost_estimate) || 0), 0);

  const stats = [
    { label: "Total Analyses", value: chats.length, icon: BarChart3, color: "text-primary" },
    { label: "Average Score", value: avgScore, icon: TrendingUp, color: "text-score-good" },
    { label: "Best Score", value: bestScore, icon: TrendingUp, color: "text-score-excellent" },
    { label: "Total Cost Analyzed", value: `$${Math.round(totalCost).toLocaleString()}`, icon: DollarSign, color: "text-score-fair" },
  ];

  const recentScores = chats.slice(0, 10).reverse().map((c, i) => ({
    name: `#${i + 1}`,
    score: c.score || 0,
  }));

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{profile?.name || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your cloud architecture intelligence overview</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Trend</h3>
            {recentScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No analyses yet
              </div>
            )}
          </motion.div>

          {/* Recent Chats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-panel rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Recent Analyses</h3>
              <Link to="/chats" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {chats.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {chat.score && (
                      <span className="text-xs font-mono font-semibold text-primary">{chat.score}/100</span>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {chats.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">No analyses yet</p>
                  <Link
                    to="/analyse"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Start Your First Analysis
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
