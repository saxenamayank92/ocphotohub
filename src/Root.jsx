import React, { lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import LandingPage from './components/LandingPage.jsx';
import { AdminGuide, FAQPage, FeaturesPage, MemberGuide, PrivacyPage, TermsPage } from './components/InfoPage.jsx';

const MemberApp = lazy(() => import('./App.jsx'));

export default function Root() {
  const currentUrl = new URL(window.location.href);
  // Capacitor normally reports the native platform, but the protocol/host
  // fallback also covers a freshly installed WebView before plugins finish
  // initializing. Native builds must never fall through to the marketing demo.
  const isNativeApp = Capacitor.isNativePlatform()
    || currentUrl.protocol === 'capacitor:'
    || currentUrl.protocol === 'ionic:'
    || currentUrl.hostname === 'localhost'
    || currentUrl.hostname === '127.0.0.1';
  const directClubPath = /^\/[a-z0-9][a-z0-9-]{0,59}\/?$/i.test(currentUrl.pathname)
    && !['/api', '/app', '/assets', '/faq', '/features', '/help', '/privacy', '/terms'].includes(currentUrl.pathname.toLowerCase());
  const isMemberApp = isNativeApp
    || directClubPath
    || currentUrl.pathname === '/app'
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
