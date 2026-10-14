import { Venture } from '@/lib/types';

export interface HealthDimension {
  key: string;
  label: string;
  value: number;
  status: 'critical' | 'needs_attention' | 'good' | 'excellent';
  description: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface VentureHealth {
  overall: number;
  status: 'critical' | 'needs_attention' | 'good' | 'excellent';
  dimensions: HealthDimension[];
  momentum: 'improving' | 'stable' | 'declining';
  biggestRisk: string;
  strongestArea: string;
  nextAction: string;
}

export function calculateVentureHealth(venture: Venture): VentureHealth {
  const health = venture.health || {};
  const dimensions: HealthDimension[] = [];

  // Define dimension configurations
  const configs = [
    { key: 'strategy', label: 'Strategy', description: 'Vision, ICP, positioning clarity' },
    { key: 'product', label: 'Product', description: 'Requirements, features, roadmap' },
    { key: 'engineering', label: 'Engineering', description: 'Architecture, tasks, builds' },
    { key: 'gtm', label: 'GTM', description: 'ICP, channels, experiments' },
    { key: 'marketing', label: 'Marketing', description: 'Campaigns, channel performance' },
    { key: 'content', label: 'Content', description: 'Calendar, drafts, publishing' },
    { key: 'sales', label: 'Sales', description: 'Prospects, pipeline, outreach' },
    { key: 'growth', label: 'Growth', description: 'Experiments, acquisition, metrics' },
    { key: 'analytics', label: 'Analytics', description: 'KPIs, trends, insights' },
    { key: 'knowledge', label: 'Knowledge', description: 'Decisions, insights, research' },
    { key: 'outcomes', label: 'Outcomes', description: 'Results, decisions, recommendations' }
  ];

  let total = 0;
  let maxScore = 0;
  let highestKey = '';
  let highestValue = 0;
  let lowestKey = '';
  let lowestValue = 100;

  configs.forEach((config) => {
    const value = health[config.key as keyof typeof health] || 0;
    total += value;
    maxScore += 100;

    const status = value >= 80 ? 'excellent' : value >= 60 ? 'good' : value >= 40 ? 'needs_attention' : 'critical';
    dimensions.push({
      key: config.key,
      label: config.label,
      value,
      status,
      description: config.description
    });

    if (value > highestValue) {
      highestValue = value;
      highestKey = config.key;
    }
    if (value < lowestValue) {
      lowestValue = value;
      lowestKey = config.key;
    }
  });

  const overall = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;
  const status = overall >= 80 ? 'excellent' : overall >= 60 ? 'good' : overall >= 40 ? 'needs_attention' : 'critical';

  // Determine momentum based on trends (simplified - can be enhanced with historical data)
  const momentum = overall > 65 ? 'improving' : overall > 45 ? 'stable' : 'declining';

  // Determine biggest risk and strongest area
  const biggestRisk = lowestKey ? configs.find(c => c.key === lowestKey)?.label || 'Unknown' : 'Unknown';
  const strongestArea = highestKey ? configs.find(c => c.key === highestKey)?.label || 'Unknown' : 'Unknown';

  // Determine next action based on lowest health area
  let nextAction = '';
  if (lowestKey === 'strategy') nextAction = 'Review and refine your venture strategy';
  else if (lowestKey === 'product') nextAction = 'Define or update product requirements';
  else if (lowestKey === 'engineering') nextAction = 'Address engineering blockers or technical debt';
  else if (lowestKey === 'gtm') nextAction = 'Validate your ICP and go-to-market channels';
  else if (lowestKey === 'marketing') nextAction = 'Launch or optimize marketing campaigns';
  else if (lowestKey === 'content') nextAction = 'Create or review content strategy';
  else if (lowestKey === 'sales') nextAction = 'Build or review sales pipeline';
  else if (lowestKey === 'growth') nextAction = 'Design and run growth experiments';
  else if (lowestKey === 'analytics') nextAction = 'Set up or review analytics tracking';
  else if (lowestKey === 'knowledge') nextAction = 'Capture and organize venture knowledge';
  else if (lowestKey === 'outcomes') nextAction = 'Review and record venture outcomes';
  else nextAction = 'Review overall venture health';

  return {
    overall,
    status,
    dimensions,
    momentum,
    biggestRisk: `${biggestRisk} at ${lowestValue}%`,
    strongestArea: `${strongestArea} at ${highestValue}%`,
    nextAction
  };
}

// Helper function to get color based on health value
export function getHealthColor(value: number): string {
  if (value >= 80) return 'text-green-600';
  if (value >= 60) return 'text-amber-600';
  if (value >= 40) return 'text-orange-600';
  return 'text-red-600';
}

// Helper function to get status label
export function getHealthStatus(value: number): string {
  if (value >= 80) return 'Excellent';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Needs Attention';
  return 'Critical';
}

// Helper function to get progress color for health bar
export function getHealthBarColor(value: number): string {
  if (value >= 80) return 'bg-green-500';
  if (value >= 60) return 'bg-amber-500';
  if (value >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

/* ============================================================
   Trend direction — single source of truth
   ============================================================ */

export type TrendDirection = 'up' | 'steady' | 'down';

export function trendDirectionFromMomentum(
  momentum: 'improving' | 'stable' | 'declining'
): TrendDirection {
  if (momentum === 'improving') return 'up';
  if (momentum === 'declining') return 'down';
  return 'steady';
}
