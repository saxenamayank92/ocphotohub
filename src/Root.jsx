import React, { lazy, Suspense, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import LandingPage from './components/LandingPage.jsx';
import { AdminGuide, FAQPage, FeaturesPage, MemberGuide, PrivacyPage, TermsPage } from './components/InfoPage.jsx';
import PricingPage from './components/PricingPage.jsx';
import BookDemoPage from './components/BookDemoPage.jsx';
import FoundingClubsPage from './components/FoundingClubsPage.jsx';
import SecurityPage from './components/SecurityPage.jsx';
import { track, trackPageOnce } from './analytics';

const MemberApp = lazy(() => import('./App.jsx'));
const LeadDashboard = lazy(() => import('./components/LeadDashboard.jsx'));

function LeadTracker({ path, search }) {
  useEffect(() => {
    if (path === '/admin/leads') return undefined;
    if (search.includes('lead=') || search.includes('ref=')) {
      trackPageOnce('email_link_clicked');
    }
    if (search.includes('demo=1')) trackPageOnce('demo_opened');
    else trackPageOnce(path === '/pricing' ? 'pricing_view' : 'site_view');
    const onClick = event => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.includes('demo=1')) track('demo_opened');
      if (href.includes('onboard=club')) track('create_workspace_click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [path, search]);
  return null;
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: 22, color: '#0f1828', marginBottom: 8 }}>Unable to load gallery view</h2>
          <p style={{ fontSize: 14, color: '#61706c', marginBottom: 20 }}>A temporary loading issue occurred. Tap below to reload the live demo.</p>
          <button
            type="button"
            onClick={() => { window.location.reload(); }}
            style={{ padding: '10px 20px', borderRadius: 99, background: '#0f1828', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Reload Live Demo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Root({ url }) {
  const currentUrl = new URL(url || window.location.href, 'https://clubphotohub.com');
  const isBrowser = typeof window !== 'undefined';
  const isNativeApp = (isBrowser && Capacitor.isNativePlatform())
    || currentUrl.protocol === 'capacitor:'
    || currentUrl.protocol === 'ionic:'
    || (!import.meta.env.DEV && (currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1'));
  const directClubPath = /^\/[a-z0-9][a-z0-9-]{0,59}\/?$/i.test(currentUrl.pathname)
    && !['/api', '/app', '/assets', '/faq', '/features', '/help', '/privacy', '/terms', '/pricing', '/book-demo', '/founding-clubs', '/security'].includes(currentUrl.pathname.toLowerCase());
  const isMemberApp = isNativeApp
    || directClubPath
    || currentUrl.pathname === '/app'
    || currentUrl.pathname.startsWith('/app/')
    || currentUrl.pathname.startsWith('/preview/')
    || currentUrl.searchParams.has('reset')
    || currentUrl.searchParams.get('demo') === '1';

  if (currentUrl.pathname === '/admin/leads') return <>
    <LeadTracker path={currentUrl.pathname} search={currentUrl.search} />
    <Suspense fallback={<div className="member-route-loading">Opening lead dashboard…</div>}><LeadDashboard /></Suspense>
  </>;

  if (isMemberApp) return (<>
    {(currentUrl.searchParams.has('demo') || currentUrl.searchParams.has('onboard')) && <LeadTracker path={currentUrl.pathname} search={currentUrl.search} />}
    <AppErrorBoundary>
      <Suspense fallback={<div className="member-route-loading">Opening your private gallery…</div>}>
        <MemberApp />
      </Suspense>
    </AppErrorBoundary>
  </>);

  const pages = {
    '/features': FeaturesPage,
    '/help/admin': AdminGuide,
    '/help/members': MemberGuide,
    '/faq': FAQPage,
    '/privacy': PrivacyPage,
    '/terms': TermsPage,
    '/pricing': PricingPage,
    '/book-demo': BookDemoPage,
    '/founding-clubs': FoundingClubsPage,
    '/security': SecurityPage
  };
  const Page = pages[currentUrl.pathname];
  return <><LeadTracker path={currentUrl.pathname} search={currentUrl.search} />{Page ? <Page /> : <LandingPage />}</>;
}
