export const platformBrand = {
  name: 'Club PhotoHub',
  shortName: 'Photo Hub',
  descriptor: 'The private photo hub for clubs',
  tagline: 'Private moments. Shared with members.',
  mark: '/club-photo-hub-mark.svg'
};

export const clubBrand = {
  id: 'local-demo',
  name: import.meta.env.VITE_CLUB_NAME || 'Demo Club',
  shortName: import.meta.env.VITE_CLUB_SHORT_NAME || 'Club',
  logoUrl: import.meta.env.VITE_CLUB_LOGO_URL || ''
};

export const photoDownloadName = (category = 'Photo') => {
  const safeCategory = category.replace(/[^a-zA-Z0-9]+/g, '_');
  return `Club_PhotoHub_${safeCategory}_Photo.jpg`;
};
