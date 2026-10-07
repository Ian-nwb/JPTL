import React, { useState } from 'react';
import { 
  Cookie, 
  ArrowLeft, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  Lock, 
  Printer, 
  Search, 
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  X,
  Info,
  Layers,
  Settings
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const COOKIE_SECTIONS = [
  {
    id: 'intro',
    title: '1. What Are Cookies and Tracking Technologies?',
    icon: Cookie,
    content: `Cookies are small data files placed on your browser, device, or mobile application cache when you interact with online services. They allow web platforms to authenticate sessions, remember user preferences (such as dark mode settings), safeguard against cross-site request forgery (CSRF), and maintain reliable application states.

JPTL utilizes strictly necessary session cookies, client-side browser storage (localStorage and sessionStorage for JWT authentication token lifecycles), and service worker caching to deliver an installable Progressive Web Application (PWA) experience.`
  },
  {
    id: 'strictly-necessary',
    title: '2. Strictly Necessary and Authentication Cookies',
    icon: Lock,
    content: `These technologies are essential for the operation of JPTL and cannot be disabled without breaking core platform features. They include:

- Authentication Session Tokens: Storing cryptographically signed JSON Web Tokens (JWT) in browser session storage to maintain verified login sessions across role-segregated routes (Superadmin, Landlord, Tenant).
- Security & CSRF Defense: Ensuring all form submissions and payment requests originate from legitimate, verified user sessions.
- Multi-Tenant Query Isolation: Storing ephemeral workspace context so database queries strictly return your authorized property, lease, and maintenance records.`
  },
  {
    id: 'functional-preferences',
    title: '3. Functional and Preference Technologies',
    icon: Sliders,
    content: `Functional cookies allow JPTL to remember your customized workflow settings. These include:

- Interface Theme Storage: Preserving your selected visual theme (Dark Mode vs. Light Mode) across reloads using localStorage.
- Push Notification Endpoints: Storing VAPID browser push subscriptions in IndexedDB and Service Worker caches so you receive critical maintenance and rent payment alerts even when the browser tab is closed.
- Progressive Web App (PWA) Cache: Caching static UI assets locally on your device to ensure instant page loads and offline resilience.`
  },
  {
    id: 'analytics',
    title: '4. Performance and System Diagnostics Telemetry',
    icon: Layers,
    content: `We collect minimal, anonymized technical telemetry (e.g., page load durations, API latency, and UI runtime error stacks) strictly to detect platform degradation, eliminate bugs, and optimize server microservices.

We DO NOT use intrusive third-party advertising cookies, behavioral tracker networks, or data broker pixels on JPTL.`
  },
  {
    id: 'management',
    title: '5. How You Can Control and Manage Cookies',
    icon: Settings,
    content: `Most modern web browsers allow you to manage cookie preferences through their settings menus. You can configure your browser to reject all cookies, alert you when a cookie is placed, or clear existing stored data.

Please note: If you disable strictly necessary session storage or reject authentication cookies, you will be unable to log in, pay rent, or submit maintenance work orders on JPTL.`
  },
  {
    id: 'contact',
    title: '6. Updates to This Policy and Contact Details',
    icon: Info,
    content: `We may periodically update our Cookies Policy to reflect changes in our technology stack or privacy legislation. For questions regarding our cookie practices, contact our Data Protection Team at privacy@jptl-management.com.`
  }
];

export const CookiePolicyPage = ({ onNavigate = () => {} }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');

  const filteredSections = COOKIE_SECTIONS.filter((sec) =>
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
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-grotesk font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  JPTL Cookies &amp; Tracking Policy
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Transparency &bull; Zero Third-Party Ad Pixels
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
              onClick={() => onNavigate('/terms')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span>Terms of Service</span>
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
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden border border-indigo-500/20 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-xs font-semibold">
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Transparency Disclosure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-grotesk tracking-tight">
              Cookies &amp; Local Storage Policy
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              JPTL uses strictly necessary session storage, encrypted token persistence, and service worker caches to ensure secure property management and instant PWA performance.
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
                placeholder="Search cookie policy..."
                className="w-full bg-white dark:bg-[#0E1222] border border-slate-300 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>

            <nav className="p-3 bg-white dark:bg-[#0E1222] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-1 max-h-[520px] overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Sections
              </div>
              {COOKIE_SECTIONS.map((sec) => {
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

export const CookiePolicyModal = ({ isOpen, onClose, onNavigate = () => {} }) => {
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
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-grotesk font-bold text-base text-slate-900 dark:text-white">
                JPTL Cookies &amp; Storage Policy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Session Storage &bull; PWA Cache &bull; VAPID Push
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
          {COOKIE_SECTIONS.map((sec) => (
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
              onNavigate('/cookies');
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
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
