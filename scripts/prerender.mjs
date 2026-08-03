import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'dist');
const siteUrl = 'https://clubphotohub.com';

const routes = [
  {
    path: '/',
    title: 'Club PhotoHub | Private Photo Sharing for Member Clubs',
    description: 'Give your golf club, yacht club, country club or community a private, beautifully branded place for members to share and preserve favourite moments.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'WebApplication'
  },
  {
    path: '/features',
    title: 'Features | Club PhotoHub Private Member Galleries',
    description: 'Explore private member galleries, roster-verified access, group uploads, club branding, moderation controls, and mobile photo sharing.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'Features'
  },
  {
    path: '/pricing',
    title: 'Pricing & Plans | Club PhotoHub',
    description: 'Simple, transparent pricing for private club photo galleries. The base plan includes 25 GB storage and unlimited members.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'Product'
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions | Club PhotoHub',
    description: 'Answers about Club PhotoHub member verification, privacy, photo storage, 30-day trials, club branding, moderation, and mobile apps.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'FAQPage'
  },
  {
    path: '/help/admin',
    title: 'Administrator Guide | Club PhotoHub Setup & Directory',
    description: 'Set up your Club PhotoHub workspace, member directory, email verification, custom categories, branding, and gallery moderation.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'HowTo'
  },
  {
    path: '/help/members',
    title: 'Member Guide | How to Join & Share on Club PhotoHub',
    description: 'Learn how to find your club gallery, verify membership, upload photos, browse moments, like, and download high-resolution photos.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'HowTo'
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Club PhotoHub Security & Data Protection',
    description: 'Learn how Club PhotoHub protects member privacy, keeps each club separate, and handles member photos and information.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'Legal'
  },
  {
    path: '/terms',
    title: 'Terms of Service | Club PhotoHub Workspace Terms',
    description: 'The terms governing Club PhotoHub private photo-sharing workspaces, membership verification, trials, and administrative rights.',
    image: `${siteUrl}/demo/product-feed.png`,
    schemaType: 'Legal'
  }
];

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function generateBreadcrumbSchema(route) {
  const items = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": siteUrl
    }
  ];

  if (route.path !== '/') {
    const parts = route.path.split('/').filter(Boolean);
    let currentPath = '';
    parts.forEach((part, idx) => {
      currentPath += `/${part}`;
      items.push({
        "@type": "ListItem",
        "position": idx + 2,
        "name": part.charAt(0).toUpperCase() + part.slice(1),
        "item": `${siteUrl}${currentPath}`
      });
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
  };
}

function generateRouteSchema(route) {
  const breadcrumb = generateBreadcrumbSchema(route);
  const canonical = `${siteUrl}${route.path === '/' ? '' : route.path}`;

  if (route.schemaType === 'FAQPage') {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Who is Club PhotoHub built for?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Private golf and country clubs, yacht clubs, tennis & racquet clubs, residential communities, alumni associations, and private social organizations."
            }
          },
          {
            "@type": "Question",
            "name": "Do members need Facebook or Google accounts to sign in?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Member access is strictly based on your organization’s own member directory and roster email verification."
            }
          },
          {
            "@type": "Question",
            "name": "Is a credit card required for the 30-day trial?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Every new organization receives a full 30-day trial without providing a credit card."
            }
          },
          {
            "@type": "Question",
            "name": "How much photo storage is included in the base plan?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The launch plan includes 25 GB of fair-use photo storage per organization (~12,500 high-resolution web photos)."
            }
          }
        ]
      }
    ];
  }

  if (route.schemaType === 'Product') {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Club PhotoHub Launch Plan",
        "description": "Private, branded photo sharing workspace for member clubs with 25 GB storage.",
        "image": `${siteUrl}/demo/product-feed.png`
      }
    ];
  }

  return [breadcrumb];
}

function addMetadata(template, route) {
  const canonical = `${siteUrl}${route.path === '/' ? '' : route.path}`;
  const title = escapeAttribute(route.title);
  const description = escapeAttribute(route.description);
  const image = escapeAttribute(route.image);

  let html = template;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);

  // Inject route schemas into </head>
  const routeSchemas = generateRouteSchema(route);
  const schemaScript = `\n    <script type="application/ld+json">\n    ${JSON.stringify(routeSchemas, null, 2)}\n    </script>\n  </head>`;
  html = html.replace('</head>', schemaScript);

  return html;
}

const vite = await createServer({
  root: projectRoot,
  appType: 'custom',
  mode: 'production',
  server: { middlewareMode: true }
});

try {
  const template = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
  const { default: Root } = await vite.ssrLoadModule('/src/Root.jsx');

  const appShell = template
    .replace(/<title>.*?<\/title>/s, '<title>Member Sign In | Club PhotoHub</title>')
    .replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
  await writeFile(path.join(outputRoot, 'app-shell.html'), appShell);

  for (const route of routes) {
    const markup = renderToString(React.createElement(Root, { url: `${siteUrl}${route.path}` }));
    let html = addMetadata(template, route);
    html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    const destination = route.path === '/'
      ? path.join(outputRoot, 'index.html')
      : path.join(outputRoot, route.path.slice(1), 'index.html');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
  }
} finally {
  await vite.close();
}
