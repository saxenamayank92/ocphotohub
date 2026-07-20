import React, { lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage.jsx';

const MemberApp = lazy(() => import('./App.jsx'));

export default function Root() {
  const currentUrl = new URL(window.location.href);
  const isMemberApp = currentUrl.pathname === '/app'
    || currentUrl.pathname.startsWith('/app/')
    || currentUrl.searchParams.has('reset');

  return isMemberApp ? (
    <Suspense fallback={<div className="member-route-loading">Opening your private gallery…</div>}>
      <MemberApp />
    </Suspense>
  ) : <LandingPage />;
}
