/**
 * Curated Lucide icons for venture cards.
 * Not an exhaustive set — the icons that actually mean something
 * in this product. Add as needed; keep it under ~30.
 */
import {
  AlertCircle,
  Users,
  Sparkles,
  Layers,
  FileText,
  Code2,
  Database,
  Server,
  Rocket,
  Send,
  Calendar,
  Mail,
  Target,
  TrendingUp,
  BarChart3,
  FlaskConical,
  Package,
  Megaphone,
  Wallet,
  Beaker,
  Compass,
  BookOpen,
  Award,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  // Strategy
  'problem': AlertCircle,
  'persona': Users,
  'value': Sparkles,
  'sector': Layers,
  'positioning': Compass,
  'wedge': Target,

  // Product
  'prd': FileText,
  'priority': Package,
  'roadmap': Calendar,
  'prototype': FlaskConical,

  // Engineering
  'architecture': Layers,
  'api': Code2,
  'ui': Package,
  'stack': Server,
  'data': Database,
  'deploy': Rocket,
  'repo': Code2,

  // GTM / Campaigns
  'plan': Calendar,
  'channel': Megaphone,
  'email': Mail,
  'campaign': Send,
  'landing': Rocket,

  // Sales / Growth
  'pipeline': TrendingUp,
  'outreach': Send,
  'experiment': Beaker,
  'cohort': BarChart3,

  // Analytics / Knowledge
  'signal': BarChart3,
  'report': FileText,
  'library': BookOpen,
  'insight': Sparkles,
  'gap': AlertCircle,

  // Outcomes
  'ledger': Wallet,
  'milestone': Award,
};

export function getIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}
