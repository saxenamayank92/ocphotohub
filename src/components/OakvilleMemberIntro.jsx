import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Lock,
  Mail,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UploadCloud,
  Users,
  Grid,
  LayoutList,
  Bell
} from 'lucide-react';
import { platformBrand } from '../brand';
import './OakvilleMemberIntro.css';

export default function OakvilleMemberIntro({ onBackToApp }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const directUrl = 'https://www.clubphotohub.com/theoakvilleclub';
  const displayUrl = 'www.clubphotohub.com/theoakvilleclub';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const onboardingSteps = [
    {
      step: 1,
      title: 'Direct Link for Oakville Club',
      desc: 'Access your private club hub instantly on web or mobile.',
      detail: `Visit www.clubphotohub.com/theoakvilleclub directly on your phone or computer.`,
      icon: ExternalLink,
      badge: 'Step 1'
    },
    {
      step: 2,
      title: 'Enter Member Number & Last Name',
      desc: 'Roster security matching your club registration.',
      detail: 'Provide your assigned Oakville Club member number and registered surname.',
      icon: Users,
      badge: 'Step 2'
    },
    {
      step: 3,
      title: 'Enter Registered Email',
      desc: 'Instant verification code sent directly to your inbox.',
      detail: 'If you have a spousal or family membership number, enter the primary member’s email address.',
      icon: Mail,
      badge: 'Step 3',
      highlight: 'Family & Spousal Memberships: Use Primary Member Email'
    },
    {
      step: 4,
      title: 'Verify Code & Set Password',
      desc: '6-digit OTP verification code for high security.',
      detail: 'Check your inbox for the 6-digit security code, enter it, and choose a personal password.',
      icon: Lock,
      badge: 'Step 4'
    },
    {
      step: 5,
      title: 'Feed View or Grid View Gallery',
      desc: 'Browse club stories in your preferred layout.',
      detail: 'Enjoy continuous Feed View for full story details or Grid View for clean photo tile browsing.',
      icon: Grid,
      badge: 'Step 5'
    },
    {
      step: 6,
      title: 'Upload Photos & Add Tags',
      desc: 'Share your regatta, tennis, and social memories.',
      detail: 'Click "Upload Photos" to select photos, assign event categories, and add custom titles.',
      icon: UploadCloud,
      badge: 'Step 6'
    },
    {
      step: 7,
      title: 'Instant Member Notifications',
      desc: 'Every photo upload notifies the community.',
      detail: 'Any new photo upload automatically sends out a notification to keep all members connected.',
      icon: Bell,
      badge: 'Step 7',
      highlight: 'Real-time Push & Email Notifications'
    }
  ];

  return (
    <div className="oakville-intro-container">
      {/* Top Header Bar (Screen Only) */}
      <header className="oakville-top-nav no-print">
        <div className="oakville-nav-left">
          {onBackToApp && (
            <button type="button" onClick={onBackToApp} className="oakville-back-btn">
              <ArrowLeft size={16} /> Back to Gallery
            </button>
          )}
          <div className="oakville-nav-brand">
            <div className="oakville-nav-title">
              <span className="oakville-club-name">The Oakville Club</span>
              <span className="oakville-app-tag">Club PhotoHub Portal</span>
            </div>
          </div>
        </div>

        <div className="oakville-nav-actions">
          <button type="button" onClick={handlePrint} className="oakville-btn-primary">
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="oakville-content">
        {/* Printable & Branded Document Header */}
        <section className="oakville-hero-card">
          <div className="oakville-hero-badge no-print">
            <Sparkles size={14} /> Official Member Onboarding Document
          </div>

          <div className="oakville-brand-header">
            <div className="oakville-header-text">
              <span className="oakville-eyebrow">The Oakville Club — Est. 1907</span>
              <h1 className="oakville-title">Club PhotoHub Access Guide</h1>
              <p className="oakville-subtitle">
                Exclusive Private Photo Sharing Application for Oakville Club Members & Families
              </p>
            </div>
          </div>

          {/* Quick Direct Link Access Banner */}
          <div className="oakville-direct-access-box">
            <div className="oakville-link-info">
              <span className="oakville-link-label">Direct Link for Oakville Club:</span>
              <a href={directUrl} target="_blank" rel="noopener noreferrer" className="oakville-link-url">
                {displayUrl} <ExternalLink size={20} />
              </a>
            </div>

            <div className="oakville-app-availability">
              <div className="availability-icon-wrap">
                 <Smartphone size={24} />
              </div>
              <div className="availability-text">
                <span className="avail-main">Mobile app available on Android</span>
                <span className="avail-sub">Coming soon on iPhone</span>
              </div>
            </div>

            <div className="oakville-link-actions no-print">
              <button type="button" onClick={handleCopyLink} className="oakville-copy-btn">
                <Copy size={15} /> {copiedLink ? 'Copied to Clipboard!' : 'Copy Direct Link'}
              </button>
            </div>
          </div>
        </section>

        {/* Step-by-Step Onboarding Grid */}
        <section className="oakville-section oakville-steps-section">
          <div className="section-title-row">
            <h2>Step-by-Step Member Access</h2>
            <p>Follow these quick steps to set up your account and start sharing club memories.</p>
          </div>

          <div className="oakville-steps-grid">
            {onboardingSteps.map((step) => {
              const IconComp = step.icon;
              return (
                <article className={`oakville-step-card ${step.highlight ? 'step-card-featured' : ''}`} key={step.step}>
                  <div className="step-card-header">
                    <span className="step-number">{String(step.step).padStart(2, '0')}</span>
                    <div className="step-icon-wrap">
                      <IconComp size={24} />
                    </div>
                  </div>
                  <h3>{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                  <div className="step-detail">{step.detail}</div>
                  {step.highlight && (
                    <div className="step-highlight-badge">
                      <Info size={16} /> {step.highlight}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

