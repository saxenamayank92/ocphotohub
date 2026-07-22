import React from 'react';
import { ArrowLeft, CheckCircle2, Images, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import { platformBrand } from '../brand';
import './InfoPage.css';

const adminGuide = [
  ['Create and brand your workspace', 'Verify the primary administrator email, then add your organization name, crest and gallery categories.'],
  ['Build the member directory', 'Add each member’s first name, last name, member number and club-registered email. The directory is the gate to account creation.'],
  ['Invite members', 'Share your Club PhotoHub link. Members select the organization, match their roster details, verify the email on file and create their own password.'],
  ['Moderate the gallery', 'Review activity, remove inappropriate photos, keep roster emails current and deactivate access when a membership ends.'],
  ['Protect your account', 'Use a unique administrator password, keep administrator access limited, and never share verification codes.']
];

const memberGuide = [
  ['Find your organization', 'Open the member hub and select the organization you belong to.'],
  ['Verify your membership', 'Enter your last name and member number. First-time users also confirm the email already registered by the organization.'],
  ['Create your account', 'Enter the six-digit email code and choose a password of at least ten characters.'],
  ['Share a moment', 'Choose Upload Photo, select one or more images, add a category and caption, then publish.'],
  ['Browse and save', 'Scroll the feed, like photos, pinch or double-tap to zoom, and use the download icon to save an image.']
];

const faqs = [
  ['Who is Club PhotoHub for?', 'Private clubs, associations, residential communities, alumni groups, hospitality teams and other organizations that need a controlled photo space.'],
  ['Do members need Facebook or Google accounts?', 'No. Member access is based on the organization’s own directory and the member’s verified roster email.'],
  ['Is a credit card required for the trial?', 'No. Every new organization receives a 30-day trial without a credit card.'],
  ['What happens after the trial?', 'The workspace becomes read-only until a plan is activated. Members can still view and download existing photos, but new uploads and administrative changes pause.'],
  ['How much storage is included?', 'The launch plan includes 25 GB of fair-use photo storage per organization. We will warn administrators before a limit is reached.'],
  ['Can an administrator remove photos?', 'Yes. Administrators can moderate photos, and members can remove photos they uploaded themselves.'],
  ['Can we use our own branding?', 'Yes. Organizations can use their own name, crest or logo, and gallery categories.'],
  ['Will there be a mobile app?', 'Yes. The web experience is mobile-first, and native iOS and Android versions are on the product roadmap.']
];

function Guide({ title, intro, steps, member }) {
  return <InfoLayout title={title} eyebrow="Help centre" intro={intro}>
    <div className="guide-grid">
      {steps.map(([heading, copy], index) => <article className="guide-step" key={heading}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div><h2>{heading}</h2><p>{copy}</p></div>
      </article>)}
    </div>
    <div className="info-callout"><ShieldCheck size={22} /><div><h2>Need a little help?</h2><p>{member ? 'Ask your organization administrator to confirm the roster information they have on file.' : 'Contact support@xtide.io.'}</p></div></div>
  </InfoLayout>;
}

function InfoLayout({ title, eyebrow, intro, children }) {
  return <div className="info-page">
    <header className="info-nav">
      <a className="marketing-brand" href="/"><img src={platformBrand.mark} alt="" /><span>{platformBrand.name}</span></a>
      <a href="/"><ArrowLeft size={16} /> Back to home</a>
    </header>
    <main className="info-main">
      <section className="info-hero"><span>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></section>
      {children}
    </main>
    <InfoFooter />
  </div>;
}

function InfoFooter() {
  return <footer className="info-footer"><span>© {new Date().getFullYear()} Club PhotoHub</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/faq">FAQ</a></div></footer>;
}

export function AdminGuide() {
  return <Guide title="Administrator guide" intro="A practical path from an empty workspace to a secure, active member gallery." steps={adminGuide} />;
}

export function MemberGuide() {
  return <Guide title="Member guide" intro="Everything a member needs to join, share and enjoy their organization’s private gallery." steps={memberGuide} member />;
}

export function FAQPage() {
  return <InfoLayout title="Frequently asked questions" eyebrow="Answers, without the runaround" intro="The essentials for organizations evaluating Club PhotoHub and members joining a gallery.">
    <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
  </InfoLayout>;
}

export function PrivacyPage() {
  return <InfoLayout title="Privacy policy" eyebrow="Effective July 21, 2026" intro="This launch draft explains how Club PhotoHub handles organization, member and photo data. It should be reviewed by Canadian privacy counsel before commercial launch.">
    <div className="legal-copy">
      <h2>1. Who controls your information</h2><p>Club PhotoHub is operated by xTide Apps and provides a private photo-sharing service to organizations. The organization that operates your workspace controls its member directory and decides who may access its gallery. xTide Apps processes this information to deliver Club PhotoHub.</p>
      <h2>2. Information we collect</h2><p>We process organization details, administrator names and email addresses, member names, member numbers, roster email addresses, encrypted password credentials, uploaded photos, captions, categories, likes, security logs and basic technical information needed to operate and protect the service.</p>
      <h2>3. How we use information</h2><p>We use information to verify membership, create and secure accounts, display organization galleries, deliver emails, provide support, prevent abuse, maintain the service and comply with legal obligations. We do not sell member personal information or use member photos for advertising.</p>
      <h2>4. Service providers and storage</h2><p>Club PhotoHub uses Cloudflare services for application hosting, database and object storage, and MailerSend for transactional emails. These providers process data on our instructions and under their own security and privacy commitments. Data may be processed outside your province or country.</p>
      <h2>5. Retention and deletion</h2><p>We retain information while an organization account is active and as reasonably needed for security, support and legal obligations. Members may initiate account deletion from account settings. Deletion includes personal account data and user-generated photos unless retention is legally required. Organization owners may request workspace export or deletion.</p>
      <h2>6. Security</h2><p>We use tenant separation, access controls, encrypted connections, password hashing, private photo delivery and abuse controls. No service can guarantee absolute security. Administrators are responsible for keeping roster records current and protecting their credentials.</p>
      <h2>7. Young users</h2><p>Club PhotoHub is not directed to children under 13. Organizations must not add a child under 13 without a lawful basis, appropriate consent and a written arrangement with Club PhotoHub.</p>
      <h2>8. Your choices</h2><p>You may request access, correction or deletion through your organization administrator or at support@xtide.io. You may also complain to the Office of the Privacy Commissioner of Canada or the appropriate local regulator.</p>
      <h2>9. Changes</h2><p>We may update this policy as the product and legal requirements evolve. Material changes will be communicated in the service or by email.</p>
      <h2>10. Contact</h2><p>Contact xTide Apps at support@xtide.io or by mail at 217-56A Mill St E, Ontario, L7J 1H3, Canada.</p>
    </div>
  </InfoLayout>;
}

export function TermsPage() {
  return <InfoLayout title="Terms of service" eyebrow="Effective July 21, 2026" intro="These are plain-language terms for Club PhotoHub, operated by xTide Apps. They require legal review before commercial use.">
    <div className="legal-copy">
      <h2>1. The service</h2><p>Club PhotoHub provides organizations with private, branded photo workspaces, member verification, uploads, downloads and administrative controls. Each organization is responsible for its member directory, authorized administrators and lawful use of the service.</p>
      <h2>2. Trial and plans</h2><p>Organizations receive a 30-day trial without a credit card. The launch plan is CAD $60 per month or CAD $600 per year and includes 25 GB of fair-use photo storage. Taxes may apply. After a trial or paid term ends, the workspace may become read-only until service is renewed.</p>
      <h2>3. Accounts and security</h2><p>You must provide accurate information, protect credentials and promptly report suspected unauthorized access. Accounts may not be shared with people who are not authorized by the organization. Administrators must remove members whose access is no longer appropriate.</p>
      <h2>4. Photos and acceptable use</h2><p>You retain ownership of content you upload and grant Club PhotoHub the limited rights needed to store, process, display and deliver it within your organization’s workspace. You must have permission to upload the content. Illegal, abusive, infringing, deceptive or privacy-invasive content is prohibited.</p>
      <h2>5. Moderation</h2><p>Organizations are primarily responsible for moderating their workspaces. Club PhotoHub may restrict or remove content and accounts when reasonably necessary to protect users, comply with law or enforce these terms.</p>
      <h2>6. Availability and changes</h2><p>We work to provide a reliable service but do not guarantee uninterrupted availability. Features may change as the product evolves. Material changes affecting paid service will be communicated reasonably in advance where practical.</p>
      <h2>7. Cancellation and data</h2><p>Organizations may cancel renewal and request an export or deletion. Members may delete their accounts through account settings. We may retain limited records where required for security, disputes, tax or legal compliance.</p>
      <h2>8. Disclaimers and liability</h2><p>To the extent permitted by law, the service is provided without implied warranties and Club PhotoHub is not liable for indirect or consequential losses. Any total liability will not exceed the fees paid by the organization in the prior 12 months. Consumer rights that cannot legally be excluded remain unaffected.</p>
      <h2>9. Governing law</h2><p>These terms are governed by the laws of Ontario and the federal laws of Canada applicable there, without limiting mandatory rights that apply in another jurisdiction.</p>
      <h2>10. Contact</h2><p>Questions may be sent to xTide Apps at support@xtide.io or by mail at 217-56A Mill St E, Ontario, L7J 1H3, Canada.</p>
    </div>
  </InfoLayout>;
}

export function FeaturesPage() {
  const items = [[Images, 'Mobile-first photo feed', 'A familiar scrolling experience with likes, downloads, captions, categories and touch zoom.'], [ShieldCheck, 'Organization-owned access', 'Member number, name and roster email checks—not a public social profile.'], [Users, 'Directory and moderation', 'Administrators control membership records, branding and inappropriate content.'], [UploadCloud, 'Fast group uploads', 'Members prepare multiple photos, captions and categories from phone or desktop.']];
  return <InfoLayout title="Made for private communities" eyebrow="Product features" intro="A focused home for the photos that public social networks and shared folders were never designed to manage."><div className="feature-detail-grid">{items.map(([Icon, title, copy]) => <article key={title}><Icon size={23} /><h2>{title}</h2><p>{copy}</p><span><CheckCircle2 size={15} /> Included in every plan</span></article>)}</div></InfoLayout>;
}
