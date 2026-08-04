import { recordLeadEvent } from './api';

const VISITOR_KEY = 'clubphotohub_visitor_id';
const LEAD_KEY = 'clubphotohub_lead_code';

export const getVisitorId = () => {
  try {
    let value = localStorage.getItem(VISITOR_KEY);
    if (!value) {
      value = globalThis.crypto?.randomUUID?.().replace(/-/g, '') || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, value);
    }
    return value;
  } catch {
    return `session${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
};

export const getStoredLeadId = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const leadParam = urlParams.get('lead') || urlParams.get('ref') || urlParams.get('utm_content');
    if (leadParam) {
      localStorage.setItem(LEAD_KEY, leadParam);
      return leadParam;
    }
    return localStorage.getItem(LEAD_KEY) || '';
  } catch {
    return '';
  }
};

export const track = (eventType, details = {}) => {
  const leadId = details.leadId || getStoredLeadId();
  const payload = {
    visitorId: getVisitorId(),
    eventType,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer,
    ...(leadId ? { leadId } : {}),
    ...details
  };
  recordLeadEvent(payload).catch(() => {});
};

export const trackPageOnce = eventType => {
  const key = `clubphotohub_tracked_${eventType}_${window.location.pathname}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* Track even when browser storage is unavailable. */ }
  track(eventType);
};
