import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Images, Search, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import { platformBrand } from '../brand';
import './InfoPage.css';

const adminGuide = [
  ['Create the private workspace', 'Choose Create workspace, enter the club details and primary administrator, then use the six-digit email code to begin the 30-day trial. No credit card is required.'],
  ['Confirm the club branding', 'In Admin Portal, open Club Setup. Review the full club name and short name, upload a PNG, JPG or WebP crest under 256 KB, then choose Save Club Settings.'],
  ['Build the member directory', 'Open Member & Staff Directory and choose Add Member / Staff. Enter the member number, roster email, last name and first name. For a larger roster, use the CSV or Excel import tools.'],
  ['Assign the right access level', 'Keep ordinary members as Club Members. Promote only trusted employees to Staff Admin, and reserve Club Owner access for the people responsible for the workspace and billing.'],
  ['Publish the first club photo', 'Choose Upload Photos, select one or more images, confirm the event category, add a clear caption and check the queue count before choosing Publish All.'],
  ['Invite members securely', 'Share the club’s direct PhotoHub link. Members may also use the shared sign-in page and search using any three or more characters found anywhere in the club name.'],
  ['Moderate and monitor the hub', 'Use Moderate Photos to review or remove gallery content, Member & Staff Directory to correct or remove roster records, and the storage summary to monitor current usage.'],
  ['Protect the owner account', 'Use a unique administrator password, keep owner access limited, never share verification codes and sign out when using a shared computer.']
];

const memberGuide = [
  ['Find your private club', 'Open the direct link supplied by your club. From the shared sign-in page, type at least three characters found anywhere in the club name and select the matching result. No complete club list is displayed.'],
  ['Match the roster record', 'Enter the member number and last name exactly as held by the club. These details must match the selected club’s private directory.'],
  ['Verify the roster email', 'For first-time access, enter the email address already stored by the club and request the six-digit code. Codes expire after ten minutes.'],
  ['Create the member account', 'Enter the code, choose a password of at least ten characters and confirm it. Your successful sign-in is remembered securely until you sign out.'],
  ['Browse the gallery', 'Use search, categories, Grid, Feed or Story Mode to find a moment. Open a photo for its full view and caption.'],
  ['Like and download photos', 'Choose Like photo to save your reaction. Use Download photo to save the protected image to your device.'],
  ['Share a club moment', 'Choose Upload Photo, select one or more supported images, review the queue count, add a category and caption, then choose Publish All.'],
  ['Keep access private', 'Do not forward verification codes or share your password. Sign out from Account settings when using a shared device, and ask the club administrator to correct any roster details.']
];

const faqCategories = [
  { id: 'all', name: 'All Questions' },
  { id: 'general', name: 'General & Overview' },
  { id: 'privacy', name: 'Privacy & Security' },
  { id: 'pricing', name: 'Pricing & Storage' },
  { id: 'admin', name: 'Admin & Setup' }
];

const faqs = [
  {
    category: 'general',
    question: 'Who is Club PhotoHub built for?',
    answer: 'Private golf and country clubs, yacht clubs, tennis & racquet clubs, residential communities, alumni associations, secret societies, and private social organizations that need a secure, branded photo sharing space.'
  },
  {
    category: 'general',
    question: 'Do members need Facebook or Google accounts to sign in?',
    answer: 'No. Member access is strictly based on your organization’s own member directory and each member’s verified roster email. No public social media profiles are required.'
  },
  {
    category: 'pricing',
    question: 'Is a credit card required for the 30-day trial?',
    answer: 'No. Every new organization receives a full 30-day trial without providing a credit card. You can test all features with real members before deciding.'
  },
  {
    category: 'pricing',
    question: 'What happens when our trial ends?',
    answer: 'Your workspace becomes read-only until a plan is activated. Members can still view and download existing photos, but new uploads, likes, and administrative changes pause.'
  },
  {
    category: 'pricing',
    question: 'How much photo storage is included in the base plan?',
    answer: 'The launch plan includes 25 GB of fair-use photo storage per organization (~12,500 high-resolution web photos). Optional storage add-ons (+25 GB, +50 GB, +100 GB) are available on demand.'
  },
  {
    category: 'admin',
    question: 'Can an administrator remove photos or moderate content?',
    answer: 'Yes. Workspace administrators can moderate photos, manage gallery categories, update roster details, and deactivate accounts. Members can also delete photos they uploaded themselves.'
  },
  {
    category: 'admin',
    question: 'Can we customize the gallery with our club name and crest?',
    answer: 'Yes. Organizations can customize their workspace name and upload their official logo or crest. Photos can be organized using the event categories available in the upload workflow.'
  },
  {
    category: 'privacy',
    question: 'How are our club information and photos protected?',
    answer: 'Your club information and photos are stored securely and are available only to approved club members. They do not appear in public searches, and we never sell them to third parties.'
  },
  {
    category: 'general',
    question: 'Will there be dedicated mobile apps for iOS and Android?',
    answer: 'Yes. Club PhotoHub already works well on phones, tablets and computers. Dedicated iPhone and Android apps are also being developed.'
  },
  {
    category: 'pricing',
    question: 'How does the Founding Club discount work?',
    answer: 'Clubs joining during our launch window can use promo code FOUNDING20 at checkout to receive 20% off monthly or annual base plan billing for their first 12 months.'
  }
];

