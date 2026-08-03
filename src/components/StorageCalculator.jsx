import React, { useState } from 'react';
import { ArrowRight, HardDrive, Sparkles, Users } from 'lucide-react';

export default function StorageCalculator() {
  const [memberCount, setMemberCount] = useState(300);
  const [storageGb, setStorageGb] = useState(25);

  // Photo calculation: Average compressed high-res web photo is ~2 MB
  const photosPerGb = 500;
  const totalPhotos = storageGb * photosPerGb;
  const eventsSupported = Math.round(totalPhotos / 50); // ~50 photos per event album
  const costMonthly = storageGb === 25 ? 60 : 60 + (storageGb === 50 ? 10 : storageGb === 75 ? 18 : 30);
  const costPerMember = (costMonthly / Math.max(memberCount, 1)).toFixed(2);

  return (
    <div className="storage-calculator-card">
      <div className="calculator-header">
        <div className="calculator-title-badge">
          <HardDrive size={18} />
          <span>Interactive Calculator</span>
        </div>
        <h3>Estimate Your Club's Storage & Capacity</h3>
        <p>See how many high-resolution photos your club gallery can hold and calculate your monthly cost per member.</p>
      </div>

      <div className="calculator-grid">
        <div className="calculator-controls">
          <div className="calculator-control-group">
            <div className="control-label-row">
              <label htmlFor="member-slider">
                <Users size={16} /> Active Club Members
              </label>
              <strong>{memberCount} members</strong>
            </div>
            <input
              id="member-slider"
              type="range"
              min="50"
              max="2000"
              step="50"
              value={memberCount}
              onChange={(e) => setMemberCount(Number(e.target.value))}
              className="calculator-slider"
            />
            <div className="slider-ticks">
              <span>50</span>
              <span>500</span>
              <span>1,000</span>
              <span>2,000+</span>
            </div>
          </div>

          <div className="calculator-control-group">
            <div className="control-label-row">
              <label htmlFor="storage-select">
                <HardDrive size={16} /> Photo Storage Package
              </label>
              <strong>{storageGb} GB Included</strong>
            </div>
            <div className="storage-button-selector">
              {[
                { gb: 25, label: '25 GB (Launch Base)' },
                { gb: 50, label: '50 GB (+10/mo)' },
                { gb: 75, label: '75 GB (+18/mo)' },
                { gb: 125, label: '125 GB (+30/mo)' }
              ].map(opt => (
                <button
                  key={opt.gb}
                  type="button"
                  className={`storage-selector-btn ${storageGb === opt.gb ? 'active' : ''}`}
                  onClick={() => setStorageGb(opt.gb)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="calculator-results">
          <div className="results-badge">
            <Sparkles size={15} /> Capacity Output
          </div>
          <div className="result-metric-large">
            <strong>~{totalPhotos.toLocaleString()}</strong>
            <span>High-Resolution Photos</span>
          </div>

          <div className="result-metrics-row">
            <div className="result-metric-sub">
              <small>Supported Albums</small>
              <strong>~{eventsSupported} Events</strong>
              <span>(~50 photos / album)</span>
            </div>
            <div className="result-metric-sub">
              <small>Cost / Member</small>
              <strong>${costPerMember}</strong>
              <span>/ member / month</span>
            </div>
          </div>

          <div className="calculator-summary-box">
            <div className="summary-row">
              <span>Base Plan (25 GB + Unlimited Members):</span>
              <strong>$60/mo</strong>
            </div>
            {storageGb > 25 && (
              <div className="summary-row add-on">
                <span>Storage Add-on (+{storageGb - 25} GB):</span>
                <strong>+${costMonthly - 60}/mo</strong>
              </div>
            )}
            <div className="summary-row total">
              <span>Estimated Total Investment:</span>
              <strong>${costMonthly}/mo</strong>
            </div>
          </div>

          <a href="/app?onboard=club" className="calculator-cta">
            Start 30-Day Free Trial <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
