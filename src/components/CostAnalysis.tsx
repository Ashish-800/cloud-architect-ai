import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import { DollarSign, TrendingDown, ArrowDown } from "lucide-react";

interface CostAnalysisProps {
  costAnalysis: {
    currentCost: number;
    optimizedCost: number;
    monthlySavings: number;
  };
}

const CostAnalysis = ({ costAnalysis }: CostAnalysisProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-panel rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-5">Cost Optimization</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-2">
          <DollarSign className="h-5 w-5 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">Current</p>
          <AnimatedCounter
            value={costAnalysis.currentCost}
            prefix="$"
            className="text-xl font-mono font-bold text-foreground"
          />
          <p className="text-xs text-muted-foreground">/month</p>
        </div>
        <div className="text-center space-y-2 flex flex-col items-center justify-center">
          <ArrowDown className="h-5 w-5 text-primary animate-pulse-glow" />
          <AnimatedCounter
            value={costAnalysis.monthlySavings}
            prefix="-$"
            className="text-lg font-mono font-bold text-primary"
          />
          <p className="text-xs text-primary">savings</p>
        </div>
        <div className="text-center space-y-2">
          <TrendingDown className="h-5 w-5 text-score-excellent mx-auto" />
          <p className="text-xs text-muted-foreground">Optimized</p>
          <AnimatedCounter
            value={costAnalysis.optimizedCost}
            prefix="$"
            className="text-xl font-mono font-bold text-score-excellent"
          />
          <p className="text-xs text-muted-foreground">/month</p>
        </div>
      </div>
    </motion.div>
  );
};

export default CostAnalysis;
