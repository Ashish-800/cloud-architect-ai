import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Zap, Shield, BarChart3, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Analysis",
    description: "Describe your architecture in plain English and get instant intelligent scoring.",
  },
  {
    icon: BarChart3,
    title: "Score Breakdown",
    description: "Detailed metrics across scalability, reliability, security, and cost efficiency.",
  },
  {
    icon: Zap,
    title: "Cost Optimization",
    description: "Discover savings opportunities and get optimized cost projections.",
  },
  {
    icon: Shield,
    title: "Security Insights",
    description: "Identify vulnerabilities and get actionable security recommendations.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-fade" />

      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              AI-Powered Cloud Intelligence
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-foreground">Analyze Your</span>
              <br />
              <span className="gradient-text neon-glow">Cloud Architecture</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Describe your infrastructure in natural language. Get instant scoring, cost optimization,
              and actionable recommendations powered by intelligent analysis.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                to="/analyse"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.3)] hover:scale-105"
              >
                Launch Analyzer
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="glass-panel-hover rounded-xl p-6 group cursor-default"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-8 px-6">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 AI Cloud Mentor</span>
          <span className="gradient-text font-medium">Built for cloud excellence</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
