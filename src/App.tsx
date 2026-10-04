import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Sidebar } from './components/dashboard/Sidebar';
import { TopHeader } from './components/dashboard/TopHeader';
import { Hero } from './components/home/Hero';
import { WhySmap } from './components/home/WhySmap';
import { Features } from './components/home/Features';
import { PackagesSection } from './components/home/PackagesSection';
import { HowItWorks } from './components/home/HowItWorks';
import { MetaPlatformShowcase } from './components/home/MetaPlatformShowcase';
import { Faq } from './components/home/Faq';
import { ContactSection } from './components/home/ContactSection';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { CreateAdFlow } from './components/dashboard/CreateAdFlow';
import { MyCampaigns } from './components/dashboard/MyCampaigns';
import { PaymentsView } from './components/dashboard/PaymentsView';
import { ProfileView } from './components/dashboard/ProfileView';
import { SupportView } from './components/dashboard/SupportView';
import { SettingsView } from './components/dashboard/SettingsView';
import { AdLibraryView } from './components/dashboard/AdLibraryView';
import { ReportsView } from './components/dashboard/ReportsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModals';
import { LegalModal } from './components/LegalModals';
import { CampaignDetailsModal } from './components/dashboard/CampaignDetailsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PolicyPage } from './components/home/PolicyPage';
import { ArrowRight, User as UserIcon } from 'lucide-react';

