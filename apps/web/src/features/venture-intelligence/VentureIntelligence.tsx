
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { IVHexMark } from '@/components/shared/IVHexMark';

import { useVentureOverview } from
  '@/features/venture-overview/useVentureOverview';

import './venture-intelligence.css';

interface VentureIntelligenceProps {
  ventureId: string;
  ventureName: string;
  pathname: string;
  suspended?: boolean;
}

interface IntelligenceMessage {
  label: string;
  headline: string;
  description: string;
}

const PAGE_MESSAGES: Record<
  string,
  IntelligenceMessage
> = {
  overview: {
    label: 'Venture overview',
    headline: 'Every venture starts with clarity.',
    description:
      'Your workspace connects the decisions, evidence, ' +
      'and operations shaping your next move.',
  },

  strategy: {
    label: 'Strategy intelligence',
    headline: 'Clarity creates momentum.',
    description:
      'Connect your customer, their problem, and your ' +
      'advantage. Focus on the assumptions that matter.',
  },

  product: {
    label: 'Product intelligence',
    headline: 'Build what matters first.',
    description:
      'Turn customer needs into focused requirements ' +
      'and determine what creates value.',
  },

  engineering: {
    label: 'Engineering intelligence',
    headline: 'Turn your vision into something real.',
    description:
      'Connect requirements, technical decisions, ' +
      'and execution to your next meaningful milestone.',
  },

  gtm: {
    label: 'Go-to-market intelligence',
    headline: 'Find the people who need this most.',
    description:
      'Focus on the right customer, the reason they ' +
      'would act, and the channel you can test.',
  },

  marketing: {
    label: 'Marketing intelligence',
    headline: 'Make your message meaningful.',
    description:
      'Use customer insights and positioning to guide ' +
      'how you communicate and measure response.',
  },

  campaigns: {
    label: 'Campaign intelligence',
    headline: 'Make every experiment count.',
    description:
      'Connect campaigns to a hypothesis, measurable ' +
      'outcome, and useful learning.',
  },

  sales: {
    label: 'Sales intelligence',
    headline: 'Every conversation is evidence.',
    description:
      'Look for patterns in buyer objections, ' +
      'interest, and willingness to pay.',
  },

  growth: {
    label: 'Growth intelligence',
    headline: 'Find what works. Then compound it.',
    description:
      'Use experiments and customer outcomes to ' +
      'identify repeatable growth opportunities.',
  },

  knowledge: {
    label: 'Knowledge intelligence',
    headline: 'Your evidence makes the venture smarter.',
    description:
      'Connect research, customer feedback, documents, ' +
      'and new context to stronger decisions.',
  },

  analytics: {
    label: 'Analytics intelligence',
    headline: 'Look beyond activity. Find the signal.',
    description:
      'Use recorded execution and outcomes to ' +
      'understand progress and identify evidence gaps.',
  },

  outcomes: {
    label: 'Outcomes intelligence',
    headline: 'Progress is more than completed tasks.',
    description:
      'Connect executed work to decisions, results, ' +
      'and what you need to learn next.',
  },

  connectors: {
    label: 'Connected intelligence',
    headline: 'Bring your systems together.',
    description:
      'Connect external tools and information so ' +
      'your operations can work with the right context.',
  },
};

const DEFAULT_MESSAGE: IntelligenceMessage = {
  label: 'Venture intelligence',
  headline: 'Move forward with greater clarity.',
  description:
    'Connect today’s work to your next important decision.',
};

function getPageId(pathname: string): string {
  return (
    pathname.split('/').filter(Boolean)[2]?.toLowerCase() ||
    'overview'
  );
}

function ProgressiveText({
  text,
  speed,
  delay = 0,
}: {
  text: string;
  speed: number;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const words = text.trim().split(/\s+/).filter(Boolean);

  useEffect(() => {
    const media = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    const onChange = () => {
      setReducedMotion(media.matches);
    };

    onChange();

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setCount(words.length);
      return;
    }

    setCount(0);

    let interval: number | undefined;

    const timeout = window.setTimeout(() => {
      let index = 0;

      interval = window.setInterval(() => {
        index += 1;
        setCount(index);

        if (index >= words.length && interval !== undefined) {
          window.clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      window.clearTimeout(timeout);

      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [text, speed, delay, reducedMotion]);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {words.slice(0, count).join(' ')}
      </span>

      {count < words.length && !reducedMotion && (
        <span
          className="iv-intelligence__cursor"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export function VentureIntelligence({
  ventureId,
  ventureName,
  pathname,
  suspended = false,
}: VentureIntelligenceProps) {
  const [open, setOpen] = useState(false);

  const {
    nextAction,
    needsYou,
    isLoading,
  } = useVentureOverview(ventureId);

  const pageId = getPageId(pathname);
  const template = PAGE_MESSAGES[pageId] ?? DEFAULT_MESSAGE;

  const message: IntelligenceMessage = isLoading
    ? {
        label: template.label,
        headline: 'Understanding your venture.',
        description: 'Preparing your workspace context.',
      }
    : pageId === 'overview' && needsYou.length > 0
      ? {
          label: 'Founder attention',
          headline: 'Your venture needs your attention.',
          description:
            `${needsYou.length} ${
              needsYou.length === 1
                ? 'operation is'
                : 'operations are'
            } waiting for your input.`,
        }
      : pageId === 'overview' &&
          nextAction?.title &&
          nextAction.severity !== 'none'
        ? {
            label: template.label,
            headline: nextAction.title,
            description:
              nextAction.why || template.description,
          }
        : template;

  const headlineWords = message.headline
    .split(/\s+/)
    .filter(Boolean).length;

  const descriptionDelay =
    140 + headlineWords * 85 + 180;

  const animationKey = [
    ventureId,
    pathname,
    message.headline,
    message.description,
  ].join('::');

  useEffect(() => {
    if (suspended) setOpen(false);
  }, [suspended]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (suspended || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="iv-intelligence">
      {!open ? (
        <button
          type="button"
          className="iv-intelligence__launcher"
          onClick={() => setOpen(true)}
          aria-label="Open IV Intelligence"
          aria-expanded={false}
        >
          <IVHexMark size="sm" animated />
        </button>
      ) : (
        <section
          className="iv-intelligence__panel"
          role="dialog"
          aria-modal={false}
          aria-label={`IV Intelligence for ${ventureName}`}
        >
          <div className="iv-intelligence__top">
              <IVHexMark size="md" animated />

            <button
              type="button"
              className="iv-intelligence__close"
              onClick={() => setOpen(false)}
              aria-label="Close IV Intelligence"
            >
              <X size={16} />
            </button>
          </div>

          <div
            className="iv-intelligence__message"
            key={animationKey}
          >
            <span className="iv-intelligence__label">
              {message.label}
            </span>

            <h2 className="iv-intelligence__headline">
              <ProgressiveText
                text={message.headline}
                speed={85}
                delay={140}
              />
            </h2>

            <p className="iv-intelligence__description">
              <ProgressiveText
                text={message.description}
                speed={45}
                delay={descriptionDelay}
              />
            </p>
          </div>
        </section>
      )}
    </div>,
    document.body
  );
}

export default VentureIntelligence;
