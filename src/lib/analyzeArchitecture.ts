export interface AnalysisResult {
  architectureScore: number;
  breakdown: {
    scalability: number;
    reliability: number;
    security: number;
    costEfficiency: number;
  };
  costAnalysis: {
    currentCost: number;
    optimizedCost: number;
    monthlySavings: number;
  };
  recommendations: string[];
  timestamp: string;
}

const KEYWORDS: Record<string, { category: keyof AnalysisResult["breakdown"]; weight: number }[]> = {
  "auto scaling": [{ category: "scalability", weight: 12 }, { category: "reliability", weight: 5 }],
  "autoscaling": [{ category: "scalability", weight: 12 }, { category: "reliability", weight: 5 }],
  "load balancer": [{ category: "scalability", weight: 10 }, { category: "reliability", weight: 8 }],
  "alb": [{ category: "scalability", weight: 10 }, { category: "reliability", weight: 8 }],
  "nlb": [{ category: "scalability", weight: 8 }, { category: "reliability", weight: 6 }],
  "cdn": [{ category: "scalability", weight: 8 }, { category: "costEfficiency", weight: 6 }],
  "cloudfront": [{ category: "scalability", weight: 8 }, { category: "costEfficiency", weight: 6 }],
  "redis": [{ category: "scalability", weight: 7 }, { category: "costEfficiency", weight: 5 }],
  "elasticache": [{ category: "scalability", weight: 7 }, { category: "costEfficiency", weight: 5 }],
  "rds": [{ category: "reliability", weight: 8 }, { category: "security", weight: 4 }],
  "aurora": [{ category: "reliability", weight: 10 }, { category: "scalability", weight: 7 }],
  "dynamodb": [{ category: "scalability", weight: 9 }, { category: "reliability", weight: 7 }],
  "multi-az": [{ category: "reliability", weight: 12 }],
  "multi az": [{ category: "reliability", weight: 12 }],
  "replica": [{ category: "reliability", weight: 8 }, { category: "scalability", weight: 5 }],
  "backup": [{ category: "reliability", weight: 6 }],
  "waf": [{ category: "security", weight: 12 }],
  "firewall": [{ category: "security", weight: 10 }],
  "encryption": [{ category: "security", weight: 10 }],
  "ssl": [{ category: "security", weight: 8 }],
  "tls": [{ category: "security", weight: 8 }],
  "iam": [{ category: "security", weight: 9 }],
  "vpc": [{ category: "security", weight: 8 }],
  "private subnet": [{ category: "security", weight: 7 }],
  "security group": [{ category: "security", weight: 6 }],
  "lambda": [{ category: "costEfficiency", weight: 10 }, { category: "scalability", weight: 8 }],
  "serverless": [{ category: "costEfficiency", weight: 10 }, { category: "scalability", weight: 8 }],
  "fargate": [{ category: "costEfficiency", weight: 7 }, { category: "scalability", weight: 6 }],
  "spot instance": [{ category: "costEfficiency", weight: 9 }],
  "reserved instance": [{ category: "costEfficiency", weight: 8 }],
  "s3": [{ category: "costEfficiency", weight: 5 }, { category: "reliability", weight: 4 }],
  "ec2": [{ category: "scalability", weight: 3 }],
  "ecs": [{ category: "scalability", weight: 6 }, { category: "reliability", weight: 4 }],
  "kubernetes": [{ category: "scalability", weight: 9 }, { category: "reliability", weight: 7 }],
  "eks": [{ category: "scalability", weight: 9 }, { category: "reliability", weight: 7 }],
  "api gateway": [{ category: "scalability", weight: 6 }, { category: "security", weight: 5 }],
  "cloudwatch": [{ category: "reliability", weight: 6 }],
  "monitoring": [{ category: "reliability", weight: 7 }],
  "ci/cd": [{ category: "reliability", weight: 5 }],
  "docker": [{ category: "scalability", weight: 4 }],
  "microservices": [{ category: "scalability", weight: 8 }, { category: "reliability", weight: 5 }],
};

const RECOMMENDATIONS_MAP: Record<string, string> = {
  scalability: "Consider adding Auto Scaling groups and a CDN for better scalability",
  reliability: "Add Multi-AZ deployments and automated backups for higher reliability",
  security: "Implement WAF, encryption at rest/transit, and VPC with private subnets",
  costEfficiency: "Explore serverless options, spot instances, or reserved instances to reduce costs",
};

export function analyzeArchitecture(description: string): AnalysisResult {
  const lower = description.toLowerCase();
  const scores = { scalability: 20, reliability: 20, security: 20, costEfficiency: 20 };

  for (const [keyword, effects] of Object.entries(KEYWORDS)) {
    if (lower.includes(keyword)) {
      for (const { category, weight } of effects) {
        scores[category] = Math.min(100, scores[category] + weight);
      }
    }
  }

  // Clamp all scores
  for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
    scores[key] = Math.min(100, Math.max(0, scores[key]));
  }

  const architectureScore = Math.round(
    scores.scalability * 0.3 +
    scores.reliability * 0.25 +
    scores.security * 0.25 +
    scores.costEfficiency * 0.2
  );

  const baseCost = 800 + Math.random() * 1200;
  const savingsPercent = scores.costEfficiency / 100 * 0.4;
  const optimizedCost = baseCost * (1 - savingsPercent);

  const recommendations: string[] = [];
  for (const [key, value] of Object.entries(scores)) {
    if (value < 50) {
      recommendations.push(RECOMMENDATIONS_MAP[key]);
    }
  }
  if (recommendations.length === 0) {
    recommendations.push("Great architecture! Consider adding observability and chaos engineering for further resilience.");
  }

  return {
    architectureScore,
    breakdown: scores,
    costAnalysis: {
      currentCost: Math.round(baseCost),
      optimizedCost: Math.round(optimizedCost),
      monthlySavings: Math.round(baseCost - optimizedCost),
    },
    recommendations,
    timestamp: new Date().toISOString(),
  };
}
