export const seedMembers = [
  { memberNumber: '1001', lastName: 'Smith', firstName: 'John', role: 'owner', password: '', registeredAt: '' },
  { memberNumber: '1002', lastName: 'Jenkins', firstName: 'Sarah', role: 'admin', password: '', registeredAt: '' },
  { memberNumber: '1003', lastName: 'Davis', firstName: 'Robert', role: 'member', password: '', registeredAt: '' },
  { memberNumber: '1004', lastName: 'Thompson', firstName: 'Emily', role: 'member', password: '', registeredAt: '' },
  { memberNumber: '1005', lastName: 'Wilson', firstName: 'David', role: 'member', password: '', registeredAt: '' }
];

export const demoClub = {
  id: 'your-club-demo',
  slug: 'your-club-demo',
  name: 'Demo Club',
  shortName: 'Demo Club',
  logoUrl: '',
  organizationType: 'Private Club',
  planStatus: 'demo'
};

export const demoUser = {
  memberNumber: 'DEMO-1001',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'member@example.com'
};

// Used only by the public, read-only demo. This is intentionally separate
// from the member account so the admin preview can show the correct role and
// permissions without creating or exposing a real administrator.
export const demoAdminUser = {
  memberNumber: 'admin:demo-owner',
  firstName: 'Club',
  lastName: 'Manager',
  email: 'admin@yourclub.example',
  role: 'owner'
};

export const demoMembers = [
  { memberNumber: 'DEMO-1001', firstName: 'Alex', lastName: 'Morgan', email: 'member@example.com', registeredAt: '2026-06-14T14:00:00.000Z', role: 'member' },
  { memberNumber: 'DEMO-1002', firstName: 'Jordan', lastName: 'Lee', email: 'jordan@example.com', registeredAt: '2026-06-18T14:00:00.000Z', role: 'member' },
  { memberNumber: 'DEMO-1003', firstName: 'Taylor', lastName: 'Chen', email: 'taylor@example.com', registeredAt: '2026-06-20T14:00:00.000Z', role: 'member' }
];

export const defaultAlbums = [
  {
    id: 'album-tennis-gala',
    name: 'Tennis Gala 2026',
    description: 'Photos from the annual summer tennis tournament and gala dinner.',
    coverUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2026-07-01T10:00:00.000Z',
    createdBy: 'Club Moderator'
  },
  {
    id: 'album-harbor-regatta',
    name: "Commodore's Regatta",
    description: 'Sailing highlights and harbor celebrations.',
    coverUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2026-07-05T12:00:00.000Z',
    createdBy: 'Club Moderator'
  },
  {
    id: 'album-garden-dining',
    name: 'Garden Dining Series',
    description: 'Patio lounge evenings and chef tastings.',
    coverUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop',
    createdAt: '2026-07-10T15:00:00.000Z',
    createdBy: 'Club Moderator'
  }
];

export const demoPhotos = [
  {
    id: 'demo-lakeside-social',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
    caption: 'Golden hour on the terrace with friends. This is what summer at the club feels like.',
    category: 'Events',
    albumId: 'album-harbor-regatta',
    uploaderName: 'Alex Morgan',
    uploaderId: 'DEMO-1001',
    createdAt: '2026-07-20T22:15:00.000Z',
    hearts: 28,
    heartUsers: ['DEMO-1002', 'DEMO-1003']
  },
  {
    id: 'demo-golf-morning',
    url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200&auto=format&fit=crop',
    caption: 'First group out and a beautiful start to championship weekend.',
    category: 'Golf',
    albumId: null,
    uploaderName: 'Jordan Lee',
    uploaderId: 'DEMO-1002',
    createdAt: '2026-07-19T11:40:00.000Z',
    hearts: 19,
    heartUsers: ['DEMO-1001']
  },
  {
    id: 'demo-tennis-social',
    url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    caption: 'A close match, a lot of laughs, and the best kind of Saturday afternoon.',
    category: 'Tennis',
    albumId: 'album-tennis-gala',
    uploaderName: 'Taylor Chen',
    uploaderId: 'DEMO-1003',
    createdAt: '2026-07-18T20:05:00.000Z',
    hearts: 34,
    heartUsers: ['DEMO-1001', 'DEMO-1002']
  },
  {
    id: 'demo-garden-dinner',
    url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop',
    caption: 'The annual garden dinner brought the whole community together.',
    category: 'Dining',
    albumId: 'album-garden-dining',
    uploaderName: 'Club Team',
    uploaderId: 'demo-admin',
    createdAt: '2026-07-17T23:30:00.000Z',
    hearts: 46,
    heartUsers: ['DEMO-1001', 'DEMO-1002', 'DEMO-1003']
  },
  {
    id: 'demo-clubhouse-lounge',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop',
    caption: 'Sunset view from the private clubhouse lounge.',
    category: 'Clubhouse',
    albumId: null,
    uploaderName: 'Sarah Jenkins',
    uploaderId: 'DEMO-1004',
    createdAt: '2026-07-16T19:00:00.000Z',
    hearts: 21,
    heartUsers: ['DEMO-1001']
  }
];

