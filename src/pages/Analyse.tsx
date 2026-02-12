import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import ArchitectureScore from "@/components/ArchitectureScore";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import CostAnalysis from "@/components/CostAnalysis";
import Recommendations from "@/components/Recommendations";
import { analyzeArchitecture, type AnalysisResult } from "@/lib/analyzeArchitecture";

const PLACEHOLDER = `Example: We use 3 EC2 instances behind an ALB with Auto Scaling. RDS PostgreSQL with Multi-AZ for the database. CloudFront CDN for static assets. VPC with private subnets, WAF enabled. Redis ElastiCache for session management. CloudWatch for monitoring.`;

const Analyse = () => {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));
    const analysis = analyzeArchitecture(input);
    setResult(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-radial-fade" />

      <Navbar />

      <main className="relative pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Architecture <span className="gradient-text">Analyzer</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe your cloud infrastructure and get instant intelligent analysis
            </p>
          </motion.div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-xl p-6 space-y-4"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={5}
              className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none font-mono transition-all"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {input.length > 0 ? `${input.length} characters` : "Describe your architecture above"}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Loading */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-12"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse-glow" />
                </div>
                <p className="text-sm text-muted-foreground">AI is analyzing your architecture...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArchitectureScore score={result.architectureScore} />
                  <CostAnalysis costAnalysis={result.costAnalysis} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScoreBreakdown breakdown={result.breakdown} />
                  <Recommendations recommendations={result.recommendations} />
                </div>
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
      </main>
    </div>
  );
};

export default Analyse;
