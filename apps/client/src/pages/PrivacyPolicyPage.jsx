import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  FileText, 
  Server, 
  Globe2, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Mail, 
  Printer, 
  Search, 
  CheckCircle2, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction and Platform Overview',
    icon: Building2,
    content: `JPTL Technologies Inc. ("JPTL", "we", "our", or "us") operates an integrated, multi-tier Smart Property and Maintenance Management Platform engineered to modernize residential and commercial tenancy operations. Our software ecosystem connects property owners, property managers, tenants, and platform administrators through dedicated web and progressive web applications (PWAs). By centralizing lease lifecycles, automated maintenance dispatching, digital payment reconciliation, credentialed document management, and building access logs, JPTL acts as both an independent Data Controller for direct user account credentials and a Data Processor/Service Provider on behalf of property managers handling tenant data. We are committed to upholding the highest international standards of data privacy, confidentiality, and security across all aspects of our system architecture.`
  },
  {
    id: 'collection',
    title: '2. Personal Data We Collect',
    icon: FileText,
    content: `To facilitate smart property management workflows, JPTL processes several categories of personal data based on user roles and service interactions. Account registration and profile data include legal names, verified email addresses, telephone numbers, encrypted login credentials, and assigned platform roles. For tenants and landlords participating in lease administration, we collect lease agreements, government identification documents, physical unit assignments, rental rates, lease commencement and expiration dates, and digital signature records.

Financial transaction records are processed whenever rent invoices or service charges are generated or settled; while JPTL does not store raw credit card numbers or sensitive banking secrets directly on our application databases, we store payment amounts, due dates, settlement timestamps, ledger histories, and tokenized transaction references received from our PCI-DSS-compliant payment processors.

When users submit maintenance requests or interact with property infrastructure, our platform collects issue summaries, diagnostic descriptions, maintenance category designations, and multimedia attachments such as photographs or video files uploaded via our secure content delivery pipeline. Furthermore, when smart IoT access systems or connected building devices are integrated into managed properties, we capture device interaction records, digital key issuance details, and access event timestamps strictly for premises security and lease fulfillment.

Our automated systems also record technical metadata generated during user sessions. This includes Internet Protocol (IP) addresses, device user-agent strings, browser characteristics, operating system versions, Progressive Web App (PWA) installation states, push notification delivery endpoints via VAPID standards, and immutable audit logs that capture state transitions, user modifications, and administrative oversight activities.`
  },
  {
    id: 'legal-bases',
    title: '3. Legal Bases and Methods of Data Processing',
    icon: ShieldCheck,
    content: `JPTL processes personal data in strict compliance with lawful processing grounds recognized under international privacy frameworks including the General Data Protection Regulation (GDPR Article 6). First, we process data to perform our contractual obligations, including executing tenancy agreements, delivering core property management functionalities, generating rent schedules, routing maintenance tickets, and sending automated operational notifications.

Second, we process data under our legitimate business interests, such as safeguarding platform integrity, preventing fraudulent rent submissions, maintaining comprehensive system audit trails, monitoring infrastructure performance, and improving our software services, provided these interests do not override the fundamental rights and freedoms of data subjects.

Third, where required by statutory mandates, we process records to satisfy legal, tax, accounting, and anti-money laundering compliance obligations. Finally, where explicit consent is mandated by local law—such as for optional marketing communications or specialized web telemetry—users retain the right to withdraw such consent at any time without compromising core property management functionalities.`
  },
  {
    id: 'security',
    title: '4. Technical Architecture, Storage, and Security Measures',
    icon: Lock,
    content: `We protect personal data through defense-in-depth engineering practices. All data in transit across our web applications, microservices, mobile PWAs, and administrative endpoints is encrypted using Transport Layer Security (TLS 1.3/1.2) with strict HTTP Strict Transport Security (HSTS) enforcement. All data at rest—including our primary databases, structured document storage, and backup snapshots—is encrypted using industry-standard Advanced Encryption Standard with 256-bit keys (AES-256).

User authentication credentials are safe-guarded using modern cryptographic hashing algorithms (bcrypt/Argon2) incorporating salted iteration parameters, ensuring raw passwords can never be retrieved or viewed in plaintext. Document and media uploads are segregated within hardened cloud storage repositories using pre-signed, short-lived URLs and strict access control lists to prevent unauthorized enumeration.

Our application architecture implements strict multi-tenant Role-Based Access Control (RBAC) enforced at the database query level. This design guarantees that landlords cannot inspect data from competing property portfolios, tenants can only access records relevant to their specific lease and unit, and platform administrators operate through monitored, audited supervisory interfaces. Additionally, immutable system audit logs track every critical data modification, authentication event, and payment status update alongside actor identifiers and IP addresses to ensure complete forensic traceability.`
  },
  {
    id: 'third-parties',
    title: '5. Third-Party Data Sharing and Sub-Processors',
    icon: Server,
    content: `JPTL does not sell, rent, or trade personal data to data brokers, marketing agencies, or unauthorized third parties. We engage carefully vetted third-party service providers (sub-processors) who operate under binding Data Processing Agreements (DPAs) requiring equal or greater data protection standards than those described herein.

Our trusted infrastructure partners include cloud hosting providers for microservice execution, managed database operators for resilient relational and document storage, certified content delivery networks for secure media handling, PCI-DSS Level 1 certified payment gateways for billing execution, and push notification gateways utilizing standard web push protocols.

We may also disclose personal data when compelled by lawful governmental subpoenas, court orders, or statutory regulatory mandates, or when essential to protect the vital safety, physical security, and legal property rights of tenants, landlords, the public, or JPTL.`
  },
  {
    id: 'international-transfers',
    title: '6. International Data Transfers and Compliance',
    icon: Globe2,
    content: `Because JPTL leverages global cloud computing environments, personal data may be processed and stored in data centers located outside the user's home jurisdiction. Whenever data originates in the European Economic Area (EEA), the United Kingdom, Switzerland, Canada, or other jurisdictions requiring cross-border transfer protections, JPTL executes European Commission Standard Contractual Clauses (SCCs), UK International Data Transfer Addenda, or relies upon formal Adequacy Decisions.

We regularly conduct Transfer Impact Assessments (TIAs) to verify that the legal regimes of receiving jurisdictions do not undermine the technical, physical, and contractual protections applied to your information.`
  },
  {
    id: 'retention',
    title: '7. Data Retention and Destruction Schedules',
    icon: Clock,
    content: `We retain personal data only for as long as necessary to fulfill the operational purposes for which it was gathered, provide uninterrupted property management services, and satisfy statutory record-keeping requirements. User account data and active lease records are maintained throughout the active tenancy and for a standardized period of seven (7) years following lease termination, adhering to statutory tax, property dispute, and accounting limitation laws.

Maintenance tickets, work orders, and associated damage images are preserved for a period of three (3) to five (5) years following ticket closure to resolve lingering warranty claims or security deposit disputes. Ephemeral application logs, diagnostic telemetry, and push notification tokens are retained for ninety (90) to one hundred and eighty (180) days before automated purging.

System audit logs recording security and operational events are preserved for three (3) years in write-once, read-many storage configurations. Upon the expiration of applicable retention windows, data is permanently shredded, sanitized, or irreversibly anonymized using cryptographic data deletion standards.`
  },
  {
    id: 'user-rights',
    title: '8. Data Subject Rights and Regional Protections (GDPR, CCPA/CPRA, PIPEDA)',
    icon: UserCheck,
    content: `Depending on your geographic location and applicable data privacy statutes (such as the GDPR, CCPA/CPRA, PIPEDA, and the Philippine Data Privacy Act of 2012), you possess specific enforceable statutory rights concerning your personal information. These include:

Right to Access and Know: You may request confirmation of whether we process your data and receive an itemized copy of the personal information held about you.

Right to Rectification: You may request the prompt correction of inaccurate, obsolete, or incomplete personal records.

Right to Erasure ("Right to be Forgotten"): You may request the deletion of your personal data when it is no longer required for lease performance, regulatory compliance, or defense of legal claims.

Right to Data Portability: You are entitled to receive your provided personal data in a structured, commonly used, machine-readable format (such as JSON or CSV) for transfer to another service provider.

Right to Restrict or Object to Processing: You may object to data processing based on legitimate interests or request temporary processing restrictions during dispute resolution.

Right to Opt-Out of Automated Decision-Making and Sale/Sharing: JPTL does not sell personal data or engage in automated algorithmic profiling that produces legal or comparably significant effects on users.

Right to Non-Discrimination: Exercising your statutory privacy rights will never result in denied services, altered pricing, or diminished platform service quality.

To exercise any of these statutory rights, data subjects may submit a verified request directly through their platform settings dashboard or by contacting our dedicated Data Protection Office via email at privacy@jptl-management.com. We respond to all verified requests within thirty (30) days (or forty-five (45) days where authorized by California law).`
  },
  {
    id: 'minors',
    title: '9. Protection of Minors',
    icon: AlertTriangle,
    content: `JPTL is strictly intended for individuals who have attained the age of majority (eighteen (18) years of age or older) capable of executing legally binding rental and lease contracts. We do not knowingly solicit, collect, or process personal information from children or minors under the age of eighteen. If we discover that personal data of a minor has been inadvertently submitted to our systems without verified parental or legal guardian consent, we take immediate corrective action to purge such data from our primary databases and backup archives.`
  },
  {
    id: 'contact',
    title: '10. Modifications, Notifications, and Contact Details',
    icon: Mail,
    content: `JPTL reserves the right to amend this Privacy Policy periodically to reflect technological advancements, operational changes, or new regulatory mandates. When significant updates occur, we will notify registered users via in-app dashboard banners, push notifications, or registered email communications at least thirty (30) days prior to the effective date of the revisions. Continued use of the platform after the effective date constitutes formal acknowledgment of the revised terms.

If you have questions, grievances, or wish to communicate directly with our Data Protection Officer, please direct all correspondence to:
Company: JPTL Technologies Inc.
Attn: Data Protection Officer (DPO)
Email: privacy@jptl-management.com
Mailing Address: JPTL Privacy & Security Office, 100 Innovation Way, Suite 400`
  }
];