function Guide({ title, intro, steps, member }) {
  return (
    <InfoLayout title={title} eyebrow="Help centre" intro={intro}>
      <div className="guide-grid">
        {steps.map(([heading, copy], index) => (
          <article className="guide-step" key={heading}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><h2>{heading}</h2><p>{copy}</p></div>
          </article>
        ))}
      </div>
      <div className="info-callout">
        <ShieldCheck size={22} />
        <div>
          <h2>Need assistance?</h2>
          <p>{member ? 'Ask your organization administrator to confirm the roster information on file.' : 'Contact our support team at support@xtide.io.'}</p>
        </div>
      </div>
    </InfoLayout>
  );
}

function InfoLayout({ title, eyebrow, intro, children }) {
  return (
    <div className="info-page">
      <header className="info-nav">
        <a className="marketing-brand" href="/">
          <img src={platformBrand.mark} alt="" width="30" height="30" />
          <span>{platformBrand.name}</span>
        </a>
        <a href="/" className="back-link"><ArrowLeft size={16} /> Back to home</a>
      </header>
      <main className="info-main">
        <section className="info-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </section>
        {children}
      </main>
      <InfoFooter />
    </div>
  );
}

function InfoFooter() {
  return (
    <footer className="info-footer">
      <span>© {new Date().getFullYear()} Club PhotoHub · xTide Apps</span>
      <div>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/faq">FAQ</a>
        <a href="/help/admin">Admin Guide</a>
        <a href="/help/members">Member Guide</a>
      </div>
    </footer>
  );
}

export function AdminGuide() {
  return <Guide title="Administrator guide" intro="A practical path from an empty workspace to a secure, active member gallery." steps={adminGuide} />;
}

export function MemberGuide() {
  return <Guide title="Member guide" intro="Everything a member needs to join, share and enjoy their organization’s private gallery." steps={memberGuide} member />;
}

