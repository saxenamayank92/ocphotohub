export const seedMembers = [
  { memberNumber: '1001', lastName: 'Smith', firstName: 'John', password: '', registeredAt: '' },
  { memberNumber: '1002', lastName: 'Jenkins', firstName: 'Sarah', password: '', registeredAt: '' },
  { memberNumber: '1003', lastName: 'Davis', firstName: 'Robert', password: '', registeredAt: '' },
  { memberNumber: '1004', lastName: 'Thompson', firstName: 'Emily', password: '', registeredAt: '' },
  { memberNumber: '1005', lastName: 'Wilson', firstName: 'David', password: '', registeredAt: '' }
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
