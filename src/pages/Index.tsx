import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Zap, Shield, BarChart3, ArrowRight, Brain, AlertTriangle, Sliders, Map } from "lucide-react";
import Navbar from "@/components/Navbar";
import TrueFocus from "@/components/TrueFocus";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Cpu,
    title: "Architecture Decomposition",
    description: "AI extracts structured components from natural language descriptions.",
  },
  {
    icon: BarChart3,
    title: "Deterministic Scoring",
    description: "Traceable, rule-based evaluation grounded in AWS Well-Architected Framework.",
  },
  {
    icon: AlertTriangle,
    title: "Risk & Failure Modeling",
    description: "Detect single points of failure, bottlenecks, and security vulnerabilities.",
  },
  {
    icon: Zap,
    title: "Cost Projection Engine",
    description: "Category-level cost breakdown with optimization recommendations.",
  },
  {
    icon: Sliders,
    title: "Architecture Simulator",
    description: "Test traffic spikes, multi-region, and cost targets with live re-scoring.",
  },
  {
    icon: Brain,
    title: "AI Mentor Layer",
    description: "AI explains trade-offs and reasoning — scores remain deterministic.",
  },
  {
    icon: Shield,
    title: "Explainable Transparency",
    description: "Every score shows deductions, violated principles, and reasoning chains.",
  },
  {
    icon: Map,
    title: "Improvement Roadmap",
    description: "Phased upgrade plan with specific actions and projected impact.",
  },
];

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-fade" />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Explainable Cloud Intelligence Engine
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-foreground">Evaluate Your</span>
              <br />
              <TrueFocus
                sentence="Cloud Architecture"
                manualMode={false}
                blurAmount={4}
                borderColor="hsl(185, 80%, 55%)"
                glowColor="hsla(185, 80%, 55%, 0.6)"
                animationDuration={0.5}
                pauseBetweenAnimations={1.5}
                className="text-5xl sm:text-6xl lg:text-7xl neon-glow mt-1"
              />
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deterministic scoring, risk modeling, cost projection, and simulation — powered by engineering principles, explained by AI.
            </p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.3)] hover:scale-105"
              >
                {user ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07, duration: 0.5 }}
                className="glass-panel-hover rounded-xl p-5 group cursor-default"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-8 px-6">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 AI Cloud Mentor</span>
          <span className="gradient-text font-medium">Explainable Cloud Architecture Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
