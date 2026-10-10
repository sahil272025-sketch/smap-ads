export type PolicyKey = 'about' | 'privacy' | 'terms' | 'refund' | 'pricing' | 'contact';

interface PageMetadata {
  title: string;
  description: string;
  heading: string;
  subtitle: string;
}

const META_DATA: Record<PolicyKey, PageMetadata> = {
  about: {
    title: 'About SMAP - Facebook & Instagram Advertising Platform',
    description: 'Learn about SMAP (Sahil Marketing Ads Powerful), our mission, and our verified digital advertising management services on Facebook and Instagram.',
    heading: 'About SMAP',
    subtitle: 'Sahil Marketing Ads Powerful • Digital Advertising Management Platform',
  },
  privacy: {
    title: 'Privacy Policy - SMAP Advertising',
    description: 'Privacy Policy for SMAP advertising platform. Learn how we collect, process, and protect your data in compliance with DPDP Act 2023.',
    heading: 'Privacy Policy',
    subtitle: 'Effective October 2026 • Digital Personal Data Protection Act Compliance',
  },
  terms: {
    title: 'Terms & Conditions - SMAP Advertising',
    description: 'Terms and Conditions governing the use of SMAP digital advertising campaign management services for Facebook and Instagram.',
    heading: 'Terms & Conditions',
    subtitle: 'Last Updated: October 2026 • Governing Law: Republic of India',
  },
  refund: {
    title: 'Refund & Cancellation Policy - SMAP Advertising',
    description: 'Fair settlement and refund terms for SMAP advertising packages. Transparent 7-day refund policy for uninitiated campaigns.',
    heading: 'Refund & Cancellation Policy',
    subtitle: 'Consumer Protection, Fair Settlement & UPI Reversal Terms',
  },
  pricing: {
    title: 'Pricing & Advertising Packages - SMAP',
    description: 'Transparent rates in Indian Rupees (INR) for Facebook & Instagram ad management packages: ₹200 (5 days), ₹399 (10 days), ₹549 (14 days), ₹749 (30 days).',
    heading: 'Pricing & Packages',
    subtitle: 'Transparent Indian Rupee (INR) Advertising Rates with Automated Duration Tracking',
  },
  contact: {
    title: 'Contact Us & Grievance Redressal - SMAP',
    description: 'Get in touch with SMAP merchant support operations. Official contact email, customer support telephone, and grievance officer details.',
    heading: 'Contact Us',
    subtitle: 'Customer Support, Merchant Inquiries & Grievance Redressal',
  },
};

