import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── AWS SIGNATURE V4 ───
async function sign(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg));
}

async function getSignatureKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await sign(new TextEncoder().encode("AWS4" + secret), date);
  const kRegion = await sign(kDate, region);
  const kService = await sign(kRegion, service);
  const kSigning = await sign(kService, "aws4_request");
  return kSigning;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(hash);
}

async function bedrockInvoke(modelId: string, payload: object): Promise<any> {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const region = Deno.env.get("AWS_REGION") || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured");
  }

  const body = JSON.stringify(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const path = `/model/${modelId}/invoke`;
  const service = "bedrock";

  const payloadHash = await sha256Hex(body);

  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";
  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await sign(signingKey, stringToSign));

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Host": host,
      "X-Amz-Date": amzDate,
      "Authorization": authorizationHeader,
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Bedrock API error [${response.status}]: ${errText}`);
  }

  return response.json();
}

// ─── BEDROCK CLAUDE CALL ───
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

  const data = await bedrockInvoke(modelId, {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    temperature: 0.3,
    top_p: 0.9,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return data?.content?.[0]?.text || "";
}

// ─── AI DECOMPOSITION PROMPT ───
const DECOMPOSITION_PROMPT = `You are a cloud architecture decomposition engine. Extract structured components from the user's description. Return ONLY valid JSON with these exact fields:

{
  "compute_model": "ec2|ecs|eks|lambda|fargate|none",
  "compute_count": <number of instances, 0 if not mentioned>,
  "scaling_type": "auto_scaling|manual|none",
  "database_type": "rds|aurora|dynamodb|redis_only|none",
  "database_multi_az": <boolean>,
  "database_replicas": <number, 0 if none>,
  "caching_layer": "redis|elasticache|memcached|none",
  "load_balancer": "alb|nlb|none",
  "cdn": "cloudfront|cloudflare|none",
  "vpc": <boolean>,
  "private_subnets": <boolean>,
  "waf": <boolean>,
  "encryption": <boolean>,
  "ssl_tls": <boolean>,
  "iam_configured": <boolean>,
  "security_groups": <boolean>,
  "monitoring": "cloudwatch|datadog|prometheus|none",
  "ci_cd": <boolean>,
  "container_orchestration": "kubernetes|ecs|none",
  "serverless_components": <number of serverless services>,
  "multi_region": <boolean>,
  "backup_strategy": <boolean>,
  "spot_instances": <boolean>,
  "reserved_instances": <boolean>,
  "api_gateway": <boolean>,
  "microservices": <boolean>,
  "estimated_users": <number, infer from context or 0>
}

Infer values from context. If something is not mentioned, default to false/none/0. Return ONLY valid JSON.`;

// ─── AI EXPLANATION PROMPT ───
const EXPLANATION_PROMPT = `You are an expert cloud architecture mentor. Given the architecture analysis results below, provide a 3-4 paragraph expert explanation covering:
1. Overall assessment of the architecture's strengths and weaknesses
2. Key risk areas and their potential business impact
3. Prioritized improvement recommendations with reasoning
4. Trade-offs the architect should consider

