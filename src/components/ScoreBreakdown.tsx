import { motion } from "framer-motion";

interface ScoreBreakdownProps {
  breakdown: {
    scalability: number;
    reliability: number;
    security: number;
    costEfficiency: number;
  };
}

const categories = [
  { key: "scalability" as const, label: "Scalability", icon: "📈" },
  { key: "reliability" as const, label: "Reliability", icon: "🛡️" },
  { key: "security" as const, label: "Security", icon: "🔐" },
  { key: "costEfficiency" as const, label: "Cost Efficiency", icon: "💰" },
];

const getBarColor = (score: number) => {
  if (score >= 75) return "bg-score-excellent";
  if (score >= 50) return "bg-score-good";
  if (score >= 30) return "bg-score-fair";
  return "bg-score-poor";
};

const ScoreBreakdown = ({ breakdown }: ScoreBreakdownProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-panel rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-5">Score Breakdown</h3>
      <div className="space-y-5">
        {categories.map((cat, i) => {
          const score = breakdown[cat.key];
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.label}
                </span>
                <span className="text-sm font-mono font-semibold text-foreground">{score}/100</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${getBarColor(score)} progress-glow`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScoreBreakdown;
