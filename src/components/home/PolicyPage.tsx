import React from 'react';
import { ArrowLeft, Shield, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export type PolicyType = 'about' | 'privacy' | 'terms' | 'refund' | 'pricing' | 'contact';

interface PolicyPageProps {
  type: PolicyType;
  onNavigate: (tab: string) => void;
  onOpenAuth?: () => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type, onNavigate, onOpenAuth }) => {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 dark:bg-[#080C14] text-slate-800 dark:text-slate-200 transition-colors">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back button */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>

        {/* Content Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220] p-6 sm:p-10 shadow-sm space-y-8">

          {/* ===================== ABOUT US ===================== */}
          {type === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Business Information & Mission
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  About SMAP
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sahil Marketing Ads Powerful • Official Facebook & Instagram Advertising Management
                </p>
              </div>

              <section className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Who We Are</h2>
                <p>
                  <strong>SMAP (Sahil Marketing Ads Powerful)</strong> is an Indian digital advertising technology platform operated by <strong>Sahil</strong>. We are dedicated to empowering Indian small businesses, retail shops, local services, and content creators by simplifying the process of creating, launching, and managing professional advertising campaigns on Facebook and Instagram.
                </p>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Our Services</h2>
                <p>
                  SMAP provides comprehensive digital advertising campaign management services:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li><strong>Target Audience Optimization:</strong> Configuration of geographic targeting across India (all states or select metro cities), demographic selections, and platform placements.</li>
                  <li><strong>Meta API Integration:</strong> Direct connection with Meta Graph APIs to submit ad copy, headlines, and approved creative assets (images and videos).</li>
                  <li><strong>Automated Duration Scheduling:</strong> Guaranteed real-time campaign lifecycle monitoring (5, 10, 14, or 30 days) with automated server-side pause operations when campaign durations conclude.</li>
                  <li><strong>Transparent UPI Billing:</strong> Frictionless micro-packages in Indian Rupees (INR) starting at ₹200 without recurring debit cards or hidden lock-ins.</li>
                </ul>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Digital Delivery Model</h2>
                <p>
                  All services provided by SMAP are delivered digitally. Upon confirmed UPI payment, our system initiates campaign provisioning, prepares Meta ad creative units, and submits them to Meta review algorithms. Once approved by Meta, the advertising campaign starts active delivery across Facebook and Instagram feeds and stories.
                </p>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Realistic Performance Policy (No Guaranteed Outcomes)</h2>
                <p>
                  SMAP is an independent advertising management technology. We strictly adhere to truth-in-advertising guidelines. <strong>We do NOT guarantee viral reach, specific click quantities, conversion volumes, or sales results.</strong> Actual ad performance is governed by Meta’s real-time auction algorithms, creative resonance, and consumer market factors.
                </p>
              </section>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('pricing')}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25"
                >
                  View Packages & Pricing
                </button>
                <button
                  onClick={() => onNavigate('contact')}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Contact Our Operations Team
                </button>
              </div>
            </div>
          )}

          {/* ===================== CONTACT US ===================== */}
          {type === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Customer Care & Support
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Contact Us
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Official Merchant Contact Information for Customer Grievances & Inquiries
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-4 space-y-1">
                  <span className="text-slate-400 font-medium">Merchant Legal Name:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">SMAP (Sahil Marketing Ads Powerful)</p>
                  <p className="text-slate-500">Proprietor / Operating Lead: Sahil</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-4 space-y-1">
                  <span className="text-slate-400 font-medium">Primary Support Email:</span>
                  <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                    sahilking17341734@gmail.com
                  </p>
                  <p className="text-slate-500">Alternate: support@smap.in</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-4 space-y-1">
                  <span className="text-slate-400 font-medium">Phone Support:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">+91 98765 43210</p>
                  <p className="text-slate-500">Hours: Mon - Sat, 9:00 AM to 7:00 PM IST</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-4 space-y-1">
                  <span className="text-slate-400 font-medium">Operational Address:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">New Delhi, Delhi, India - 110001</p>
                  <p className="text-slate-500">Jurisdiction: Courts of New Delhi</p>
                </div>
              </div>

              <section className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 pt-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Support Commitment</h2>
                <p>
                  For any questions concerning package selection, payment issues, UPI verification status, campaign approval delays, or refund requests, please email us directly with your <strong>Payment Reference / Order ID</strong>. We acknowledge all customer requests within <strong>24 business hours</strong> and strive to resolve inquiries within <strong>48 hours</strong>.
                </p>
              </section>
            </div>
          )}

          {/* ===================== PRIVACY POLICY ===================== */}
          {type === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Data Protection & Privacy
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Privacy Policy
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Effective Date: October 2026 • In Compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act)
                </p>
              </div>

              <section className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  At <strong>SMAP (Sahil Marketing Ads Powerful)</strong>, accessible from our official website, the privacy of our visitors and registered merchants is one of our top priorities. This Privacy Policy outlines the types of information we collect, how it is processed, and your data rights.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li><strong>Account Data:</strong> Name, Email Address, Phone Number, and authenticated Google OAuth profile data when you register or sign in.</li>
                  <li><strong>Advertising Campaign Data:</strong> Ad headlines, descriptions, creative media URLs (images/videos), destination links, and demographic targeting criteria.</li>
                  <li><strong>Transaction Records:</strong> Package selected, payment amount (in INR), date/time of transaction, gateway order ID, and 12-digit UPI reference (UTR) numbers.</li>
                </ul>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Payment Processing (Razorpay Disclosure)</h2>
                <p>
                  All commercial payments on SMAP are processed strictly through <strong>Razorpay Software Private Limited</strong>, an RBI-authorized payment aggregator, via mobile Unified Payments Interface (UPI).
                </p>
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-slate-700 dark:text-slate-300">
                  <strong>Important Security Notice:</strong> SMAP does NOT collect, store, or have access to your bank account passwords, UPI PINs, or debit/credit card CVV codes. All payment credential interactions occur entirely on Razorpay's secure, PCI-DSS compliant infrastructure.
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Third-Party Sharing</h2>
                <p>
                  We share your data solely with essential technical service providers:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li><strong>Razorpay:</strong> To process payments, verify UTR transactions, and facilitate refunds.</li>
                  <li><strong>Meta Platforms, Inc. (Facebook/Instagram):</strong> To deliver your configured ad creatives and targeting to the Meta advertising network via official OAuth integration.</li>
                </ul>
                <p>We do not sell, rent, or trade your personal information to third-party marketing brokers.</p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Data Retention & Deletion</h2>
                <p>
                  We retain merchant campaign records for statutory accounting and audit purposes as mandated by Indian law. In accordance with the Digital Personal Data Protection Act, 2023, you have the right to inspect, correct, or request deletion of your account data. To request data deletion, contact our Data Grievance Officer at <strong>sahilking17341734@gmail.com</strong>.
                </p>
              </section>
            </div>
          )}

          {/* ===================== TERMS & CONDITIONS ===================== */}
          {type === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  User Agreement & Service Terms
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Terms & Conditions
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Last Updated: October 2026 • Governing Law: Republic of India
                </p>
              </div>

              <section className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Service Provider</h2>
                <p>
                  This website and advertising platform are owned and operated by <strong>SMAP (Sahil Marketing Ads Powerful)</strong>, with operations led by <strong>Sahil</strong> (Email: sahilking17341734@gmail.com). By creating an account, selecting a package, or using our tools, you agree to these Terms and Conditions.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Scope of Services</h2>
                <p>
                  SMAP provides software tools for compiling and submitting digital advertising campaigns to Meta's advertising ecosystem (Facebook and Instagram). Service delivery is digital and begins promptly once UPI payment is verified and ad assets are received.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Pricing & Billing (in INR)</h2>
                <p>
                  All prices are quoted and charged exclusively in Indian Rupees (INR):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li><strong>Starter Sprint:</strong> ₹200 for 5 consecutive days</li>
                  <li><strong>Growth Accelerate:</strong> ₹399 for 10 consecutive days</li>
                  <li><strong>Business Pro:</strong> ₹549 for 14 consecutive days</li>
                  <li><strong>Enterprise Scale:</strong> ₹749 for 30 consecutive days</li>
                </ul>
                <p>
                  Payments are accepted strictly via mobile UPI (Google Pay, PhonePe, Paytm, BHIM, CRED) processed through our payment gateway partner, <strong>Razorpay</strong>.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">4. User Content & Meta Compliance</h2>
                <p>
                  Customers are solely responsible for ensuring that all advertised products, services, text, images, and video creatives comply with Meta's Commercial Advertising Standards and applicable Indian laws. SMAP reserves the right to reject campaigns that involve prohibited items (weapons, tobacco, adult services, deceptive financial schemes, or trademark infringements).
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Automatic Pause & Expiry</h2>
                <p>
                  Every campaign runs for the exact purchased duration. When the package duration expires, our server-side scheduler automatically issues a pause command to Meta's APIs to prevent unwanted expenditures.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">6. Dispute Jurisdiction</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>New Delhi, India</strong>.
                </p>
              </section>
            </div>
          )}

          {/* ===================== REFUND & CANCELLATION ===================== */}
          {type === 'refund' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Consumer Protection & Fair Settlement
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Refund & Cancellation Policy
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Clear, Fair & Transparent Settlement for All Advertisers
                </p>
              </div>

              <section className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Cancellation Policy</h2>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li><strong>Before Campaign Submission:</strong> You may cancel any pending draft campaign before it is submitted to Meta for review. In this event, a 100% full refund can be issued.</li>
                  <li><strong>After Meta Submission & Approval:</strong> Because ad space and computational resources are reserved directly in Meta’s advertising auction, once a campaign is ACTIVE and delivering impressions on Facebook or Instagram, the active campaign duration cannot be cancelled or refunded for consumed days.</li>
                </ul>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Eligible Refund Scenarios</h2>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Technical Failure:</strong> If a payment is confirmed via UPI, but our system fails to submit your campaign to Meta within 48 hours and the issue cannot be resolved, you are entitled to an immediate 100% refund.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Duplicate Transactions:</strong> If your UPI account was debited multiple times due to a gateway network timeout, the duplicate charge will be automatically refunded in full.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Meta Rejection with Unresolvable Issue:</strong> If Meta permanently rejects your ad creative and you do not wish to substitute alternative creative assets, you may request a refund within <strong>7 days</strong> of payment.</span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Refund Request Window</h2>
                <p>
                  Customers must submit refund requests within <strong>7 calendar days</strong> from the date of the UPI transaction. Requests submitted after 7 calendar days will be evaluated on a case-by-case basis.
                </p>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Refund Method & Processing Timeframe</h2>
                <p>
                  All approved refunds are credited back to the <strong>original UPI account / bank account</strong> through which the initial payment was completed via <strong>Razorpay</strong>.
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-4 text-xs text-slate-700 dark:text-slate-300">
                  <strong>Settlement Timeline:</strong> Refunds are initiated within <strong>24 to 48 business hours</strong> upon review approval. Depending on your bank's UPI processing system, funds typically reflect in your account within <strong>5 to 7 working days</strong>.
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">5. How to Request a Refund</h2>
                <p>
                  To request a refund, please send an email to:
                </p>
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-purple-900 dark:text-purple-200 font-mono">
                  Email: sahilking17341734@gmail.com<br />
                  Subject: Refund Request - [Your Campaign Name or UPI UTR]<br />
                  Details: Please include your 12-digit UTR reference, payment date, and registered email address.
                </div>
              </section>
            </div>
          )}

          {/* ===================== PRICING & PACKAGES ===================== */}
          {type === 'pricing' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Transparent Digital Service Rates
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Pricing & Advertising Packages
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All Plans Include Unified Facebook & Instagram Ad Placement • UPI Instant Intent Checkout
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 200 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Starter Sprint</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold">5 Days</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹200 <span className="text-xs font-normal text-slate-500">/ 5 days</span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">✓ Facebook + Instagram placements</li>
                    <li className="flex items-center gap-2">✓ Target audience & geo-targeting setup</li>
                    <li className="flex items-center gap-2">✓ Real-time campaign status tracking</li>
                    <li className="flex items-center gap-2">✓ Automatic pause on day 5 expiry</li>
                  </ul>
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else onNavigate('home');
                    }}
                    className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all"
                  >
                    Select ₹200 Plan
                  </button>
                </div>

                {/* 399 */}
                <div className="rounded-2xl border-2 border-purple-500 bg-purple-500/5 dark:bg-[#121A30] p-6 space-y-4 relative">
                  <span className="absolute -top-3 right-4 bg-purple-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wide">
                    Most Popular
                  </span>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Growth Accelerate</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">10 Days</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹399 <span className="text-xs font-normal text-slate-500">/ 10 days</span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">✓ Dual Facebook & Instagram delivery</li>
                    <li className="flex items-center gap-2">✓ 10 Days extended learning optimization</li>
                    <li className="flex items-center gap-2">✓ Priority campaign review submission</li>
                    <li className="flex items-center gap-2">✓ Automated pause on day 10 expiry</li>
                  </ul>
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else onNavigate('home');
                    }}
                    className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    Select ₹399 Plan
                  </button>
                </div>

                {/* 549 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Business Pro</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold">14 Days</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹549 <span className="text-xs font-normal text-slate-500">/ 14 days</span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">✓ 2 Full weeks of sustained brand presence</li>
                    <li className="flex items-center gap-2">✓ Audience reach across all 28 Indian states</li>
                    <li className="flex items-center gap-2">✓ Real-time pause scheduler integration</li>
                  </ul>
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else onNavigate('home');
                    }}
                    className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all"
                  >
                    Select ₹549 Plan
                  </button>
                </div>

                {/* 749 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E1528] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Enterprise Scale</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold">30 Days</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹749 <span className="text-xs font-normal text-slate-500">/ 30 days</span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">✓ Full monthly advertising duration</li>
                    <li className="flex items-center gap-2">✓ Maximum audience algorithmic learning</li>
                    <li className="flex items-center gap-2">✓ Automated pause on day 30 expiry</li>
                  </ul>
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else onNavigate('home');
                    }}
                    className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all"
                  >
                    Select ₹749 Plan
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0E1424] p-4 text-xs text-slate-500 dark:text-slate-400">
                <strong>Delivery & Payment Policy:</strong> All packages are delivered digitally upon verified UPI payment through Razorpay. You can pay with Google Pay, PhonePe, Paytm, BHIM, or any UPI app. No recurring credit card charges.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
