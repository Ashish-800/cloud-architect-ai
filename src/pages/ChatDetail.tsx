import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ArchitectureScore from "@/components/ArchitectureScore";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import CostAnalysis from "@/components/CostAnalysis";
import RiskPanel from "@/components/RiskPanel";
import AIExplanation from "@/components/AIExplanation";
import ImprovementRoadmap from "@/components/ImprovementRoadmap";
import ExtractedArchitecture from "@/components/ExtractedArchitecture";
import type { AnalysisResult } from "@/lib/types";

const ChatDetail = () => {
  const { chatId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !chatId) return;
    supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setChat(data);
        setLoading(false);
      });
  }, [user, chatId]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!chat) {
    return <Navigate to="/chats" replace />;
  }

  const result = chat.ai_response as AnalysisResult | null;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-bold text-foreground">{chat.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(chat.created_at).toLocaleString()}
          </p>
        </motion.div>

        {/* Original Input */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Architecture Input</h3>
          <p className="text-sm text-foreground font-mono whitespace-pre-wrap">{chat.architecture_input}</p>
        </div>

        {result && (
          <div className="space-y-6">
            <ExtractedArchitecture summary={result.architecture_summary} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ArchitectureScore score={result.scores.overall} />
              <div className="lg:col-span-2">
                <ScoreBreakdown scores={result.scores} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RiskPanel riskLevel={result.risk_analysis.risk_level} risks={result.risk_analysis.risks} />
              <CostAnalysis costAnalysis={result.cost_analysis} />
            </div>
            <ImprovementRoadmap phases={result.improvement_plan} />
            <AIExplanation
              explanation={result.ai_explanation}
              confidenceScore={result.confidence_score}
              maturityLevel={result.maturity_level}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ChatDetail;