export const seedPhotos = [
  {
    id: 'seed-1',
    url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200&auto=format&fit=crop',
    caption: 'Perfect morning for a round on the 18th green.',
    category: 'Golf',
    uploaderName: 'Club Management',
    uploaderId: 'admin',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    hearts: 14,
    heartUsers: []
  },
  {
    id: 'seed-2',
    url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    caption: 'Action-packed mixed doubles finals under the sun!',
    category: 'Tennis',
    uploaderName: 'Sarah Jenkins',
    uploaderId: '1002',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    hearts: 28,
    heartUsers: []
  },
  {
    id: 'seed-3',
    url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop',
    caption: 'Lovely summer patio dining experience at the Bistro.',
    category: 'Dining',
    uploaderName: 'John Smith',
    uploaderId: '1001',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    hearts: 9,
    heartUsers: []
  },
  {
    id: 'seed-4',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
    caption: 'The annual club gala reception is looking spectacular.',
    category: 'Events',
    uploaderName: 'Club Management',
    uploaderId: 'admin',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    hearts: 35,
    heartUsers: []
  },
  {
    id: 'seed-5',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop',
    caption: 'Sunset reflecting on the harbor from the clubhouse lounge.',
    category: 'Clubhouse',
    uploaderName: 'Robert Davis',
    uploaderId: '1003',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    hearts: 19,
    heartUsers: []
  }
];

export const defaultVenues = ['Dining Room'];

export const defaultEvents = [
  {
    id: 'evt-1',
    name: 'End of Tennis Season Celebration',
    date: '2026-09-26',
    displayDate: 'Saturday, September 26, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-2',
    name: 'Wine Tasting with Serge',
    date: '2026-10-01',
    displayDate: 'Thursday, October 1, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-3',
    name: 'Thanksgiving Brunch',
    date: '2026-10-11',
    displayDate: 'Sunday, October 11, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-4',
    name: 'Line Dancing',
    date: '2026-10-14',
    displayDate: 'Wednesday, October 14, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-5',
    name: 'Sip & Swap',
    date: '2026-10-22',
    displayDate: 'Thursday, October 22, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-6',
    name: 'Trivia',
    date: '2026-05-11',
    displayDate: 'Monday, May 11, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-7',
    name: 'Christmas Market',
    date: '2026-11-18',
    displayDate: 'Wednesday, November 18, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-8',
    name: 'OC Board Dinner',
    date: '2026-11-24',
    displayDate: 'Tuesday, November 24, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-9',
    name: 'Fall Ladies Cocktail',
    date: '2026-11-25',
    displayDate: 'Wednesday, November 25, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-10',
    name: 'Christmas Brunch',
    date: '2026-12-06',
    displayDate: 'Sunday, December 6, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-11',
    name: "Men's Luncheon",
    date: '2026-12-10',
    displayDate: 'Thursday, December 10, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-12',
    name: 'Christmas Dinner',
    date: '2026-10-13',
    displayDate: 'Tuesday, October 13, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-13',
    name: 'Ladies Luncheon',
    date: '2026-12-16',
    displayDate: 'Wednesday, December 16, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  },
  {
    id: 'evt-14',
    name: "New Year's Eve Dinner",
    date: '2026-12-31',
    displayDate: 'Thursday, December 31, 2026',
    venues: ['Dining Room'],
    status: 'Scheduled'
  }
];

