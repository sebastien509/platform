import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavShell } from '@/components/shell/NavShell';
import { VentureShell } from '@/layouts/VentureShell/VentureShell';
import { DesktopVentureGate } from '@/components/responsive/DesktopVentureGate';
import { JourneyShell } from '@/layouts/JourneyShell';
import { DrawerProvider } from '@/components/drawers/DrawerProvider';
import { PulseProvider } from '@/components/pulse/PulseProvider';
import { ModeProvider } from '@/lib/tokens/ModeProvider';
import { IVLoaderProvider } from '@/features/loading';
import { NotificationsProvider } from '@/features/notifications/NotificationsProvider';
import { ErrorBoundary } from '@/pages/ErrorBoundary';
import PricingPage from '@/pages/PricingPage';
import BillingPage from '@/pages/BillingPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import ErrorPage from '@/pages/ErrorPage';
import SharedOutputPage from '@/pages/share/SharedOutputPage';
import ConnectorCallbackPage from '@/pages/connectors/ConnectorCallbackPage';
import { DeliverableCommentsPanel } from '@/features/venture-actions/DeliverableCommentsPanel';
import { AgentSideDrawer } from '@/features/agent-drawer';
import { DocumentViewerDrawer } from '@/features/venture-docs/DocumentViewerDrawer';
import { SurfaceViewerModal } from '@/features/venture-actions';
import { CodeViewHost } from '@/features/venture-actions/viewers/CodeViewHost';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';

import TodayPage from '@/pages/Today';
import IdeasPage from '@/pages/Ideas';
import IdeaDetailPage from '@/pages/IdeaDetail';
import VenturesPage from '@/pages/Ventures';
import AppsAgentsPage from '@/pages/AppsAgents';
import LibraryPage from '@/pages/Library';
import ResourcesPage from '@/pages/Resources';
import SettingsPage from '@/pages/Settings';
import HealthPage from '@/pages/Health';
import LoginPage from '@/pages/Login';
import AuthCallbackPage from '@/pages/AuthCallback';
import { AuthGuard } from '@/features/auth/AuthGuard';
import OnboardingPage from '@/pages/Onboarding';
import LocalJourneyPage from '@/pages/LocalJourneyPage';
import DraftJourneyPage from '@/pages/DraftJourneyPage';
import { RequireOnboarding } from '@/features/auth/RequireOnboarding';
import ResearchReportViewerPage from '@/pages/idea/ResearchReportViewer';
import SharedSurface from '@/pages/share/SharedSurface';

import OverviewPage from '@/pages/venture/OverviewPage';
import StrategyPage from '@/pages/venture/StrategyPage';
import ProductPage from '@/pages/venture/ProductPage';
import EngineeringPage from '@/pages/venture/EngineeringPage';
import GTMPage from '@/pages/venture/GTMPage';
import CampaignsPage from '@/pages/venture/CampaignsPage';
import SalesPage from '@/pages/venture/SalesPage';
import GrowthPage from '@/pages/venture/GrowthPage';
import FundingPage from '@/pages/venture/FundingPage';
import AnalyticsPage from '@/pages/venture/AnalyticsPage';
import KnowledgePage from '@/pages/venture/KnowledgePage';
import VentureOutcomesPage from '@/pages/venture/OutcomesPage';
import ConnectorsPage from '@/pages/venture/ConnectorsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/share/:token" element={<SharedOutputPage />} />
      <Route path="/connectors/callback" element={<ConnectorCallbackPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/draft/:handoffId" element={<DraftJourneyPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      <Route element={<AuthGuard />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Local draft journey — authenticated but NOT workspace-gated.
            Lives entirely in localStorage until synthesize completes. */}
        <Route path="/ideas/local/:localId" element={<LocalJourneyPage />} />
        <Route element={<RequireOnboarding />}>
          <Route element={<JourneyShell />}>
            <Route path="/ideas/:ideaId" element={<IdeaDetailPage />} />
            <Route
              path="/ideas/:ideaId/reports/:reportId"
              element={<ResearchReportViewerPage />}
            />
          </Route>

          <Route element={<NavShell />}>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/ventures" element={<VenturesPage />} />
            <Route path="/agents" element={<Navigate to="/apps-agents" replace />} />
            <Route path="/agents/:agentId" element={<Navigate to="/apps-agents" replace />} />
            <Route path="/apps-agents" element={<AppsAgentsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/knowledge" element={<Navigate to="/library" replace />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/outcomes" element={<Navigate to="/resources" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/health" element={<HealthPage />} />

            {/* On mobile, this guard renders an intentional handoff.
                The entire VentureShell/OPS subtree only mounts on desktop. */}
            <Route element={<DesktopVentureGate />}>
              <Route path="/ventures/:ventureId" element={<VentureShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="strategy" element={<StrategyPage />} />
                <Route path="product" element={<ProductPage />} />
                <Route path="engineering" element={<EngineeringPage />} />
                <Route path="gtm" element={<GTMPage />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="growth" element={<GrowthPage />} />
                <Route path="funding" element={<FundingPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="knowledge" element={<KnowledgePage />} />
                <Route path="outcomes" element={<VentureOutcomesPage />} />
                <Route path="connectors" element={<ConnectorsPage />} />
                <Route path="marketing" element={<Navigate to="campaigns" replace />} />
                <Route path="content" element={<Navigate to="campaigns" replace />} />
              </Route>
            </Route>
          </Route>
          <Route path="/share/:linkId" element={<SharedSurface />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

function GlobalOverlays() {
  const openDocument = useDocumentViewer((s) => s.openDocument);
  return (
    <>
      <AgentSideDrawer onOpenDoc={openDocument} />
      <DocumentViewerDrawer />
      <SurfaceViewerModal />
      <CodeViewHost />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <IVLoaderProvider>
              <ModeProvider>
                <PulseProvider>
                  <DrawerProvider>
                    <AppRoutes />
                    <DeliverableCommentsPanel />
                    <GlobalOverlays />
                  </DrawerProvider>
                </PulseProvider>
              </ModeProvider>
            </IVLoaderProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;