export function renderPolicyHtml(key: PolicyKey): string {
  const meta = META_DATA[key];

  let bodyContent = '';

  if (key === 'about') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">1. Who We Are & What We Do</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            <strong>SMAP (Sahil Marketing Ads Powerful)</strong> is an Indian digital advertising technology platform operated by <strong>Sahil</strong>. We are committed to making professional social media marketing accessible to small businesses, local retail shops, direct-to-consumer entrepreneurs, and service providers across India.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">2. Services Provided</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-3">
            SMAP delivers digital advertising campaign management services for <strong>Facebook</strong> and <strong>Instagram</strong>:
          </p>
          <ul class="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li><strong>Target Audience Configuration:</strong> Precision geographic targeting spanning all 28 states and union territories in India or targeted regional clusters, audience demographic parameters, and placement preferences.</li>
            <li><strong>Official Meta API Submission:</strong> Seamless compilation and transmission of approved ad creatives (images and videos), headlines, body copy, and destination links directly to Meta's advertising servers.</li>
            <li><strong>Automated Duration Scheduling:</strong> Fixed lifecycle monitoring for 5, 10, 14, or 30 days. When a package expires, our server scheduler automatically sends a pause instruction to the Meta Graph API to prevent extra charges.</li>
            <li><strong>Frictionless UPI Payments:</strong> Real-time Indian Rupee (INR) package billing processed securely via Razorpay without recurring card subscriptions.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">3. Digital Delivery Model</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            All services sold on this website are delivered <strong>digitally</strong>. Once your payment is confirmed by our backend via UPI, campaign drafting is finalized and submitted to Meta's automated ad review system. Upon approval by Meta, your campaign goes live and delivers impressions across the selected platforms.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">4. Truth in Advertising (No Guaranteed Results)</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            SMAP is an independent campaign management software. We do NOT guarantee viral reach, specific click numbers, leads, or guaranteed sales. Actual campaign performance is subject to Meta's real-time auction, customer creative quality, competitive market bidding, and consumer interest.
          </p>
        </div>
      </section>
    `;
  } else if (key === 'contact') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-3">Merchant Information & Support Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span class="block text-xs text-slate-500 font-medium">Merchant Legal Name</span>
              <span class="font-bold text-slate-900 text-base">SMAP (Sahil Marketing Ads Powerful)</span>
              <p class="text-xs text-slate-500 mt-1">Proprietor: Sahil</p>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span class="block text-xs text-slate-500 font-medium">Primary Support Email</span>
              <a href="mailto:sahilking17341734@gmail.com" class="font-bold text-purple-600 text-base hover:underline">
                sahilking17341734@gmail.com
              </a>
              <p class="text-xs text-slate-500 mt-1">Alternate: support@smap.in</p>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span class="block text-xs text-slate-500 font-medium">Telephone Helpline</span>
              <span class="font-bold text-slate-900 text-base">+91 98765 43210</span>
              <p class="text-xs text-slate-500 mt-1">Hours: Mon – Sat, 9:00 AM – 7:00 PM IST</p>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span class="block text-xs text-slate-500 font-medium">Operational Headquarters</span>
              <span class="font-bold text-slate-900 text-base">New Delhi, Delhi, India - 110001</span>
              <p class="text-xs text-slate-500 mt-1">Jurisdiction: Courts of New Delhi</p>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">Designated Grievance Redressal Officer</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-3">
            In compliance with the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the details of the designated Grievance Officer for SMAP are set out below:
          </p>
          <div class="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2 text-sm">
            <p><strong>Grievance Officer:</strong> Sahil Gupta</p>
            <p><strong>Designation:</strong> Proprietor & Chief Grievance Officer, SMAP</p>
            <p><strong>Direct Email:</strong> <a href="mailto:sahilking17341734@gmail.com" class="text-purple-600 font-bold hover:underline">sahilking17341734@gmail.com</a></p>
            <p><strong>Postal Address:</strong> Operational Headquarters, New Delhi, Delhi, India - 110001</p>
            <p><strong>Helpline Phone:</strong> +91 98765 43210 (Mon–Sat, 9:00 AM – 7:00 PM IST)</p>
            <p><strong>Redressal Timelines:</strong> Every grievance or complaint is acknowledged with a unique tracking ticket within <strong>24 business hours</strong> and resolved within <strong>15 calendar days</strong> from receipt.</p>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">Customer Care, Ticket Tracking & Dispute Resolution</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Logged-in customers can submit, track, and receive replies on support complaints and refund requests directly inside the SMAP Dashboard under the <strong>Support & Grievances</strong> tab. Alternatively, email your inquiry along with your <strong>12-digit UPI reference (UTR)</strong>, registered email, and campaign title to <strong>sahilking17341734@gmail.com</strong>.
          </p>
        </div>
      </section>
    `;
  } else if (key === 'privacy') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">1. Personal Data We Collect</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-2">
            SMAP collects only information strictly necessary to provide campaign management services:
          </p>
          <ul class="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
            <li><strong>Account Identifiers:</strong> Name, Email Address (e.g. for billing confirmations), and Phone Number.</li>
            <li><strong>OAuth Credentials:</strong> When you connect your Facebook or Instagram advertising account, we store authorized Meta OAuth access tokens. We never ask for or store your Facebook passwords.</li>
            <li><strong>Campaign Assets:</strong> Headlines, body text, creative media URLs, and audience preferences.</li>
            <li><strong>Payment Logs:</strong> Gateway order IDs, transaction amounts in INR, timestamps, and 12-digit UPI UTR numbers.</li>
          </ul>
        </div>

        <div class="p-4 rounded-xl border border-purple-200 bg-purple-50 text-slate-800 text-sm">
          <h3 class="font-bold text-purple-900 mb-1">2. Payment Gateway Disclosure (Razorpay)</h3>
          <p class="text-xs leading-relaxed text-slate-700">
            All payments on SMAP are processed securely by <strong>Razorpay Software Private Limited</strong>, an authorized payment aggregator licensed by the Reserve Bank of India (RBI). SMAP strictly operates on mobile UPI. <strong>We do not collect, process, or store credit card numbers, debit card details, CVVs, or UPI PINs.</strong> All payment processing occurs on Razorpay’s PCI-DSS compliant secure infrastructure.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">3. Purpose and Legal Basis of Processing</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Data is collected to fulfill our service agreement: verifying your UPI payment, submitting your ad to Meta Graph APIs, enforcing your campaign duration schedule, providing customer support, and complying with statutory tax reporting under Indian law.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">4. Your Data Rights (DPDP Act 2023)</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Under India's Digital Personal Data Protection Act, 2023, you have the right to access, review, correct, or request deletion of your personal data stored on our servers. To exercise your rights, email our Grievance Officer at <strong>sahilking17341734@gmail.com</strong>.
          </p>
        </div>
      </section>
    `;
  } else if (key === 'terms') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">1. Acceptance & Operating Entity</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            These Terms & Conditions constitute a legally binding agreement between you and <strong>SMAP (Sahil Marketing Ads Powerful)</strong>, operated by <strong>Sahil</strong> (Email: sahilking17341734@gmail.com). By using our website or ordering services, you accept and agree to be bound by these terms.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">2. Digital Services & Immediate Delivery</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            SMAP sells digital marketing campaign management for Facebook and Instagram. Delivery is digital and immediate upon backend UPI verification. We provision ad setups and transmit campaign parameters to Meta's advertising platform.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">3. Pricing & Currency (Indian Rupees - INR)</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-2">
            All prices are quoted and billed strictly in <strong>Indian Rupees (INR)</strong>:
          </p>
          <ul class="list-disc pl-5 text-sm text-slate-600 space-y-1">
            <li><strong>Starter Sprint:</strong> ₹200 for 5 consecutive calendar days</li>
            <li><strong>Growth Accelerate:</strong> ₹399 for 10 consecutive calendar days</li>
            <li><strong>Business Pro:</strong> ₹549 for 14 consecutive calendar days</li>
            <li><strong>Enterprise Scale:</strong> ₹749 for 30 consecutive calendar days</li>
          </ul>
          <p class="text-xs text-slate-500 mt-2">
            Payment Method: Mobile UPI ONLY (PhonePe, Google Pay, Paytm, BHIM, CRED) processed through <strong>Razorpay</strong>.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">4. User Responsibilities & Meta Standards</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Users warrant that they hold the legal rights to all trademarks, images, and text uploaded to SMAP. All ad copy must comply with Meta's Commercial Advertising Standards. Any ad promoting prohibited or illegal products will be terminated without refund.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">5. Automated Campaign Pausing</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            When a campaign's duration expires (5, 10, 14, or 30 days), our server-side scheduler sends an automated pause command to Meta's API to ensure no unexpected charges accrue.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">6. Governing Law & Jurisdiction</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            These Terms are governed by and construed in accordance with the laws of the Republic of India. The parties irrevocably submit to the exclusive jurisdiction of the competent courts in <strong>New Delhi, India</strong> for any disputes.
          </p>
        </div>
      </section>
    `;
  } else if (key === 'refund') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">1. Cancellation Policy</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-2">
            We offer fair and transparent cancellation guidelines:
          </p>
          <ul class="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li><strong>Prior to Meta Submission:</strong> You may cancel any pending or draft campaign before it is submitted to Meta for review. In this event, a <strong>100% full refund</strong> will be issued immediately.</li>
            <li><strong>Active Meta Campaigns:</strong> Once a campaign is submitted, approved, and actively delivering impressions on Facebook or Instagram, computational and advertising inventory has been reserved. Active delivering campaigns cannot be cancelled for days already delivered.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">2. 7-Day Refund Window & Eligible Situations</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-2">
            You are entitled to a full refund within <strong>7 calendar days</strong> of payment under the following circumstances:
          </p>
          <div class="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p>✓ <strong>Technical Submission Failure:</strong> If payment was confirmed but our platform is unable to submit your campaign to Meta within 48 hours.</p>
            <p>✓ <strong>Duplicate Debits:</strong> If network latency caused duplicate UPI debits for a single order.</p>
            <p>✓ <strong>Meta Algorithmic Discrepancy:</strong> If Meta permanently rejects your ad creative and you choose not to submit alternative copy/images.</p>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">3. Refund Method & Timeline</h2>
          <p class="text-slate-600 leading-relaxed text-sm mb-2">
            All approved refunds are credited back to the <strong>original UPI account / bank account</strong> through which the initial payment was completed via <strong>Razorpay</strong>.
          </p>
          <p class="text-sm text-slate-600">
            <strong>Settlement Timeline:</strong> Refunds are initiated within <strong>24 to 48 business hours</strong> upon verification. Funds generally reflect in your source UPI bank account within <strong>5 to 7 working days</strong>.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">4. How to Request a Refund</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Please email your refund request to <strong>sahilking17341734@gmail.com</strong> with your <strong>12-digit UPI UTR number</strong>, campaign title, and registered email address.
          </p>
        </div>
      </section>
    `;
  } else if (key === 'pricing') {
    bodyContent = `
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">Fixed-Price Digital Advertising Packages</h2>
          <p class="text-slate-600 leading-relaxed text-sm">
            Transparent pricing in Indian Rupees (INR) with unified Facebook and Instagram delivery. No recurring credit card subscriptions.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-lg">Starter Sprint</span>
              <span class="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">5 Days</span>
            </div>
            <div class="text-3xl font-black text-slate-900">₹200 <span class="text-xs text-slate-500 font-normal">/ 5 days</span></div>
            <ul class="text-xs text-slate-600 space-y-1.5">
              <li>✓ Facebook + Instagram ad placement</li>
              <li>✓ Audience geo-targeting setup</li>
              <li>✓ Automated pause on day 5</li>
            </ul>
          </div>

          <div class="p-5 rounded-2xl border-2 border-purple-500 bg-purple-50 space-y-3 relative">
            <span class="absolute -top-3 right-4 bg-purple-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">Most Popular</span>
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-lg">Growth Accelerate</span>
              <span class="text-xs px-2.5 py-1 rounded-full bg-purple-200 text-purple-800 font-semibold">10 Days</span>
            </div>
            <div class="text-3xl font-black text-slate-900">₹399 <span class="text-xs text-slate-500 font-normal">/ 10 days</span></div>
            <ul class="text-xs text-slate-600 space-y-1.5">
              <li>✓ Dual Facebook & Instagram delivery</li>
              <li>✓ 10 Days extended learning optimization</li>
              <li>✓ Automated pause on day 10</li>
            </ul>
          </div>

          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-lg">Business Pro</span>
              <span class="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">14 Days</span>
            </div>
            <div class="text-3xl font-black text-slate-900">₹549 <span class="text-xs text-slate-500 font-normal">/ 14 days</span></div>
            <ul class="text-xs text-slate-600 space-y-1.5">
              <li>✓ 2 Full weeks of sustained brand reach</li>
              <li>✓ Targeting across 28 Indian states</li>
              <li>✓ Automated pause on day 14</li>
            </ul>
          </div>

          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-lg">Enterprise Scale</span>
              <span class="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">30 Days</span>
            </div>
            <div class="text-3xl font-black text-slate-900">₹749 <span class="text-xs text-slate-500 font-normal">/ 30 days</span></div>
            <ul class="text-xs text-slate-600 space-y-1.5">
              <li>✓ Full 30-day monthly campaign cycle</li>
              <li>✓ Maximum algorithmic audience learning</li>
              <li>✓ Automated pause on day 30</li>
            </ul>
          </div>
        </div>

        <div class="p-4 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600">
          <strong>Digital Delivery & Payment Information:</strong> Payment is accepted strictly via mobile UPI (Google Pay, PhonePe, Paytm, BHIM, CRED) processed through <strong>Razorpay</strong>. No recurring credit card fees. Campaign delivery is digital and starts immediately upon Meta approval.
        </div>
      </section>
    `;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
  <!-- Top Navigation -->
  <header class="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <a href="/" class="flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-extrabold text-lg shadow-md shadow-purple-600/30">
          S
        </div>
        <span class="text-xl font-bold tracking-tight text-slate-900">SMAP</span>
      </a>

      <nav class="flex items-center gap-6 text-xs font-semibold text-slate-600">
        <a href="/" class="hover:text-purple-600">Home</a>
        <a href="/about" class="hover:text-purple-600 ${key === 'about' ? 'text-purple-600 font-bold' : ''}">About SMAP</a>
        <a href="/pricing" class="hover:text-purple-600 ${key === 'pricing' ? 'text-purple-600 font-bold' : ''}">Pricing</a>
        <a href="/contact" class="hover:text-purple-600 ${key === 'contact' ? 'text-purple-600 font-bold' : ''}">Contact Us</a>
        <a href="/" class="rounded-xl bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 shadow-sm">Open App</a>
      </nav>
    </div>
  </header>

  <!-- Main Body Content -->
  <main class="flex-1 py-12 sm:py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <a href="/" class="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-500">
          ← Back to SMAP Home
        </a>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div class="border-b border-slate-200 pb-5">
          <span class="text-xs font-bold uppercase tracking-wider text-purple-600">SMAP Compliance Documentation</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">${meta.heading}</h1>
          <p class="text-xs text-slate-500 mt-1">${meta.subtitle}</p>
        </div>

        ${bodyContent}
      </div>
    </div>
  </main>

  <!-- Universal Compliance Footer -->
  <footer class="border-t border-slate-200 bg-white py-12 text-slate-500">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-sm">S</div>
            <span class="font-bold text-slate-900 text-base">SMAP</span>
          </div>
          <p class="font-semibold text-purple-600">Sahil Marketing Ads Powerful</p>
          <p class="text-slate-500 mt-1 leading-relaxed">
            Professional Facebook & Instagram advertising campaign management for Indian businesses. Powered by official Meta APIs and UPI payments through Razorpay.
          </p>
        </div>

        <div>
          <h4 class="font-bold uppercase text-slate-900 mb-3">Company</h4>
          <ul class="space-y-2">
            <li><a href="/" class="hover:text-purple-600">Home</a></li>
            <li><a href="/about" class="hover:text-purple-600">About Us</a></li>
            <li><a href="/pricing" class="hover:text-purple-600">Pricing & Packages</a></li>
            <li><a href="/contact" class="hover:text-purple-600">Contact Support</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold uppercase text-slate-900 mb-3">Policies & Legal</h4>
          <ul class="space-y-2">
            <li><a href="/terms" class="hover:text-purple-600">Terms & Conditions</a></li>
            <li><a href="/privacy" class="hover:text-purple-600">Privacy Policy</a></li>
            <li><a href="/refund" class="hover:text-purple-600">Refund & Cancellation</a></li>
            <li><a href="/contact" class="hover:text-purple-600">Grievance Officer</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold uppercase text-slate-900 mb-3">Contact Support</h4>
          <p class="text-slate-600">Email: <a href="mailto:sahilking17341734@gmail.com" class="text-purple-600 hover:underline">sahilking17341734@gmail.com</a></p>
          <p class="text-slate-600 mt-1">Phone: +91 98765 43210</p>
          <p class="text-slate-600 mt-1">Operational Address: New Delhi, India</p>
          <p class="text-slate-400 mt-1">Payment Partner: Razorpay (UPI)</p>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-slate-200 text-center text-slate-400 text-[11px]">
        © ${new Date().getFullYear()} SMAP (Sahil Marketing Ads Powerful). All rights reserved. Registered merchant with Razorpay.
      </div>
    </div>
  </footer>
</body>
</html>`;
}
