import React, { useState } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Lock, 
  Printer, 
  Search, 
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const TERMS_SECTIONS = [
  {
    id: 'agreement',
    title: '1. Agreement to Terms and Platform Scope',
    icon: Scale,
    content: `These Terms of Service ("Terms") constitute a legally binding agreement between JPTL Technologies Inc. ("JPTL", "Company", "we", "our", or "us") and any individual or corporate entity ("User", "you", "Landlord", or "Tenant") accessing or utilizing the JPTL Smart Property Management System, progressive web applications (PWAs), application programming interfaces (APIs), and associated cloud services.

By creating an account, accessing any portal dashboard, paying rent or service fees, or submitting maintenance requests through JPTL, you expressly agree to be bound by these Terms, our Privacy Policy, and our Cookies Policy. If you do not agree to these Terms in their entirety, you must discontinue platform use immediately.`
  },
  {
    id: 'roles-scope',
    title: '2. User Roles, Eligibility, and Account Security',
    icon: Building2,
    content: `JPTL provides role-segregated interfaces tailored for three distinct user tiers: Platform Superadministrators, Property Landlords/Managers, and Resident Tenants. To establish an account, you must have attained the age of majority (eighteen (18) years of age or older) and possess legal capacity to enter binding contracts.

Landlords represent and warrant that they hold valid ownership rights or formal management authorizations over properties and units configured on the platform. Tenants acknowledge that resident access credentials are assigned in connection with an underlying residential or commercial tenancy.

You are responsible for maintaining the strict confidentiality of your authentication credentials, multi-factor tokens, and session identifiers. You must immediately notify JPTL upon discovering any unauthorized account access or security anomaly.`
  },
  {
    id: 'intermediary',
    title: '3. Scope of Software Services & Landlord-Tenant Intermediary Disclaimer',
    icon: HelpCircle,
    content: `JPTL is a technology software platform designed to streamline tenancy administration, digital ledger bookkeeping, communication routing, and automated maintenance workflows. JPTL IS NOT A REAL ESTATE BROKER, PROPERTY OWNER, LEASING AGENT, INSURER, OR ESCROW FIDUCIARY.

All lease agreements, rent obligations, security deposits, physical habitability conditions, and premises repairs remain strictly bilateral contractual matters between the Landlord and Tenant. JPTL does not endorse, guarantee, or assume liability for the condition, legality, safety, or suitability of any managed property, nor do we guarantee the financial solvency or contractual performance of any landlord or tenant.`
  },
  {
    id: 'financial',
    title: '4. Rent Payments, Invoicing, and Fee Reconciliation',
    icon: Lock,
    content: `The platform allows landlords to generate digital invoices and allows tenants to review charges and settle balances via integrated third-party payment processors. All digital payment transactions are processed under the respective terms and fee schedules of our PCI-DSS-compliant gateway partners.

Users acknowledge that transaction settlement timelines, bank clearing schedules, and gateway processing fees are dictated by payment networks. JPTL is not responsible for overdraft penalties, transaction reversals, chargebacks, or banking delays resulting from erroneous bank account information provided by users.`
  },
  {
    id: 'maintenance',
    title: '5. Maintenance Tickets, Work Orders, and Emergency Disclaimer',
    icon: AlertCircle,
    content: `Tenants may submit maintenance requests and upload photographic or video documentation through the platform. The platform automates ticket state transitions and notification dispatches to assigned property managers.

CRITICAL EMERGENCY NOTICE: JPTL IS NOT AN EMERGENCY DISPATCH SERVICE. For life-threatening emergencies, fires, gas leaks, structural collapse, or active criminal incidents, users must immediately contact municipal emergency services (e.g., 911 or local emergency authorities) rather than relying on digital ticket submissions.`
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use and Prohibited Activities',
    icon: ShieldCheck,
    content: `Users agree not to misuse the platform. Prohibited activities include: reverse-engineering, decompiling, or attempting to discover source code; attempting unauthorized penetration testing or bypassing Role-Based Access Controls; submitting fraudulent, deceptive, or defamatory claims; uploading viruses or malicious scripts; harvesting user information without authorization; or utilizing JPTL to violate fair housing, tenant rights, or local property zoning regulations.`
  },
  {
    id: 'intellectual-property',
    title: '7. Intellectual Property Rights and User Submissions',
    icon: FileText,
    content: `All software code, visual designs, graphic interfaces, trademarks, and documentation comprising JPTL remain the exclusive proprietary property of JPTL Technologies Inc. and its licensors.

Users retain ownership of documents, lease copies, and maintenance photos uploaded to the platform. By uploading content, you grant JPTL a non-exclusive, worldwide, royalty-free license to store, process, and display such data strictly as necessary to deliver platform services and fulfill audit trail obligations.`
  },
  {
    id: 'liability',
    title: '8. Disclaimers of Warranties and Limitation of Liability',
    icon: Scale,
    content: `THE JPTL PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR UNINTERRUPTED OPERATION.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, JPTL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, LOSS OF PROFITS, PROPERTY DAMAGE, OR SYSTEM DOWNTIME ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES.`
  },
  {
    id: 'termination',
    title: '9. Suspension, Termination, and Account Closure',
    icon: AlertCircle,
    content: `JPTL reserves the right to suspend or terminate user accounts that violate these Terms, engage in fraudulent transactions, or compromise platform security. Upon termination, your right to access the software ceases immediately, while statutory data retention rules continue to apply to historical audit and financial ledgers.`
  },
  {
    id: 'governing-law',
    title: '10. Governing Law, Dispute Resolution, and Contact',
    icon: Building2,
    content: `These Terms shall be governed by and construed in accordance with applicable governing laws without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved through good-faith negotiation prior to formal legal or arbitral proceedings.

For questions regarding these Terms, contact our legal team at legal@jptl-management.com or by mail at JPTL Legal Department, 100 Innovation Way, Suite 400.`
  }
];

export const TermsOfServicePage = ({ onNavigate = () => {} }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('agreement');

  const filteredSections = TERMS_SECTIONS.filter((sec) =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-grotesk font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  JPTL Terms of Service
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Effective: October 2026 &bull; Master Services Agreement
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/privacy')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => onNavigate('/cookies')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span>Cookies Policy</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Print"
            >
              <Printer className="w-4 h-4" />
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Banner */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border border-indigo-500/20 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Standard Tenancy &amp; Management Agreement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-grotesk tracking-tight">
              Terms of Service &amp; Operational Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Please review the terms and contractual conditions governing your use of JPTL for property listings, leasing, work order dispatches, and online rent settlements.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms..."
                className="w-full bg-white dark:bg-[#0E1222] border border-slate-300 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>

            <nav className="p-3 bg-white dark:bg-[#0E1222] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-1 max-h-[520px] overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Sections
              </div>
              {TERMS_SECTIONS.map((sec) => {
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
          </aside>

          {/* Right Sections */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.map((sec) => {
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
            })}
          </div>

        </div>

      </main>

    </div>
  );
};

export const TermsOfServiceModal = ({ isOpen, onClose, onNavigate = () => {} }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-[#0D111E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-base text-slate-900 dark:text-white">
                JPTL Terms of Service
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Smart Property Management Agreement &bull; October 2026
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

        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {TERMS_SECTIONS.map((sec) => (
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

        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => {
              onClose();
              onNavigate('/terms');
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
            I Accept the Terms
          </button>
        </div>
      </div>
    </div>
  );
};