export const PrivacyPolicyPage = ({ onNavigate = () => {} }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');

  const filteredSections = PRIVACY_SECTIONS.filter((sec) =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600/30 selection:text-indigo-300">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#090C18]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(-1 || '/login')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-grotesk font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  JPTL Privacy & Data Protection
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Effective: October 2026 &bull; Institutional Standard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Banner */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden border border-indigo-500/20 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>GDPR &bull; CCPA/CPRA &bull; PIPEDA &bull; DPA Compliant</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-grotesk tracking-tight">
              Smart Property Management Privacy Policy
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              This document explains in comprehensive detail how JPTL Technologies Inc. collects, protects, processes, stores, and transfers your personal information across our lease management, smart access, digital billing, and maintenance modules.
            </p>
          </div>
        </div>

        {/* Search & Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Navigation (Sidebar) */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search privacy clauses..."
                className="w-full bg-white dark:bg-[#0E1222] border border-slate-300 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>

            <nav className="p-3 bg-white dark:bg-[#0E1222] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-1 max-h-[520px] overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Table of Contents
              </div>
              {PRIVACY_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </a>
                );
              })}
            </nav>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Data Protection</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Have questions or need to exercise your rights? Email our DPO directly at:
              </p>
              <a
                href="mailto:privacy@jptl-management.com"
                className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline block"
              >
                privacy@jptl-management.com
              </a>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0E1222] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No privacy clauses match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="p-6 sm:p-8 bg-white dark:bg-[#0E1222] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 scroll-mt-24 transition-all hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-grotesk font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                        {sec.title}
                      </h3>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal space-y-3 whitespace-pre-line">
                      {sec.content}
                    </div>
                  </section>
                );
              })
            )}

            {/* Bottom Certification Box */}
            <div className="p-6 rounded-3xl bg-slate-100 dark:bg-[#0A0D1A] border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">Strict Compliance Assured:</span> TLS 1.3 in-transit, AES-256 at-rest, salted Argon2/bcrypt hashes, zero-knowledge credentials.
                </div>
              </div>
              <button
                onClick={() => onNavigate('/register')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-grotesk font-bold text-xs shrink-0 transition-colors"
              >
                Accept & Continue
              </button>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};

/* ─────────────────────────────────────────────
   Embedded Modal Version for Register / Login
───────────────────────────────────────────── */
export const PrivacyPolicyModal = ({ isOpen, onClose, onNavigate = () => {} }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-[#0D111E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-base text-slate-900 dark:text-white">
                JPTL Privacy Policy & Data Protections
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Smart Property Management &bull; October 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {PRIVACY_SECTIONS.map((sec) => (
            <div key={sec.id} className="space-y-2">
              <h4 className="font-grotesk font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <sec.icon className="w-4 h-4 text-indigo-500" />
                <span>{sec.title}</span>
              </h4>
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => {
              onClose();
              onNavigate('/privacy');
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Open Dedicated Fullscreen Page</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-grotesk font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
