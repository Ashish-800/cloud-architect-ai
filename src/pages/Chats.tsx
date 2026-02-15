import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Search, ArrowRight, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatRow {
  id: string;
  title: string;
  score: number | null;
  risk_level: string | null;
  created_at: string;
}

const Chats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chats")
      .select("id, title, score, risk_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setChats(data || []));
  }, [user]);

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("chats").delete().eq("id", id);
    setChats((prev) => prev.filter((c) => c.id !== id));
    toast.success("Analysis deleted");
  };

  const riskColor = (level: string | null) => {
    if (!level) return "text-muted-foreground";
    const l = level.toLowerCase();
    if (l === "critical" || l === "high") return "text-score-poor";
    if (l === "medium") return "text-score-fair";
    return "text-score-excellent";
  };

  return (
    <AppLayout showSearch searchQuery={search} onSearchChange={setSearch}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
          <span className="text-xs text-muted-foreground">{filtered.length} analyses</span>
        </motion.div>

        <div className="space-y-2">
          {filtered.map((chat, i) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel rounded-xl p-4 flex items-center justify-between group"
            >
              <Link to={`/chat/${chat.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(chat.created_at).toLocaleDateString()} · Score: {chat.score ?? "—"} ·{" "}
                      <span className={riskColor(chat.risk_level)}>{chat.risk_level || "—"}</span>
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(chat.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <Link to={`/chat/${chat.id}`}>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? "No matching analyses found" : "No analyses yet. Start one from the sidebar!"}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Chats;
