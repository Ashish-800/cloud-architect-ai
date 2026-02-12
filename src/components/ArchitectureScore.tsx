import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

interface ArchitectureScoreProps {
  score: number;
}

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-score-excellent";
  if (score >= 50) return "text-score-good";
  if (score >= 30) return "text-score-fair";
  return "text-score-poor";
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Needs Work";
  return "Critical";
};

const ArchitectureScore = ({ score }: ArchitectureScoreProps) => {
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-panel rounded-xl p-6 flex flex-col items-center"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Architecture Score</h3>
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
            className="drop-shadow-[0_0_8px_hsl(var(--neon-cyan)/0.5)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedCounter
            value={score}
            className={`text-4xl font-mono font-bold ${getScoreColor(score)}`}
          />
          <span className="text-xs text-muted-foreground mt-1">{getScoreLabel(score)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ArchitectureScore;
