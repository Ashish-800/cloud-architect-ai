import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface RecommendationsProps {
  recommendations: string[];
}

const Recommendations = ({ recommendations }: RecommendationsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-panel rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        Recommendations
      </h3>
      <ul className="space-y-3">
        {recommendations.map((rec, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="flex items-start gap-3 text-sm text-muted-foreground"
          >
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {rec}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default Recommendations;
