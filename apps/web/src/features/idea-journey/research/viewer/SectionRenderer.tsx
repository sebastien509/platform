import type { ResearchSection } from '@/lib/types';
import { HeadlineSection } from './sections/HeadlineSection';
import { MetricsSection } from './sections/MetricsSection';
import { TableSection } from './sections/TableSection';
import { NarrativeSection } from './sections/NarrativeSection';
import { QuoteSection } from './sections/QuoteSection';
import { CalloutSection } from './sections/CalloutSection';
import { ListSection } from './sections/ListSection';
import { ParagraphSection } from './sections/ParagraphSection';
import { CodeSection } from './sections/CodeSection';
import { TimelineSection } from './sections/TimelineSection';
import { HeroSection } from './sections/HeroSection';
import { FeatureGridSection } from './sections/FeatureGridSection';
import { PricingSection } from './sections/PricingSection';
import { EmbedSection } from './sections/EmbedSection';
import { TermsSection } from './sections/TermsSection';

/**
 * SectionRenderer — dispatches any ResearchSection to its
 * renderer. The union is a superset of both research-memo and
 * op-output types, so this one file serves both.
 */
export function SectionRenderer({ section }: { section: ResearchSection }) {
  switch (section.type) {
    /* Research memo types */
    case 'headline':
      return <HeadlineSection section={section} />;
    case 'table':
      return <TableSection section={section} />;
    case 'narrative':
      return <NarrativeSection section={section} />;
    case 'quote':
      return <QuoteSection section={section} />;

    /* Shared types */
    case 'metrics':
      return <MetricsSection section={section} />;
    case 'list':
      return <ListSection section={section} />;
    case 'callout':
      return <CalloutSection section={section} />;

    /* Op-output types */
    case 'paragraph':
      return <ParagraphSection section={section} />;
    case 'code':
      return <CodeSection section={section} />;
    case 'timeline':
      return <TimelineSection section={section} />;
    case 'hero':
      return <HeroSection section={section} />;
    case 'feature-grid':
      return <FeatureGridSection section={section} />;
    case 'pricing':
      return <PricingSection section={section} />;
    case 'embed':
      return <EmbedSection section={section} />;
    case 'terms':
      return <TermsSection section={section} />;

    default:
      return null;
  }
}
