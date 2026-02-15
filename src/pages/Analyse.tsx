import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Cpu } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import Hyperspeed from "@/components/Hyperspeed";
import ArchitectureScore from "@/components/ArchitectureScore";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import CostAnalysis from "@/components/CostAnalysis";
import RiskPanel from "@/components/RiskPanel";
import SimulationPanel from "@/components/SimulationPanel";
import AIExplanation from "@/components/AIExplanation";
import ImprovementRoadmap from "@/components/ImprovementRoadmap";
import ExtractedArchitecture from "@/components/ExtractedArchitecture";
import { type AnalysisResult } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLACEHOLDER = `Example: We use 3 EC2 instances behind an ALB with Auto Scaling. RDS PostgreSQL with Multi-AZ for the database. CloudFront CDN for static assets. VPC with private subnets, WAF enabled. Redis ElastiCache for session management. CloudWatch for monitoring.`;

const Analyse = () => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-architecture", {
        body: { description: input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);

      // Save to database
      if (user) {
        const title = input.slice(0, 60).replace(/\n/g, " ").trim() || "Untitled Analysis";
        await supabase.from("chats").insert({
          user_id: user.id,
          title,
          architecture_input: input,
          ai_response: analysisResult as any,
          score: analysisResult.scores.overall,
          cost_estimate: analysisResult.cost_analysis.total_current,
          risk_level: analysisResult.risk_analysis.risk_level,
        });
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast.error(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background - only show after results */}
        {result && !isAnalyzing && (
          <>
            <div className="absolute inset-0 z-0">
              <Hyperspeed
                effectOptions={{
                  distortion: "turbulentDistortion",
                  length: 400,
                  roadWidth: 10,
                  islandWidth: 2,
                  lanesPerRoad: 3,
                  fov: 90,
                  fovSpeedUp: 150,
                  speedUp: 2,
                  carLightsFade: 0.4,
                  totalSideLightSticks: 20,
                  lightPairsPerRoadWay: 40,
                  shoulderLinesWidthPercentage: 0.05,
                  brokenLinesWidthPercentage: 0.1,
                  brokenLinesLengthPercentage: 0.5,
                  lightStickWidth: [0.12, 0.5],
                  lightStickHeight: [1.3, 1.7],
                  movingAwaySpeed: [60, 80],
                  movingCloserSpeed: [-120, -160],
                  carLightsLength: [12, 80],
                  carLightsRadius: [0.05, 0.14],
                  carWidthPercentage: [0.3, 0.5],
                  carShiftX: [-0.8, 0.8],
                  carFloorSeparation: [0, 5],
                  colors: {
                    roadColor: 0x080808,
                    islandColor: 0x0a0a0a,
                    background: 0x000000,
                    shoulderLines: 0x131318,
                    brokenLines: 0x131318,
                    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
                    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
                    sticks: 0x03b3c3,
                  },
                }}
              />
            </div>
            <div className="absolute inset-0 bg-background/60 z-[1]" />
          </>
        )}

        <div className="relative z-[2] py-8 px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Architecture <span className="gradient-text">Intelligence Engine</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Explainable, deterministic cloud architecture evaluation with risk modeling & simulation
              </p>
            </motion.div>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel rounded-xl p-5 space-y-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={4}
                className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none font-mono transition-all"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {input.length > 0 ? `${input.length} characters` : "Describe your cloud architecture above"}
                </span>
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Analyze Architecture
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Loading */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-12">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Cpu className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse-glow" />
                  </div>
                  <p className="text-sm text-muted-foreground">Decomposing architecture & running deterministic evaluation...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && !isAnalyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SimulationPanel
                      architectureSummary={result.architecture_summary}
                      onSimulationResult={(simResult) => setResult(simResult)}
                    />
                    <ImprovementRoadmap phases={result.improvement_plan} />
                  </div>
                  <AIExplanation
                    explanation={result.ai_explanation}
                    confidenceScore={result.confidence_score}
                    maturityLevel={result.maturity_level}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-xs text-muted-foreground"
                  >
                    Analysis completed at {new Date(result.timestamp).toLocaleString()}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analyse;
