import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ value, duration = 1.5, prefix = "", suffix = "", className = "" }: AnimatedCounterProps) => {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v)}${suffix}`);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (value > 0 && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    } else if (value > 0) {
      spring.set(value);
    }
  }, [value, spring, hasAnimated]);

  return <motion.span className={className}>{display}</motion.span>;
};

export default AnimatedCounter;