const getInitialTabFromLocation = (): string => {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (path === '/about' || path === '/about-us') return 'about';
    if (path === '/contact' || path === '/contact-us') return 'contact';
    if (path === '/privacy' || path === '/privacy-policy') return 'privacy';
    if (path === '/terms' || path === '/terms-and-conditions' || path === '/terms-of-service') return 'terms';
    if (path === '/refund' || path === '/refund-policy' || path === '/cancellation-policy') return 'refund';
    if (path === '/pricing' || path === '/packages' || path === '/plans') return 'pricing';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/features') return 'features';

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
  } catch {
    // ignore
  }
  return 'home';
};

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(getInitialTabFromLocation);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'advertising' | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [initialPackageForAd, setInitialPackageForAd] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Check URL query parameters (e.g. from Google OAuth redirects)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const tokenParam = params.get('auth_token') || params.get('token');
      const authError = params.get('auth_error');
      const openLogin = params.get('open_auth') || params.get('open_login');

      if (tokenParam) {
        api.setToken(tokenParam);
      }

      if (tabParam) {
        setCurrentTab(tabParam);
      } else if (user && currentTab === 'home') {
        setCurrentTab('dashboard');
      }

      if (authError) {
        setAuthErrorMessage(authError);
        setAuthModalOpen(true);
      } else if (openLogin) {
        setAuthModalOpen(true);
      }

      // Clean sensitive query parameters from URL bar while preserving tab if set
      if (tokenParam || authError || openLogin) {
        const cleanUrl = tabParam ? `/?tab=${encodeURIComponent(tabParam)}` : window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const openAuth = () => {
    setAuthErrorMessage(null);
    setAuthModalOpen(true);
  };

  const handleStartAdvertising = () => {
    if (user) {
      setCurrentTab('create-ad');
    } else {
      openAuth();
    }
  };

  const handleSelectPackageFromHome = (pkgId: string) => {
    setInitialPackageForAd(pkgId);
    if (user) {
      setCurrentTab('create-ad');
    } else {
      openAuth();
    }
  };

  const handleCampaignCreated = (campaignId: string) => {
    setCurrentTab('my-campaigns');
    setSelectedCampaignId(campaignId);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#080C14] text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white font-extrabold text-xl animate-pulse shadow-lg shadow-purple-600/30">
            S
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
            Initializing SMAP...
          </span>
        </div>
      </div>
    );
  }

  // Dashboard & Authenticated Tabs
  const dashboardTabs = [
    'dashboard',
    'create-ad',
    'my-campaigns',
    'ad-library',
    'payments',
    'reports',
    'profile',
    'settings',
    'admin',
  ];

  const isAuthenticatedWorkspace = user && dashboardTabs.includes(currentTab);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 transition-colors">
      
      {/* If authenticated in workspace mode: Left Sidebar + TopHeader Layout */}
      {isAuthenticatedWorkspace ? (
        <div className="flex-1 flex min-h-screen w-full">
          {/* Left Sidebar matching reference image */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onViewPlans={() => {
              setCurrentTab('dashboard');
              setTimeout(() => {
                const el = document.getElementById('pricing-plans');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />

          {/* Right Main Body */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Header matching reference */}
            <TopHeader
              onToggleMobileMenu={() => setMobileMenuOpen(true)}
              onNavigate={setCurrentTab}
            />

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {currentTab === 'dashboard' && (
                <CustomerDashboard
                  onNavigate={setCurrentTab}
                  onOpenCampaign={(id) => setSelectedCampaignId(id)}
                  onSelectPackage={(pkgId) => setInitialPackageForAd(pkgId)}
                />
              )}

              {currentTab === 'create-ad' && (
                <CreateAdFlow
                  initialPackageId={initialPackageForAd}
                  onCampaignCreated={handleCampaignCreated}
                  onCancel={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'my-campaigns' && (
                <MyCampaigns
                  onOpenCampaign={(id) => setSelectedCampaignId(id)}
                  onCreateNew={() => setCurrentTab('create-ad')}
                />
              )}

              {currentTab === 'ad-library' && (
                <AdLibraryView onNavigate={setCurrentTab} />
              )}

              {currentTab === 'payments' && (
                <PaymentsView />
              )}

              {currentTab === 'reports' && (
                <ReportsView />
              )}

              {currentTab === 'profile' && (
                <ProfileView />
              )}

              {currentTab === 'settings' && (
                <SettingsView />
              )}

              {currentTab === 'admin' && user.role === 'admin' && (
                <AdminDashboard />
              )}
            </main>

            {/* Universal Footer */}
            <Footer
              onOpenLegal={(type) => setLegalModalType(type)}
              onNavigate={setCurrentTab}
            />
          </div>
        </div>
      ) : (
        /* Public or Unauthenticated Experience */
        <div className="flex-1 flex flex-col">
          {/* Universal Top Navigation */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            openAuthModal={openAuth}
          />

          <main className="flex-1">
            {/* PUBLIC HOMEPAGE */}
            {currentTab === 'home' && (
              <div>
                <Hero
                  onStartAdvertising={handleStartAdvertising}
                  onViewPackages={() => {
                    const el = document.getElementById('packages');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else setCurrentTab('packages');
                  }}
                />
                <WhySmap />
                <PackagesSection onSelectPackage={handleSelectPackageFromHome} />
                <Features />
                <HowItWorks />
                <MetaPlatformShowcase />
                <Faq />

                {/* Final CTA */}
                <section className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#090D18] dark:to-[#0D1426] text-center">
                  <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Launch Your Meta Ads Today
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Ready to Grow Your Business on Facebook & Instagram?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                      Experience seamless UPI checkout, transparent durations, and automated campaign pause scheduling.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleStartAdvertising}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all"
                      >
                        Start Advertising on SMAP
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </section>

                <ContactSection />
              </div>
            )}

            {/* PUBLIC TAB: HOW IT WORKS */}
            {currentTab === 'how-it-works' && (
              <div className="py-12">
                <HowItWorks />
                <MetaPlatformShowcase />
                <div className="text-center py-12">
                  <button
                    onClick={handleStartAdvertising}
                    className="rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25"
                  >
                    Start Advertising
                  </button>
                </div>
              </div>
            )}

            {/* PUBLIC TAB: PACKAGES */}
            {currentTab === 'packages' && (
              <div className="py-12">
                <PackagesSection onSelectPackage={handleSelectPackageFromHome} />
                <Faq />
              </div>
            )}

            {/* PUBLIC TAB: FEATURES */}
            {currentTab === 'features' && (
              <div className="py-12">
                <Features />
                <WhySmap />
              </div>
            )}

            {/* PUBLIC TAB: ABOUT */}
            {currentTab === 'about' && (
              <PolicyPage type="about" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* PUBLIC TAB: PRICING */}
            {currentTab === 'pricing' && (
              <PolicyPage type="pricing" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* PUBLIC TAB: PRIVACY POLICY */}
            {currentTab === 'privacy' && (
              <PolicyPage type="privacy" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* PUBLIC TAB: TERMS & CONDITIONS */}
            {currentTab === 'terms' && (
              <PolicyPage type="terms" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* PUBLIC TAB: REFUND & CANCELLATION */}
            {currentTab === 'refund' && (
              <PolicyPage type="refund" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* PUBLIC TAB: CONTACT */}
            {currentTab === 'contact' && (
              <PolicyPage type="contact" onNavigate={setCurrentTab} onOpenAuth={openAuth} />
            )}

            {/* Protected Tab accessed while unauthenticated */}
            {!user && dashboardTabs.includes(currentTab) && (
              <div className="mx-auto max-w-md px-4 py-24 text-center space-y-4 animate-in fade-in">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400">
                  <UserIcon className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please sign in with your Google account to access your SMAP dashboard.
                </p>
                <div className="pt-2">
                  <button
                    onClick={openAuth}
                    className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all"
                  >
                    Continue with Google
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Universal Footer */}
          <Footer
            onOpenLegal={(type) => setLegalModalType(type)}
            onNavigate={setCurrentTab}
          />
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthErrorMessage(null);
        }}
        onSuccess={() => setCurrentTab('dashboard')}
        onOpenLegal={(type) => setLegalModalType(type)}
        initialError={authErrorMessage}
      />

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <CampaignDetailsModal
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