export function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <InfoLayout
      title="Frequently asked questions"
      eyebrow="Answers, without the runaround"
      intro="The essentials for organizations evaluating Club PhotoHub and members joining a gallery."
    >
      <div className="faq-controls">
        <div className="faq-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search questions (e.g. storage, privacy, trial...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="faq-search-input"
          />
        </div>
        <div className="faq-tabs" role="tablist">
          {faqCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`faq-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(item => (
            <details key={item.question} open={searchQuery !== ''}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))
        ) : (
          <p className="no-faq-results">No questions found matching your search term.</p>
        )}
      </div>
    </InfoLayout>
  );
}

export function PrivacyPage() {
  return (
    <InfoLayout
      title="Privacy policy"
      eyebrow="Effective July 21, 2026"
      intro="This draft explains how Club PhotoHub handles organization, member and photo data."
    >
      <div className="legal-copy">
        <h2>1. Who controls your information</h2>
        <p>Club PhotoHub is operated by xTide Apps and provides a private photo-sharing service to organizations. The organization that operates your workspace controls its member directory and decides who may access its gallery. xTide Apps processes this information to deliver Club PhotoHub.</p>
        <h2>2. Information we collect</h2>
        <p>We process club details, administrator names and email addresses, member names, member numbers, roster email addresses, account sign-in information, uploaded photos, captions, categories, likes and basic information needed to operate and protect the service.</p>
        <h2>3. How we use information</h2>
        <p>We use information to verify membership, create and secure accounts, display organization galleries, deliver emails, provide support, prevent abuse, maintain the service and comply with legal obligations. We do not sell member personal information or use member photos for advertising.</p>
        <h2>4. Service providers and storage</h2>
        <p>Club PhotoHub works with trusted service providers to operate the service and send account emails. They handle information only as needed to provide those services and must follow their own security and privacy commitments. Information may be processed in different countries.</p>
        <h2>5. Retention and deletion</h2>
        <p>We retain information while an organization account is active and as reasonably needed for security, support and legal obligations. Members may initiate account deletion from account settings. Deletion includes personal account data and user-generated photos unless retention is legally required. Organization owners may request workspace export or deletion.</p>
        <h2>6. Security</h2>
        <p>We use tenant separation, access controls, encrypted connections, password hashing, private photo delivery and abuse controls. No service can guarantee absolute security. Administrators are responsible for keeping roster records current and protecting their credentials.</p>
        <h2>7. Young users</h2>
        <p>Club PhotoHub is not directed to children under 13. Organizations must not add a child under 13 without a lawful basis, appropriate consent and a written arrangement with Club PhotoHub.</p>
        <h2>8. Your choices</h2>
        <p>You may request access, correction or deletion through your organization administrator or at support@xtide.io. You may also contact the privacy regulator that applies where you live.</p>
        <h2>9. Changes</h2>
        <p>We may update this policy as the product and legal requirements evolve. Material changes will be communicated in the service or by email.</p>
        <h2>10. Contact</h2>
        <p>Contact xTide Apps at support@xtide.io.</p>
      </div>
    </InfoLayout>
  );
}

export function TermsPage() {
  return (
    <InfoLayout
      title="Terms of service"
      eyebrow="Effective July 21, 2026"
      intro="These are plain-language terms for Club PhotoHub, operated by xTide Apps."
    >
      <div className="legal-copy">
        <h2>1. The service</h2>
        <p>Club PhotoHub provides organizations with private, branded photo workspaces, member verification, uploads, downloads and administrative controls. Each organization is responsible for its member directory, authorized administrators and lawful use of the service.</p>
        <h2>2. Trial and plans</h2>
        <p>Organizations receive a 30-day trial without a credit card. The launch plan is $60 USD or CAD per month, or $600 USD or CAD per year, and includes 25 GB of fair-use photo storage. Taxes may apply. After a trial or paid term ends, the workspace may become read-only until service is renewed.</p>
        <h2>3. Accounts and security</h2>
        <p>You must provide accurate information, protect credentials and promptly report suspected unauthorized access. Accounts may not be shared with people who are not authorized by the organization. Administrators must remove members whose access is no longer appropriate.</p>
        <h2>4. Photos and acceptable use</h2>
        <p>You retain ownership of content you upload and grant Club PhotoHub the limited rights needed to store, process, display and deliver it within your organization’s workspace. You must have permission to upload the content. Illegal, abusive, infringing, deceptive or privacy-invasive content is prohibited.</p>
        <h2>5. Moderation</h2>
        <p>Organizations are primarily responsible for moderating their workspaces. Club PhotoHub may restrict or remove content and accounts when reasonably necessary to protect users, comply with law or enforce these terms.</p>
        <h2>6. Availability and changes</h2>
        <p>We work to provide a reliable service but do not guarantee uninterrupted availability. Features may change as the product evolves. Material changes affecting paid service will be communicated reasonably in advance where practical.</p>
        <h2>7. Cancellation and data</h2>
        <p>Organizations may cancel renewal and request an export or deletion. Members may delete their accounts through account settings. We may retain limited records where required for security, disputes, tax or legal compliance.</p>
        <h2>8. Disclaimers and liability</h2>
        <p>To the extent permitted by law, the service is provided without implied warranties and Club PhotoHub is not liable for indirect or consequential losses. Any total liability will not exceed the fees paid by the organization in the prior 12 months. Consumer rights that cannot legally be excluded remain unaffected.</p>
        <h2>9. Governing law</h2>
        <p>These terms are governed by applicable laws, without limiting any rights that must apply where you live.</p>
        <h2>10. Contact</h2>
        <p>Questions may be sent to xTide Apps at support@xtide.io.</p>
      </div>
    </InfoLayout>
  );
}

export function FeaturesPage() {
  const items = [
    [Images, 'Mobile-first photo feed', 'A familiar scrolling experience with likes, downloads, captions, categories and touch zoom.'],
    [ShieldCheck, 'Organization-owned access', 'Member number, name and roster email checks—not a public social profile.'],
    [Users, 'Directory and moderation', 'Administrators control membership records, branding and inappropriate content.'],
    [UploadCloud, 'Fast group uploads', 'Members prepare multiple photos, captions and categories from phone or desktop.']
  ];
  return (
    <InfoLayout
      title="Made for private communities"
      eyebrow="Product features"
      intro="A focused home for the photos that public social networks and shared folders were never designed to manage."
    >
      <div className="feature-detail-grid">
        {items.map(([Icon, title, copy]) => (
          <article key={title}>
            <Icon size={23} />
            <h2>{title}</h2>
            <p>{copy}</p>
            <span><CheckCircle2 size={15} /> Included in every plan</span>
          </article>
        ))}
      </div>
    </InfoLayout>
  );
}
