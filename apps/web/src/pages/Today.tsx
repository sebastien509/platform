import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Compass, Lightbulb, Rocket, Sparkles, Zap } from 'lucide-react';
import { PageContainer } from '@/components/primary';
import { FocusCardStack, StackEmpty, StackProgress } from '@/components/stack';
import { DecisionCard } from '@/features/today/components/DecisionCard';
import { WhatHappenedStrip } from '@/features/today/components/WhatHappenedStrip';
import { useToday } from '@/features/today/hooks/useToday';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import './today-home.css';

export default function TodayPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, resolveDecision, refetch } = useToday();

  if (isLoading) return <PageContainer width="wide" className="today-home"><LoadingSkeleton count={3} className="h-44" /></PageContainer>;
  if (error) return <PageContainer width="wide" className="today-home"><ErrorState onRetry={refetch} /></PageContainer>;

  const { decisions, inProgress, wins, attention, updates, summary } = data;
  const hasWork = decisions.length + inProgress.length + wins.length + attention.length > 0;
  const todayText = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <PageContainer width="wide" className="today-home">
      <div className="today-home__intro">
        <div>
          <p className="today-home__eyebrow"><span className="today-home__live-dot" /> YOUR WORKSPACE <span className="today-home__intro-date">· {todayText}</span></p>
          <h1>Make something meaningful today<span className="today-home__title-mark">.</span></h1>
          <p className="today-home__subtitle">One place to think, learn, decide, and keep moving — from first idea to growing venture.</p>
        </div>
      </div>

      <section className="today-home__lead" aria-labelledby="today-lead-title">
        <div className="today-home__lead-content">
          <span className="today-home__lead-label"><Sparkles size={14} /> YOUR NEXT MOVE</span>
          <h2 id="today-lead-title">{decisions.length > 0 ? 'You have a decision to shape.' : hasWork ? 'Momentum is building.' : 'Every venture starts with a question.'}</h2>
          <p>{decisions.length > 0 ? `${decisions.length} ${decisions.length === 1 ? 'item is' : 'items are'} waiting for your input. Make progress on what matters.` : hasWork ? 'Explore the latest changes, learn from your work, and choose the next useful step.' : 'Explore an idea, test a hypothesis, or revisit what you’ve learned. You can start before you have a venture.'}</p>
          <div className="today-home__lead-actions">
            <button type="button" className="today-home__button-main" onClick={() => document.getElementById('today-decisions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={decisions.length ? undefined : { display: 'none' }}>
              Review decisions <ArrowRight size={15} />
            </button>
            <button type="button" className="today-home__button-main" onClick={() => navigate('/ideas')} style={decisions.length ? { display: 'none' } : undefined}>
              Explore your ideas <ArrowRight size={15} />
            </button>
            <button type="button" className="today-home__button-link" onClick={() => navigate('/library')}>Open library <BookOpen size={15} /></button>
          </div>
        </div>
        <div className="today-home__lead-art" aria-hidden="true"><span className="today-home__orbit today-home__orbit--one"/><span className="today-home__orbit today-home__orbit--two"/><span className="today-home__orbit today-home__orbit--three"/><div className="today-home__art-core"><Sparkles size={37} strokeWidth={1.45}/></div></div>
      </section>

      <div className="today-home__body">
        <div className="today-home__main">
          <section className="today-home__panel today-home__updates" aria-labelledby="today-updates-title">
            <div className="today-home__section-head">
              <div><p className="today-home__section-kicker">DISCOVER & LEARN</p><h2 id="today-updates-title">Latest learning & updates</h2><p>Signals from your ideas, decisions, and work across IV.</p></div>
              <button type="button" className="today-home__text-action" onClick={() => navigate('/library')}>Library <ArrowRight size={15}/></button>
            </div>
            {updates.length ? (
              <div className="today-home__updates-list">
                {updates.slice(0, 5).map((item) => {
                  const Icon = item.kind === 'learning' ? BookOpen : item.kind === 'idea' ? Lightbulb : item.kind === 'outcome' ? CheckCircle2 : Zap;
                  return <div key={item.id} className={`today-home__update today-home__update--${item.kind}`}>
                    <span className="today-home__update-icon"><Icon size={16}/></span>
                    <div className="today-home__update-body"><span className="today-home__update-type">{item.label}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
                    {item.href && <button type="button" className="today-home__update-open" aria-label={`Open ${item.title}`} onClick={() => navigate(item.href!)}><ArrowRight size={17}/></button>}
                  </div>;
                })}
              </div>
            ) : (
              <div className="today-home__learning-empty"><div className="today-home__empty-icon"><BookOpen size={23}/></div><div><h3>Your learning trail begins here</h3><p>As you capture ideas and produce outcomes, real updates will appear here. Start with a question worth exploring.</p><button type="button" onClick={() => navigate('/ideas')}>Explore ideas <ArrowRight size={14}/></button></div></div>
            )}
          </section>

          <section className="today-home__panel today-home__decisions" id="today-decisions" aria-labelledby="today-decisions-title">
            <div className="today-home__section-head"><div><p className="today-home__section-kicker">STAY IN MOTION</p><h2 id="today-decisions-title">Decisions & next actions</h2><p>{decisions.length ? `${decisions.length} ${decisions.length === 1 ? 'decision' : 'decisions'} waiting for your perspective.` : 'When your input is needed, it will appear here.'}</p></div>{decisions.length > 0 && <span className="today-home__count">{decisions.length} pending</span>}</div>
            <FocusCardStack
              items={decisions}
              onResolve={(decision, resolution) => resolveDecision(decision.id, resolution)}
              emptyState={<StackEmpty title="Your desk is clear" description="Nothing waiting for approval. Keep exploring ideas or review your latest progress." action={<button className="today-home__outline-action" type="button" onClick={() => navigate('/ideas')}>Work on an idea <ArrowRight size={14}/></button>} />}
              renderItem={(decision, { index, total, onResolve, onSkip }) => <div className="today-home__decision-card"><StackProgress current={index + 1} total={total}/><DecisionCard decision={decision} onResolve={onResolve} onSkip={onSkip}/></div>}
            />
          </section>
          <WhatHappenedStrip wins={wins} inProgress={inProgress} attention={attention} className="today-home__happened" />
        </div>

        <aside className="today-home__aside" aria-label="Founder quick access">
          <section className="today-home__panel today-home__pulse"><div className="today-home__section-head"><div><p className="today-home__section-kicker">AT A GLANCE</p><h2>Across your work</h2></div><span className="today-home__signal"><span/>Live</span></div><div className="today-home__pulse-rows">
            <div><span className="today-home__pulse-icon is-blue"><Lightbulb size={17}/></span><span>Active ideas</span><strong>{summary.activeIdeas}</strong></div>
            <div><span className="today-home__pulse-icon is-violet"><Zap size={17}/></span><span>Agents working</span><strong>{summary.activeAgents}</strong></div>
            <div><span className="today-home__pulse-icon is-mint"><CheckCircle2 size={17}/></span><span>Recorded outcomes</span><strong>{summary.recentOutcomes}</strong></div>
          </div><p className="today-home__pulse-foot">This is your overall workspace, not a single venture.</p></section>
          <section className="today-home__panel today-home__explore"><p className="today-home__section-kicker">PICK A DIRECTION</p><h2>Where to next?</h2><button onClick={() => navigate('/ideas')}><span className="today-home__explore-icon is-blue"><Lightbulb size={16}/></span><span><strong>Shape an idea</strong><small>Capture, question, validate</small></span><ArrowRight size={16}/></button><button onClick={() => navigate('/ventures')}><span className="today-home__explore-icon is-violet"><Rocket size={16}/></span><span><strong>Your ventures</strong><small>Move into focused execution</small></span><ArrowRight size={16}/></button><button onClick={() => navigate('/resources')}><span className="today-home__explore-icon is-cyan"><Compass size={16}/></span><span><strong>Explore resources</strong><small>Tools and useful references</small></span><ArrowRight size={16}/></button></section>
        </aside>
      </div>
    </PageContainer>
  );
}
