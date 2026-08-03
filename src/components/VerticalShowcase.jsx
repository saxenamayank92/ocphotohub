import React, { useState } from 'react';
import { Anchor, Award, CheckCircle2, Home, Landmark, Trophy } from 'lucide-react';

const verticals = [
  {
    id: 'country-golf',
    name: 'Golf & Country Clubs',
    icon: Trophy,
    tagline: 'Preserve member tournament victories, social dining, and course tradition.',
    highlights: [
      'Championship & Member-Guest Tournament galleries',
      'Junior golf academies & seasonal awards galas',
      'Dining, clubhouse social events & private wine tastings',
      'Controlled access matching active club roster numbers'
    ],
    categories: ['Golf Tournaments', 'Member-Guest', 'Clubhouse Dining', 'Junior Golf', 'Social Events'],
    quote: 'Members loved having an instant, private hub after the Annual Member-Guest rather than digging through email attachments.'
  },
  {
    id: 'yacht-marina',
    name: 'Yacht & Sailing Clubs',
    icon: Anchor,
    tagline: 'Capture regattas, Commodore balls, cruise outs, and waterfront moments.',
    highlights: [
      'High-res photo galleries for weekend regattas & racing series',
      'Commodore’s Ball and annual fleet blessing archives',
      'Cruising fleet destination photos & member vessel spotlights',
      'Private sharing without social media privacy concerns'
    ],
    categories: ['Regattas & Races', 'Commodore Events', 'Fleet Cruises', 'Junior Sailing', 'Waterfront Dining'],
    quote: 'The regatta photo feed was a massive hit with sailors and families who wanted high-res downloads right away.'
  },
  {
    id: 'racquet-tennis',
    name: 'Racquet & Tennis Clubs',
    icon: Award,
    tagline: 'Celebrate court battles, ladder leagues, and junior academy highlights.',
    highlights: [
      'Club Championship and inter-club league tournament feeds',
      'Pro-Am events, clinic highlights & social round-robins',
      'High-speed group photo uploads right from the court side',
      'Secure, verified access strictly for club members & staff'
    ],
    categories: ['Club Championships', 'Pro-Am Socials', 'Ladder Leagues', 'Junior Academy', 'Court Action'],
    quote: 'Our tennis members upload match highlights immediately after finals. It keeps the court enthusiasm alive all week.'
  },
  {
    id: 'alumni-fraternal',
    name: 'Alumni & Secret Societies',
    icon: Landmark,
    tagline: 'Reconnect cohorts, reunion weekends, and legacy traditions securely.',
    highlights: [
      'Class year and chapter-specific private photo categories',
      'Annual homecoming weekend and reunion banquet archives',
      'Legacy member verification using verified roster emails',
      'Permanent, ads-free photo vault for historical archives'
    ],
    categories: ['Reunion Weekends', 'Homecoming', 'Chapter Galas', 'Legacy Archives', 'Class Cohorts'],
    quote: 'For our annual alumni weekend, Club PhotoHub gave us a secure vault where decades of memories could live in one place.'
  },
  {
    id: 'residential-hoa',
    name: 'Residential & HOA Communities',
    icon: Home,
    tagline: 'Bring neighbors together with private community event galleries.',
    highlights: [
      'Block parties, holiday parades & community pool socials',
      'Neighborhood garden clubs & fitness group moments',
      'Verified residency check prevents outside web indexing',
      'Simple mobile upload for residents of all ages'
    ],
    categories: ['Community Block Parties', 'Holiday Parades', 'Pool Socials', 'Clubhouse Events', 'Youth Sports'],
    quote: 'Residents prefer this over open social media groups because everyone knows it stays strictly within our community.'
  }
];

export default function VerticalShowcase() {
  const [activeId, setActiveId] = useState('country-golf');
  const activeVertical = verticals.find(v => v.id === activeId) || verticals[0];
  const ActiveIcon = activeVertical.icon;

  return (
    <div className="vertical-showcase">
      <div className="vertical-tabs" role="tablist" aria-label="Target club types">
        {verticals.map(v => {
          const Icon = v.icon;
          const isActive = v.id === activeId;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`vertical-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveId(v.id)}
            >
              <Icon size={18} />
              <span>{v.name}</span>
            </button>
          );
        })}
      </div>

      <div className="vertical-card" role="tabpanel">
        <div className="vertical-card-header">
          <div className="vertical-icon-badge">
            <ActiveIcon size={24} />
          </div>
          <div>
            <h3>{activeVertical.name}</h3>
            <p className="vertical-tagline">{activeVertical.tagline}</p>
          </div>
        </div>

        <div className="vertical-card-body">
          <div className="vertical-highlights">
            <h4>Purpose-built for your community</h4>
            <ul>
              {activeVertical.highlights.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={16} className="text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="vertical-meta">
            <div className="vertical-categories">
              <h4>Suggested photo categories</h4>
              <div className="category-chips">
                {activeVertical.categories.map(cat => (
                  <span className="category-chip" key={cat}>{cat}</span>
                ))}
              </div>
            </div>

            <blockquote className="vertical-quote">
              <p>“{activeVertical.quote}”</p>
              <cite>— Verified Club Administrator</cite>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
