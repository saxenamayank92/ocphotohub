export const platformBrand = {
  name: 'Club Photo Hub',
  shortName: 'Photo Hub',
  descriptor: 'The private photo hub for clubs',
  tagline: 'Private moments. Shared with members.',
  mark: '/club-photo-hub-mark.svg'
};

export const clubBrand = {
  name: import.meta.env.VITE_CLUB_NAME || 'Oakville Club',
  shortName: import.meta.env.VITE_CLUB_SHORT_NAME || 'Oakville',
  logo: import.meta.env.VITE_CLUB_LOGO_URL || '/oakville-logo.jpg'
};

export const photoDownloadName = (category = 'Photo') => {
  const safeClubName = clubBrand.shortName.replace(/[^a-zA-Z0-9]+/g, '_');
  const safeCategory = category.replace(/[^a-zA-Z0-9]+/g, '_');
  return `${safeClubName}_${safeCategory}_Photo.jpg`;
};