Be specific, technical, and actionable. Reference specific AWS services and cloud patterns. Do NOT use markdown formatting. Keep it under 300 words.`;

// ─── DETERMINISTIC SCORING ENGINE ───
interface ArchSummary {
  compute_model: string;
  compute_count: number;
  scaling_type: string;
  database_type: string;
  database_multi_az: boolean;
  database_replicas: number;
  caching_layer: string;
  load_balancer: string;
  cdn: string;
  vpc: boolean;
  private_subnets: boolean;
  waf: boolean;
  encryption: boolean;
  ssl_tls: boolean;
  iam_configured: boolean;
  security_groups: boolean;
  monitoring: string;
  ci_cd: boolean;
  container_orchestration: string;
  serverless_components: number;
  multi_region: boolean;
  backup_strategy: boolean;
  spot_instances: boolean;
  reserved_instances: boolean;
  api_gateway: boolean;
  microservices: boolean;
  estimated_users: number;
}

interface SimParams {
  traffic_multiplier?: number;
  add_regions?: number;
  cost_target?: number;
}

function scoreScalability(arch: ArchSummary, sim?: SimParams) {
  let score = 0;
  const max = 100;
  const explanation: string[] = [];
  const violated: string[] = [];

  if (arch.scaling_type === "auto_scaling") {
    score += 25;
    explanation.push("Auto Scaling detected (+25)");
  } else if (arch.scaling_type === "manual") {
    score += 8;
    explanation.push("Manual scaling only (+8)");
    violated.push("Elastic Scalability Principle");
  } else {
    explanation.push("No scaling strategy detected (+0)");
    violated.push("Elastic Scalability Principle");
  }

  if (arch.load_balancer !== "none") {
    score += 20;
    explanation.push(`${arch.load_balancer.toUpperCase()} load balancer present (+20)`);
  } else {
    explanation.push("No load balancer detected (+0)");
    violated.push("Horizontal Distribution");
  }

  if (arch.cdn !== "none") {
    score += 10;
    explanation.push(`CDN (${arch.cdn}) configured (+10)`);
  } else {
    explanation.push("No CDN configured (+0)");
    violated.push("Edge Caching Strategy");
  }

  if (arch.caching_layer !== "none") {
    score += 10;
    explanation.push(`Caching layer (${arch.caching_layer}) present (+10)`);
  } else {
    explanation.push("No caching layer detected (+0)");
    violated.push("Latency Optimization");
  }

  if (arch.container_orchestration !== "none") {
    score += 15;
    explanation.push(`Container orchestration (${arch.container_orchestration}) enabled (+15)`);
  } else if (arch.serverless_components > 0) {
    score += 15;
    explanation.push(`Serverless components detected (+15)`);
  } else if (arch.compute_model === "fargate") {
    score += 12;
    explanation.push("Fargate compute model (+12)");
  } else {
    explanation.push("No container orchestration or serverless (+0)");
    violated.push("Cloud-Native Scalability");
  }

  if (arch.microservices) {
    score += 10;
    explanation.push("Microservices architecture (+10)");
  } else {
    explanation.push("Monolithic architecture detected (+0)");
  }

  if (arch.api_gateway) {
    score += 5;
    explanation.push("API Gateway configured (+5)");
  }

  if (arch.multi_region || (sim?.add_regions && sim.add_regions > 0)) {
    score += 5;
    explanation.push("Multi-region deployment (+5)");
  }

  return { score: Math.min(score, max), max, explanation, violated_principles: violated };
}

function scoreReliability(arch: ArchSummary) {
  let score = 0;
  const max = 100;
  const explanation: string[] = [];
  const violated: string[] = [];

  if (arch.database_multi_az) {
    score += 25;
    explanation.push("Multi-AZ database deployment (+25)");
  } else {
    explanation.push("No Multi-AZ detected (-25 potential)");
    violated.push("Availability Zone Redundancy");
  }

  if (arch.database_replicas > 0) {
    score += Math.min(10, arch.database_replicas * 5);
    explanation.push(`${arch.database_replicas} database replica(s) (+${Math.min(10, arch.database_replicas * 5)})`);
  }

  if (arch.backup_strategy) {
    score += 15;
    explanation.push("Backup strategy configured (+15)");
  } else {
    explanation.push("No backup strategy detected (+0)");
    violated.push("Disaster Recovery Readiness");
  }

  if (arch.monitoring !== "none") {
    score += 15;
    explanation.push(`Monitoring (${arch.monitoring}) active (+15)`);
  } else {
    explanation.push("No monitoring detected (+0)");
    violated.push("Observability Principle");
  }

  if (arch.load_balancer !== "none") {
    score += 10;
    explanation.push("Load balancer health checks implied (+10)");
  }

  if (arch.multi_region) {
    score += 10;
    explanation.push("Multi-region redundancy (+10)");
  } else {
    violated.push("Geographic Redundancy");
  }

  if (arch.ci_cd) {
    score += 10;
    explanation.push("CI/CD pipeline detected (+10)");
  } else {
    violated.push("Deployment Reliability");
  }

  if (arch.compute_count > 1) {
    score += 5;
    explanation.push(`Multiple compute instances (${arch.compute_count}) (+5)`);
  } else if (arch.compute_count === 1) {
    violated.push("Single Point of Failure - Compute");
  }

  return { score: Math.min(score, max), max, explanation, violated_principles: violated };
}

function scoreSecurity(arch: ArchSummary) {
  let score = 0;
  const max = 100;
  const explanation: string[] = [];
  const violated: string[] = [];

  if (arch.waf) {
    score += 20;
    explanation.push("WAF enabled (+20)");
  } else {
    explanation.push("No WAF detected (+0)");
    violated.push("Perimeter Defense");
  }

  if (arch.encryption) {
    score += 15;
    explanation.push("Encryption at rest/transit (+15)");
  } else {
    explanation.push("No encryption mentioned (+0)");
    violated.push("Data Encryption Standard");
  }

  if (arch.ssl_tls) {
    score += 10;
    explanation.push("SSL/TLS configured (+10)");
  } else {
    violated.push("Transport Layer Security");
  }

  if (arch.vpc) {
    score += 15;
    explanation.push("VPC configured (+15)");
  } else {
    explanation.push("No VPC isolation (+0)");
    violated.push("Network Isolation");
  }

  if (arch.private_subnets) {
    score += 10;
    explanation.push("Private subnets configured (+10)");
  } else {
    violated.push("Network Segmentation");
  }

  if (arch.iam_configured) {
    score += 15;
    explanation.push("IAM policies configured (+15)");
  } else {
    explanation.push("No IAM mentioned (+0)");
    violated.push("Least Privilege Access");
  }

  if (arch.security_groups) {
    score += 10;
    explanation.push("Security groups configured (+10)");
  }

  if (arch.api_gateway) {
    score += 5;
    explanation.push("API Gateway adds throttling/auth layer (+5)");
  }

  return { score: Math.min(score, max), max, explanation, violated_principles: violated };
}

function scoreCostEfficiency(arch: ArchSummary, sim?: SimParams) {
  let score = 0;
  const max = 100;
  const explanation: string[] = [];
  const violated: string[] = [];

  if (arch.serverless_components > 0 || arch.compute_model === "lambda") {
    score += 25;
    explanation.push("Serverless components reduce idle cost (+25)");
  } else if (arch.compute_model === "fargate") {
    score += 15;
    explanation.push("Fargate reduces operational overhead (+15)");
  }

  if (arch.reserved_instances) {
    score += 15;
    explanation.push("Reserved instances for baseline savings (+15)");
  }
  if (arch.spot_instances) {
    score += 10;
    explanation.push("Spot instances for batch/flexible workloads (+10)");
  }
  if (!arch.reserved_instances && !arch.spot_instances && arch.compute_model === "ec2") {
    violated.push("Instance Purchase Optimization");
  }

  if (arch.cdn !== "none") {
    score += 10;
    explanation.push("CDN reduces origin server load (+10)");
  }

  if (arch.caching_layer !== "none") {
    score += 10;
    explanation.push("Caching reduces database costs (+10)");
  }

  if (arch.scaling_type === "auto_scaling") {
    score += 15;
    explanation.push("Auto-scaling enables right-sizing (+15)");
  } else {
    violated.push("Dynamic Right-Sizing");
  }

  if (arch.monitoring !== "none") {
    score += 5;
    explanation.push("Monitoring enables cost visibility (+5)");
  }

  if (arch.database_type === "dynamodb" || arch.database_type === "aurora") {
    score += 5;
    explanation.push(`${arch.database_type} offers pay-per-use flexibility (+5)`);
  }

  if (sim?.cost_target && sim.cost_target > 0) {
    const penalty = Math.max(0, 10 - Math.floor(sim.cost_target / 10));
    if (penalty > 0) {
      score = Math.max(0, score - penalty);
      explanation.push(`Cost target constraint applied (-${penalty})`);
    }
  }

  return { score: Math.min(score, max), max, explanation, violated_principles: violated };
}

interface Risk {
  type: string;
  component: string;
  impact: string;
  severity: "critical" | "high" | "medium" | "low";
}

function analyzeRisks(arch: ArchSummary): { risk_level: string; risks: Risk[] } {
  const risks: Risk[] = [];

  if (arch.compute_count === 1 && arch.compute_model !== "lambda") {
    risks.push({ type: "Single Point of Failure", component: `Single ${arch.compute_model.toUpperCase()} instance`, impact: "Complete service downtime if instance fails. No failover capability.", severity: "critical" });
  }
  if (arch.scaling_type === "none") {
    risks.push({ type: "Scaling Bottleneck", component: "Compute layer", impact: "Cannot handle traffic spikes. Service degradation under load.", severity: "high" });
  }
  if (arch.compute_count > 1 && arch.load_balancer === "none") {
    risks.push({ type: "Traffic Distribution Gap", component: "Network layer", impact: "Multiple instances without load distribution. Uneven resource utilization.", severity: "medium" });
  }
  if (arch.database_type !== "none" && !arch.database_multi_az) {
    risks.push({ type: "Database Availability Risk", component: `${arch.database_type.toUpperCase()} database`, impact: "Single AZ deployment risks data loss and downtime during AZ failure.", severity: "high" });
  }
  if (!arch.backup_strategy && arch.database_type !== "none") {
    risks.push({ type: "Data Loss Risk", component: "Database layer", impact: "No backup strategy detected. Risk of irrecoverable data loss.", severity: "critical" });
  }
  if (!arch.waf) {
    risks.push({ type: "Application Security Risk", component: "Edge/Perimeter", impact: "No WAF protection against OWASP Top 10 attacks (SQLi, XSS, etc).", severity: "high" });
  }
  if (!arch.vpc) {
    risks.push({ type: "Network Isolation Risk", component: "Network layer", impact: "Resources may be publicly accessible. Increased attack surface.", severity: "high" });
  }
  if (!arch.encryption) {
    risks.push({ type: "Data Exposure Risk", component: "Data layer", impact: "Unencrypted data at rest/transit. Compliance and regulatory risk.", severity: "medium" });
  }
  if (arch.monitoring === "none") {
    risks.push({ type: "Blind Spot Risk", component: "Observability", impact: "No monitoring means delayed incident detection. Increased MTTR.", severity: "medium" });
  }
  if (arch.caching_layer === "none" && arch.estimated_users > 1000) {
    risks.push({ type: "Performance Saturation", component: "Application layer", impact: "High traffic without caching will cause latency spikes and DB overload.", severity: "medium" });
  }
  if (!arch.multi_region) {
    risks.push({ type: "Regional Dependency", component: "Infrastructure", impact: "Single region deployment. Regional outage causes complete service loss.", severity: "low" });
  }

  const criticalCount = risks.filter(r => r.severity === "critical").length;
  const highCount = risks.filter(r => r.severity === "high").length;
  let risk_level = "Low";
  if (criticalCount > 0) risk_level = "Critical";
  else if (highCount >= 2) risk_level = "High";
  else if (highCount === 1) risk_level = "Medium";

  return { risk_level, risks };
}

function analyzeCosts(arch: ArchSummary, sim?: SimParams) {
  const trafficMul = sim?.traffic_multiplier || 1;
  const breakdown: { category: string; current: number; optimized: number }[] = [];

  let computeCost = 0, computeOptimized = 0;
  if (arch.compute_model === "ec2") {
    computeCost = (arch.compute_count || 1) * 85 * trafficMul;
    computeOptimized = arch.reserved_instances ? computeCost * 0.6 : (arch.spot_instances ? computeCost * 0.5 : computeCost * 0.8);
  } else if (arch.compute_model === "ecs" || arch.compute_model === "fargate") {
    computeCost = (arch.compute_count || 2) * 65 * trafficMul;
    computeOptimized = computeCost * 0.75;
  } else if (arch.compute_model === "lambda") {
    computeCost = 25 * trafficMul;
    computeOptimized = computeCost * 0.9;
  } else if (arch.compute_model === "eks") {
    computeCost = 150 + (arch.compute_count || 3) * 70 * trafficMul;
    computeOptimized = computeCost * 0.7;
  }
  breakdown.push({ category: "Compute", current: Math.round(computeCost), optimized: Math.round(computeOptimized) });

  let dbCost = 0, dbOptimized = 0;
  if (arch.database_type === "rds") {
    dbCost = arch.database_multi_az ? 280 : 140;
    dbCost += arch.database_replicas * 100;
    dbOptimized = arch.reserved_instances ? dbCost * 0.65 : dbCost * 0.85;
  } else if (arch.database_type === "aurora") {
    dbCost = arch.database_multi_az ? 350 : 200;
    dbOptimized = dbCost * 0.8;
  } else if (arch.database_type === "dynamodb") {
    dbCost = 50 * trafficMul;
    dbOptimized = dbCost * 0.7;
  }
  if (dbCost > 0) breakdown.push({ category: "Database", current: Math.round(dbCost), optimized: Math.round(dbOptimized) });
  if (arch.caching_layer !== "none") breakdown.push({ category: "Caching", current: 45, optimized: 40 });
  if (arch.load_balancer !== "none") breakdown.push({ category: "Load Balancer", current: arch.load_balancer === "alb" ? 25 : 20, optimized: arch.load_balancer === "alb" ? 25 : 20 });
  if (arch.cdn !== "none") breakdown.push({ category: "CDN", current: Math.round(30 * trafficMul), optimized: Math.round(25 * trafficMul) });
  if (arch.monitoring !== "none") breakdown.push({ category: "Monitoring", current: 35, optimized: 35 });
  if (arch.waf) breakdown.push({ category: "WAF", current: 20, optimized: 20 });

  const regionMultiplier = arch.multi_region ? 1.8 : 1;
  const totalMultiplier = regionMultiplier + ((sim?.add_regions || 0) * 0.6);

  const total_current = Math.round(breakdown.reduce((s, b) => s + b.current, 0) * totalMultiplier);
  const total_optimized = Math.round(breakdown.reduce((s, b) => s + b.optimized, 0) * totalMultiplier);
  let finalOptimized = total_optimized;
  if (sim?.cost_target && sim.cost_target > 0 && sim.cost_target < total_optimized) finalOptimized = sim.cost_target;

  return {
    total_current,
    total_optimized: finalOptimized,
    monthly_savings: total_current - finalOptimized,
    breakdown: breakdown.map(b => ({ ...b, current: Math.round(b.current * totalMultiplier), optimized: Math.round(b.optimized * totalMultiplier) })),
  };
}

function calculateConfidence(arch: ArchSummary): number {
  const checks = [
    arch.compute_model !== "none", arch.compute_count > 0, arch.scaling_type !== "none",
    arch.database_type !== "none", arch.load_balancer !== "none", arch.vpc,
    arch.monitoring !== "none", arch.encryption, arch.ssl_tls, arch.iam_configured,
    arch.caching_layer !== "none", arch.cdn !== "none", arch.backup_strategy,
    arch.ci_cd, arch.estimated_users > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100) / 100;
}

function determineMaturity(overall: number, confidence: number): string {
  if (overall >= 80 && confidence >= 0.7) return "Enterprise Grade";
  if (overall >= 60 && confidence >= 0.5) return "Production Ready";
  if (overall >= 35 && confidence >= 0.3) return "Early Stage";
  return "Prototype";
}

function generateImprovementPlan(arch: ArchSummary, scores: any) {
  const phases: { phase: number; title: string; actions: string[]; impact: string }[] = [];
  let phaseNum = 1;

  if (scores.scalability.score < 50) {
    const actions: string[] = [];
    if (arch.scaling_type !== "auto_scaling") actions.push("Implement Auto Scaling Groups with target tracking policies");
    if (arch.load_balancer === "none") actions.push("Deploy Application Load Balancer with health checks");
    if (arch.caching_layer === "none") actions.push("Add ElastiCache Redis for session/query caching");
    if (actions.length > 0) phases.push({ phase: phaseNum++, title: "Scalability Foundation", actions, impact: `+${Math.min(40, 100 - scores.scalability.score)} scalability points` });
  }
  if (scores.reliability.score < 50) {
    const actions: string[] = [];
    if (!arch.database_multi_az) actions.push("Enable Multi-AZ for database failover");
    if (!arch.backup_strategy) actions.push("Configure automated daily backups with 30-day retention");
    if (arch.monitoring === "none") actions.push("Deploy CloudWatch with custom dashboards and alarms");
    if (!arch.ci_cd) actions.push("Set up CI/CD pipeline with blue-green deployments");
    if (actions.length > 0) phases.push({ phase: phaseNum++, title: "Reliability Hardening", actions, impact: `+${Math.min(40, 100 - scores.reliability.score)} reliability points` });
  }
  if (scores.security.score < 60) {
    const actions: string[] = [];
    if (!arch.waf) actions.push("Enable AWS WAF with managed rule sets (OWASP)");
    if (!arch.encryption) actions.push("Enable encryption at rest (KMS) and in transit");
    if (!arch.vpc) actions.push("Migrate to VPC with public/private subnet architecture");
    if (!arch.iam_configured) actions.push("Implement IAM roles with least-privilege policies");
    if (actions.length > 0) phases.push({ phase: phaseNum++, title: "Security Posture", actions, impact: `+${Math.min(40, 100 - scores.security.score)} security points` });
  }
  if (scores.cost_efficiency.score < 50) {
    const actions: string[] = [];
    if (!arch.reserved_instances && arch.compute_model === "ec2") actions.push("Purchase Reserved Instances for baseline capacity (up to 40% savings)");
    if (arch.serverless_components === 0) actions.push("Migrate suitable workloads to Lambda/Fargate");
    if (arch.cdn === "none") actions.push("Add CloudFront CDN to reduce origin server costs");
    if (actions.length > 0) phases.push({ phase: phaseNum++, title: "Cost Optimization", actions, impact: `+${Math.min(30, 100 - scores.cost_efficiency.score)} cost efficiency points` });
  }
  if (!arch.multi_region) {
    phases.push({ phase: phaseNum++, title: "Geographic Expansion", actions: ["Deploy to secondary AWS region with Route53 failover", "Configure cross-region database replication", "Set up CloudFront with multi-origin configuration"], impact: "+5-10 points across all categories" });
  }
  if (phases.length === 0) {
    phases.push({ phase: 1, title: "Advanced Optimization", actions: ["Implement chaos engineering with AWS Fault Injection Simulator", "Add distributed tracing with X-Ray", "Implement FinOps practices with Cost Explorer automation"], impact: "Operational excellence and cost visibility" });
  }
  return phases;
}

function applySimulation(arch: ArchSummary, sim: SimParams): ArchSummary {
  const modified = { ...arch };
  if (sim.add_regions && sim.add_regions > 0) modified.multi_region = true;
  if (sim.traffic_multiplier && sim.traffic_multiplier > 1) modified.estimated_users = Math.round((modified.estimated_users || 100) * sim.traffic_multiplier);
  return modified;
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { description, architecture_summary, simulation } = body;

    let arch: ArchSummary;

    if (architecture_summary) {
      arch = architecture_summary;
    } else if (description && typeof description === 'string' && description.trim().length > 0) {
      // Full analysis mode — use Amazon Bedrock Claude 3 Sonnet
      const awsAccessKey = Deno.env.get("AWS_ACCESS_KEY_ID");
      const awsSecretKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

      if (!awsAccessKey || !awsSecretKey) {
        // Fallback to Lovable AI if Bedrock not configured
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('No AI provider configured');

        const decompResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{ role: 'system', content: DECOMPOSITION_PROMPT }, { role: 'user', content: description }],
          }),
        });
        if (!decompResponse.ok) throw new Error(`AI fallback failed: ${decompResponse.status}`);
        const decompData = await decompResponse.json();
        const content = decompData.choices?.[0]?.message?.content || '';
        arch = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } else {
        // Use Amazon Bedrock Claude 3 Sonnet
        console.log("Using Amazon Bedrock Claude 3 Sonnet for decomposition...");
        const content = await callClaude(DECOMPOSITION_PROMPT, description);
        const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        arch = JSON.parse(clean);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Either description or architecture_summary is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const simParams: SimParams | undefined = simulation;
    const effectiveArch = simParams ? applySimulation(arch, simParams) : arch;

    const scalability = scoreScalability(effectiveArch, simParams);
    const reliability = scoreReliability(effectiveArch);
    const security = scoreSecurity(effectiveArch);
    const cost_efficiency = scoreCostEfficiency(effectiveArch, simParams);

    const overall = Math.round(scalability.score * 0.3 + reliability.score * 0.25 + security.score * 0.25 + cost_efficiency.score * 0.2);
    const scores = { overall, scalability, reliability, security, cost_efficiency };
    const risk_analysis = analyzeRisks(effectiveArch);
    const cost_analysis = analyzeCosts(effectiveArch, simParams);
    const confidence_score = calculateConfidence(effectiveArch);
    const maturity_level = determineMaturity(overall, confidence_score);
    const improvement_plan = generateImprovementPlan(effectiveArch, scores);

    // AI Explanation — use Bedrock if available, else Lovable AI
    let ai_explanation = "";
    if (!architecture_summary) {
      try {
        const awsAccessKey = Deno.env.get("AWS_ACCESS_KEY_ID");
        const awsSecretKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
        const analysisContext = `Architecture: ${JSON.stringify(arch)}\n\nScores: ${JSON.stringify(scores)}\n\nRisks: ${JSON.stringify(risk_analysis)}\n\nCost: ${JSON.stringify(cost_analysis)}`;

        if (awsAccessKey && awsSecretKey) {
          console.log("Using Amazon Bedrock Claude 3 Sonnet for explanation...");
          ai_explanation = await callClaude(EXPLANATION_PROMPT, analysisContext);
        } else {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (LOVABLE_API_KEY) {
            const explainResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: [{ role: 'system', content: EXPLANATION_PROMPT }, { role: 'user', content: analysisContext }] }),
            });
            if (explainResponse.ok) {
              const explainData = await explainResponse.json();
              ai_explanation = explainData.choices?.[0]?.message?.content || "";
            }
          }
        }
      } catch (e) {
        console.error('AI explanation failed:', e);
        ai_explanation = "AI explanation unavailable.";
      }
    }

    const result = {
      architecture_summary: effectiveArch,
      scores,
      risk_analysis,
      cost_analysis,
      improvement_plan,
      ai_explanation,
      confidence_score,
      maturity_level,
      ai_provider: Deno.env.get("AWS_ACCESS_KEY_ID") ? "Amazon Bedrock (Claude 3 Sonnet)" : "Lovable AI (Gemini)",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('analyze-architecture error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
