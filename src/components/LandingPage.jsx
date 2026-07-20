import React from 'react';
import {
  ArrowRight, Check, Download, Heart, Images, LockKeyhole,
  Palette, ShieldCheck, Smartphone, UploadCloud
} from 'lucide-react';
import { platformBrand } from '../brand';
import './LandingPage.css';

const features = [
  {
    icon: Images,
    title: 'A familiar photo feed',
    copy: 'Members scroll through club moments in a clean, mobile-first gallery that feels instantly familiar.'
  },
  {
    icon: UploadCloud,
    title: 'Effortless uploads',
    copy: 'Add multiple photos from a phone or computer, organize them by category, and write a caption before sharing.'
  },
  {
    icon: LockKeyhole,
    title: 'Members-only access',
    copy: 'Member name and number verification keeps the gallery inside the club community.'
  },
  {
    icon: Palette,
    title: 'Designed for your club',
    copy: 'Your club name, crest, colours and categories sit naturally inside the Club Photo Hub experience.'
  },
  {
    icon: Heart,
    title: 'The essentials, thoughtfully done',
    copy: 'Members can like, download and revisit photos without the noise of public social media.'
  },
  {
    icon: ShieldCheck,
    title: 'Simple club control',
    copy: 'Administrators manage the member directory, moderate photos and keep an eye on hub activity.'
  }
];

const clubTypes = ['Country clubs', 'Golf clubs', 'Yacht clubs', 'Tennis clubs', 'Private communities'];

export default function LandingPage() {
  return (
    <div className="marketing-page">
      <header className="marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club Photo Hub home">
          <img src={platformBrand.mark} alt="" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">
          Member sign in <ArrowRight size={16} />
        </a>
      </header>

      <main>
        <section className="marketing-hero">
          <div className="marketing-hero-copy">
            <div className="marketing-eyebrow"><ShieldCheck size={15} /> Private photo sharing for member clubs</div>
            <h1>Every club moment, in one private place.</h1>
            <p>
              Club Photo Hub gives members a simple, beautifully branded space to upload,
              discover and preserve the moments that make their club special.
            </p>
            <div className="marketing-hero-actions">
              <a className="marketing-primary-cta" href="/app">
                Open the member hub <ArrowRight size={18} />
              </a>
              <a className="marketing-secondary-cta" href="#features">Explore features</a>
            </div>
            <div className="marketing-trust-row" aria-label="Product highlights">
              <span><Check size={15} /> Members only</span>
              <span><Check size={15} /> Mobile ready</span>
              <span><Check size={15} /> Club branded</span>
            </div>
          </div>

          <div className="marketing-product-stage">
            <div className="marketing-window-bar">
              <span /><span /><span />
              <div>Member Gallery</div>
            </div>
            <img
              src="/club-photo-hub-product-preview.jpg"
              alt="Club Photo Hub gallery showing a private club photo feed"
              width="1440"
              height="900"
              fetchPriority="high"
            />
            <div className="marketing-private-badge"><LockKeyhole size={15} /> Private member gallery</div>
          </div>
        </section>

        <section className="marketing-club-types" aria-labelledby="built-for-clubs">
          <p id="built-for-clubs">Purpose-built for private communities</p>
          <div>{clubTypes.map(type => <span key={type}>{type}</span>)}</div>
        </section>

        <section className="marketing-section" id="features">
          <div className="marketing-section-heading">
            <span>Everything your gallery needs</span>
            <h2>Sharing club memories should feel effortless.</h2>
            <p>A focused experience for members, with the practical controls clubs need behind the scenes.</p>
          </div>
          <div className="marketing-feature-grid">
            {features.map(({ icon: Icon, title, copy }) => (
              <article className="marketing-feature-card" key={title}>
                <div className="marketing-feature-icon"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-how" id="how-it-works">
          <div className="marketing-how-intro">
            <span>Simple from day one</span>
            <h2>From member directory to shared memories.</h2>
            <p>The club establishes who belongs. Members take it from there.</p>
          </div>
          <div className="marketing-steps">
            <article>
              <strong>01</strong>
              <h3>Add the member directory</h3>
              <p>Import member names and numbers so only recognized club members can continue.</p>
            </article>
            <article>
              <strong>02</strong>
              <h3>Members create their account</h3>
              <p>On first access, each member verifies their details and creates their own email and password.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>The gallery comes to life</h3>
              <p>Members upload, browse, like and download moments from events, dining, sport and club life.</p>
            </article>
          </div>
        </section>

        <section className="marketing-privacy marketing-section" id="privacy">
          <div className="marketing-privacy-copy">
            <span>Private by design</span>
            <h2>Your club community—not the public internet.</h2>
            <p>
              Club Photo Hub is designed around controlled membership rather than public profiles,
              followers or open discovery.
            </p>
            <ul>
              <li><ShieldCheck size={18} /> Club roster verification before account creation</li>
              <li><ShieldCheck size={18} /> Protected sessions and private photo delivery</li>
              <li><ShieldCheck size={18} /> Admin moderation and member-directory controls</li>
              <li><ShieldCheck size={18} /> Sign-in and password-reset abuse protection</li>
            </ul>
          </div>
          <div className="marketing-phone-card">
            <div className="marketing-phone-top"><Smartphone size={18} /> Made for the phone in your pocket</div>
            <div className="marketing-phone-photo">
              <div className="marketing-phone-sun" />
              <div className="marketing-phone-water" />
              <div className="marketing-phone-card-actions">
                <Heart size={20} />
                <Download size={20} />
              </div>
            </div>
            <div className="marketing-phone-caption">
              <strong>Club Championship Weekend</strong>
              <span>A perfect day with members and friends.</span>
            </div>
          </div>
        </section>

        <section className="marketing-final-cta">
          <div>
            <span>Bring your club together</span>
            <h2>Give every club moment a place to belong.</h2>
            <p>Enter the member hub and experience Club Photo Hub in action.</p>
          </div>
          <a href="/app">Enter the member hub <ArrowRight size={18} /></a>
        </section>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-brand">
          <img src={platformBrand.mark} alt="" />
          <span>{platformBrand.name}</span>
        </div>
        <p>{platformBrand.tagline}</p>
        <span>© {new Date().getFullYear()} Club Photo Hub</span>
      </footer>
    </div>
  );
}
