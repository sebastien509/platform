import { useSyncExternalStore } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Lightbulb, Monitor, ShieldCheck } from 'lucide-react';
import './desktop-venture-gate.css';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribeToMobile(onChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobileWorkspace() {
  return useSyncExternalStore(subscribeToMobile, getMobileSnapshot, getServerSnapshot);
}

/** Guards the entire /ventures/:ventureId/* subtree, not just its navigation. */
export function DesktopVentureGate() {
  const isMobile = useIsMobileWorkspace();
  return isMobile ? <DesktopVentureRequired /> : <Outlet />;
}

export function DesktopVentureRequired() {
  const { ventureId } = useParams<{ ventureId: string }>();
  return (
    <section className="iv-desktop-gate" aria-labelledby="iv-desktop-gate-title">
      <div className="iv-desktop-gate__eyebrow"><span aria-hidden="true" /> VENTURE WORKSPACE</div>
      <div className="iv-desktop-gate__visual" aria-hidden="true">
        <div className="iv-desktop-gate__monitor"><Monitor size={45} strokeWidth={1.4} /></div>
        <div className="iv-desktop-gate__visual-caption">BUILT FOR FOCUSED WORK</div>
      </div>
      <h1 id="iv-desktop-gate-title">Your venture workspace is ready on desktop.</h1>
      <p className="iv-desktop-gate__description">You can explore and manage your ideas from your phone. For Strategy, Product, Engineering, GTM and advanced venture operations, continue on a laptop or desktop computer.</p>
      <div className="iv-desktop-gate__assurance"><ShieldCheck size={16} aria-hidden="true" /><span>Your venture and progress remain saved to your account.</span></div>
      <div className="iv-desktop-gate__actions">
        <Link to="/ventures" className="iv-desktop-gate__primary"><ArrowLeft size={16} /> My ventures</Link>
        <Link to="/ideas" className="iv-desktop-gate__secondary"><Lightbulb size={16} /> Continue with Ideas <ArrowUpRight size={14} /></Link>
      </div>
      {ventureId && <p className="iv-desktop-gate__footer">Open this venture on desktop from your Ventures page.</p>}
    </section>
  );
}
