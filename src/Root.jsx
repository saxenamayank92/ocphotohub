import React, { lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage.jsx';
import { AdminGuide, FAQPage, FeaturesPage, MemberGuide, PrivacyPage, TermsPage } from './components/InfoPage.jsx';

const MemberApp = lazy(() => import('./App.jsx'));

export default function Root() {
  const currentUrl = new URL(window.location.href);
  const isMemberApp = currentUrl.pathname === '/app'
    || currentUrl.pathname.startsWith('/app/')
    || currentUrl.searchParams.has('reset')
    || currentUrl.searchParams.get('demo') === '1';

  if (isMemberApp) return (
    <Suspense fallback={<div className="member-route-loading">Opening your private gallery…</div>}>
      <MemberApp />
    </Suspense>
  );

  const pages = {
    '/features': FeaturesPage,
    '/help/admin': AdminGuide,
    '/help/members': MemberGuide,
    '/faq': FAQPage,
    '/privacy': PrivacyPage,
    '/terms': TermsPage
  };
  const Page = pages[currentUrl.pathname];
  return Page ? <Page /> : <LandingPage />;
}
