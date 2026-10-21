import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'hi';

export interface Translations {
  common: {
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    continue: string;
    confirm: string;
    loading: string;
    success: string;
    error: string;
    view: string;
    edit: string;
    delete: string;
    search: string;
    filter: string;
    all: string;
    active: string;
    inactive: string;
    retry: string;
    refresh: string;
    copied: string;
    copy: string;
    required: string;
    optional: string;
    officialMeta: string;
    verified: string;
  };
  nav: {
    dashboard: string;
    wallet: string;
    createAd: string;
    campaigns: string;
    adLibrary: string;
    payments: string;
    reports: string;
    profile: string;
    settings: string;
    support: string;
    admin: string;
    logout: string;
    login: string;
    signUp: string;
    hub: string;
  };
  header: {
    searchPlaceholder: string;
    wallet: string;
    addFunds: string;
    myAccount: string;
    settings: string;
    logout: string;
    notifications: string;
    noNotifications: string;
    language: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageTitle: string;
    languageSubtitle: string;
    english: string;
    englishDesc: string;
    hindi: string;
    hindiDesc: string;
    active: string;
    themeTitle: string;
    themeSubtitle: string;
    darkMode: string;
    darkModeDesc: string;
    lightMode: string;
    lightModeDesc: string;
    systemMode: string;
    systemModeDesc: string;
    activeMode: string;
    securityTitle: string;
    securitySubtitle: string;
    accountEmail: string;
    accountRole: string;
    authProvider: string;
    supportedNetworks: string;
    metaNetworks: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    availableBalance: string;
    addFunds: string;
    syncRecords: string;
    syncing: string;
    ownerPromoTitle: string;
    ownerPromoDesc: string;
    claimOwnerCredit: string;
    claiming: string;
    promoActive: string;
    promoGrantedDesc: string;
    transactionLedger: string;
    transactionLedgerDesc: string;
    filterAll: string;
    filterDeposits: string;
    filterDebits: string;
    filterRefunds: string;
    filterPromo: string;
    searchPlaceholder: string;
    noTransactions: string;
    noTransactionsDesc: string;
    amount: string;
    status: string;
    date: string;
    balanceAfter: string;
    reference: string;
    type: string;
    description: string;
    verifiedGatewayRecord: string;
    manualCredit: string;
    statusSuccess: string;
    statusPending: string;
    statusFailed: string;
  };
  addFunds: {
    title: string;
    subtitle: string;
    selectAmount: string;
    customAmount: string;
    minDepositNote: string;
    upiOptionTitle: string;
    upiOptionSubtitle: string;
    razorpayOptionTitle: string;
    razorpayOptionSubtitle: string;
    scanQrTitle: string;
    scanQrSubtitle: string;
    payWithAnyUpi: string;
    verifyPaymentBtn: string;
    verifying: string;
    successTitle: string;
    successMessage: string;
    close: string;
  };
  campaigns: {
    title: string;
    subtitle: string;
    newCampaign: string;
    searchCampaigns: string;
    tabAll: string;
    tabActive: string;
    tabReview: string;
    tabDraft: string;
    tabCompleted: string;
    tabFailed: string;
    noCampaigns: string;
    noCampaignsDesc: string;
    budget: string;
    duration: string;
    days: string;
    platforms: string;
    status: string;
    metaAdId: string;
    createdAt: string;
    viewDetails: string;
    viewOnMeta: string;
    objective: string;
    targeting: string;
  };
  createAd: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step1Desc: string;
    step2Desc: string;
    step3Desc: string;
    step4Desc: string;
    selectPackage: string;
    popularBadge: string;
    daysDuration: string;
    heading: string;
    headingHint: string;
    headingPlaceholder: string;
    description: string;
    descriptionHint: string;
    descriptionPlaceholder: string;
    safeDefaultsTitle: string;
    safeDefaultsDesc: string;
    destinationUrl: string;
    destinationUrlHint: string;
    destinationUrlPlaceholder: string;
    ctaButton: string;
    uploadCreative: string;
    uploadCreativeHint: string;
    country: string;
    state: string;
    city: string;
    ageRange: string;
    targetGender: string;
    allGenders: string;
    men: string;
    women: string;
    summaryTitle: string;
    summaryPackage: string;
    totalAmount: string;
    payWithWallet: string;
    availableBalance: string;
    insufficientBalance: string;
    addFundsBtn: string;
    launchCampaignBtn: string;
    launching: string;
    campaignCreatedSuccess: string;
    backBtn: string;
    continueBtn: string;
  };
  reports: {
    title: string;
    subtitle: string;
    totalSpend: string;
    totalImpressions: string;
    totalReach: string;
    totalClicks: string;
    avgCtr: string;
    disclosuresTitle: string;
    impressionsVsReach: string;
    latencyNotice: string;
    reviewWindow: string;
    campaignPerformance: string;
    campaignName: string;
    spend: string;
    impressions: string;
    reach: string;
    clicks: string;
    status: string;
  };
  support: {
    title: string;
    subtitle: string;
    contactSupport: string;
    emailSupport: string;
    emailAddress: string;
    whatsappSupport: string;
    whatsappHours: string;
    faqsTitle: string;
    openTicketTitle: string;
    openTicketDesc: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    sendTicketBtn: string;
    sending: string;
    ticketSentSuccess: string;
  };
  authModal: {
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    signInBtn: string;
    signUpBtn: string;
    continueWithGoogle: string;
    orWithEmail: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    termsAgreement: string;
    termsLink: string;
    privacyLink: string;
  };
  statuses: {
    DRAFT: string;
    QUEUED: string;
    PENDING_REVIEW: string;
    PAYMENT_PENDING: string;
    PAYMENT_CONFIRMED: string;
    META_NOT_CONNECTED: string;
    SUBMITTING: string;
    UNDER_REVIEW: string;
    ACTIVE: string;
    PAUSED: string;
    COMPLETED: string;
    REJECTED: string;
    FAILED: string;
  };
}

const enTranslations: Translations = {
  common: {
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved successfully',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    confirm: 'Confirm',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    retry: 'Retry',
    refresh: 'Refresh',
    copied: 'Copied to clipboard',
    copy: 'Copy',
    required: 'Required',
    optional: 'Optional',
    officialMeta: 'Official Meta Partner API',
    verified: 'Verified',
  },
  nav: {
    dashboard: 'Dashboard',
    wallet: 'Wallet & Funds',
    createAd: 'Create Ad',
    campaigns: 'Campaigns',
    adLibrary: 'Ad Library',
    payments: 'Payments',
    reports: 'Reports',
    profile: 'Account',
    settings: 'Settings',
    support: 'Help & Support',
    admin: 'Admin Panel',
    logout: 'Log Out',
    login: 'Sign In',
    signUp: 'Sign Up',
    hub: 'Campaign Hub',
  },
  header: {
    searchPlaceholder: 'Search campaigns, reports, or transactions...',
    wallet: 'Wallet',
    addFunds: 'Add Funds',
    myAccount: 'My Account',
    settings: 'Settings',
    logout: 'Log Out',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    language: 'Language',
  },
  settings: {
    title: 'Settings & Preferences',
    subtitle: 'Customize your SMAP workspace language, theme, and account preferences.',
    languageTitle: 'Language / भाषा',
    languageSubtitle: 'Select your preferred language for the SMAP interface.',
    english: 'English',
    englishDesc: 'Clean, standard English interface',
    hindi: 'हिन्दी (Hindi)',
    hindiDesc: 'सरल, प्राकृतिक और सहज हिन्दी इंटरफ़ेस',
    active: 'Active',
    themeTitle: 'Interface Theme',
    themeSubtitle: 'Select your visual preference. System mode automatically matches your device.',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Deep black aesthetic with violet accents, optimized for low-light focus.',
    lightMode: 'Light Mode',
    lightModeDesc: 'Crisp white and clean slate design with high contrast for bright daylight.',
    systemMode: 'System (Auto)',
    systemModeDesc: 'Synchronize dynamically with your computer or phone’s OS settings.',
    activeMode: 'Active mode',
    securityTitle: 'Security & Authentication',
    securitySubtitle: 'Verified credentials and enterprise-level session protection.',
    accountEmail: 'Account Email',
    accountRole: 'Account Role',
    authProvider: 'Authentication Provider',
    supportedNetworks: 'Supported Networks',
    metaNetworks: 'Official Meta Ads (Facebook & Instagram)',
  },
  wallet: {
    title: 'Wallet & Funds',
    subtitle: 'Instant campaign funding, verified payments & auditable transaction ledger.',
    availableBalance: 'Available Balance',
    addFunds: 'Add Funds',
    syncRecords: 'Sync Live Records',
    syncing: 'Syncing...',
    ownerPromoTitle: 'Exclusive Platform Owner Credit',
    ownerPromoDesc: 'Permanent ₹50,000 promotional budget for launching official Meta Ads test and demo campaigns.',
    claimOwnerCredit: 'Claim ₹50,000 Owner Credit',
    claiming: 'Claiming...',
    promoActive: '₹50,000 Promotional Credit Active',
    promoGrantedDesc: 'The permanent ₹50,000 promotional credit grant is recorded in your database ledger. This allocation is one-time and permanent across all logins and sessions.',
    transactionLedger: 'Transaction Ledger',
    transactionLedgerDesc: 'Auditable real-time record of wallet deposits, campaign expenditures, and automatic refunds.',
    filterAll: 'All Types',
    filterDeposits: 'Deposits',
    filterDebits: 'Campaign Debits',
    filterRefunds: 'Refunds',
    filterPromo: 'Promo Credits',
    searchPlaceholder: 'Search transactions by description, status, or reference...',
    noTransactions: 'No transactions found',
    noTransactionsDesc: 'Add funds to your wallet or launch an ad campaign to see activity here.',
    amount: 'Amount',
    status: 'Status',
    date: 'Date',
    balanceAfter: 'Balance After',
    reference: 'Reference',
    type: 'Type',
    description: 'Description',
    verifiedGatewayRecord: 'Verified Payment Gateway Record',
    manualCredit: 'Manual Admin Credit',
    statusSuccess: 'Success',
    statusPending: 'Pending',
    statusFailed: 'Failed',
  },
  addFunds: {
    title: 'Add Funds to Wallet',
    subtitle: 'Instant, secure deposits via UPI Intent and Razorpay Gateway.',
    selectAmount: 'Select Amount',
    customAmount: 'Or Enter Custom Amount',
    minDepositNote: 'Minimum deposit: ₹50. Funds are credited instantly to your wallet balance.',
    upiOptionTitle: 'Instant UPI Intent (QR & Apps)',
    upiOptionSubtitle: 'GPay, PhonePe, Paytm, or BHIM',
    razorpayOptionTitle: 'Razorpay Gateway',
    razorpayOptionSubtitle: 'Credit/Debit Cards, NetBanking & UPI',
    scanQrTitle: 'Scan QR Code with Any UPI App',
    scanQrSubtitle: 'Point your camera at the QR code on your phone to complete payment.',
    payWithAnyUpi: 'Pay with UPI App',
    verifyPaymentBtn: 'I Have Paid / Verify Now',
    verifying: 'Verifying Payment...',
    successTitle: 'Funds Added Successfully!',
    successMessage: 'Your wallet has been credited and is ready for campaign launch.',
    close: 'Done',
  },
  campaigns: {
    title: 'Campaigns',
    subtitle: 'Track real-time Meta delivery, spend, review statuses, and live previews.',
    newCampaign: 'Create Campaign',
    searchCampaigns: 'Search campaigns by name, objective, or ID...',
    tabAll: 'All',
    tabActive: 'Active',
    tabReview: 'In Review',
    tabDraft: 'Drafts',
    tabCompleted: 'Completed',
    tabFailed: 'Failed',
    noCampaigns: 'No campaigns found',
    noCampaignsDesc: 'Create your first automated Meta advertising campaign to start reaching thousands of customers.',
    budget: 'Budget',
    duration: 'Duration',
    days: 'Days',
    platforms: 'Platforms',
    status: 'Status',
    metaAdId: 'Meta Ad ID',
    createdAt: 'Created At',
    viewDetails: 'View Details',
    viewOnMeta: 'View on Meta',
    objective: 'Objective',
    targeting: 'Targeting',
  },
  createAd: {
    title: 'Create Meta Campaign',
    subtitle: 'Automated Facebook & Instagram Ads in 4 simple steps.',
    step1: '1. Select Package',
    step2: '2. Creative & Content',
    step3: '3. Audience & Targeting',
    step4: '4. Review & Launch',
    step1Desc: 'Choose an advertising tier that fits your budget and campaign duration.',
    step2Desc: 'Add high-impact headline, descriptive copy, and captivating visuals.',
    step3Desc: 'Specify location, age demographics, and targeted audience segments.',
    step4Desc: 'Review campaign summary and pay seamlessly with your wallet balance.',
    selectPackage: 'Select an Advertising Package',
    popularBadge: 'Most Popular',
    daysDuration: 'days active',
    heading: 'Heading',
    headingHint: 'Required • Maximum 100 characters. Keep it punchy and engaging.',
    headingPlaceholder: 'e.g., Special Festive Discount on All Orders',
    description: 'Description',
    descriptionHint: 'Required • Maximum 400 characters. Tell customers about your products or offers.',
    descriptionPlaceholder: 'e.g., Discover curated, high-quality collections with nationwide fast delivery. Shop now and enjoy verified satisfaction!',
    safeDefaultsTitle: 'Automated Meta Setup & Safe Defaults',
    safeDefaultsDesc: 'High-res lossless visual, verified merchant identity, "Learn More" action, and secured destination are pre-configured for Meta Marketing API compliance.',
    destinationUrl: 'Destination Website or Landing Page URL',
    destinationUrlHint: 'Where customers will be directed after clicking your ad.',
    destinationUrlPlaceholder: 'https://yourwebsite.com/special-offer',
    ctaButton: 'Call to Action (CTA) Button',
    uploadCreative: 'Upload Ad Creative (Image or Video)',
    uploadCreativeHint: 'JPG, PNG, or MP4 up to 50MB. High resolution recommended for maximum engagement.',
    country: 'Country',
    state: 'State / Province',
    city: 'City / Region',
    ageRange: 'Age Range',
    targetGender: 'Target Gender',
    allGenders: 'All Genders',
    men: 'Men',
    women: 'Women',
    summaryTitle: 'Campaign Summary & Payment',
    summaryPackage: 'Selected Package',
    totalAmount: 'Total Amount',
    payWithWallet: 'Pay with Wallet Balance',
    availableBalance: 'Available Wallet Balance',
    insufficientBalance: 'Insufficient Wallet Balance',
    addFundsBtn: 'Add Funds to Continue',
    launchCampaignBtn: 'Launch Campaign Now',
    launching: 'Submitting Campaign to Meta...',
    campaignCreatedSuccess: 'Campaign created successfully! Submitting to Meta Ad Network.',
    backBtn: 'Back',
    continueBtn: 'Continue',
  },
  reports: {
    title: 'Reports & Performance',
    subtitle: 'Real-time performance metrics synced directly from Meta Marketing API.',
    totalSpend: 'Total Spend',
    totalImpressions: 'Total Impressions',
    totalReach: 'Total Reach',
    totalClicks: 'Total Clicks',
    avgCtr: 'Average CTR',
    disclosuresTitle: 'Official Meta Ad Delivery Disclosures',
    impressionsVsReach: 'Impressions count total ad displays (including repeat views). Reach represents unique individual accounts reached.',
    latencyNotice: 'Meta Marketing API reporting latency typically ranges from 15 to 60 minutes for fresh events.',
    reviewWindow: 'New campaigns undergo standard Meta automated and manual review within 24 to 48 hours.',
    campaignPerformance: 'Campaign Performance Breakdown',
    campaignName: 'Campaign Name',
    spend: 'Spend',
    impressions: 'Impressions',
    reach: 'Reach',
    clicks: 'Clicks',
    status: 'Status',
  },
  support: {
    title: 'Help & Customer Support',
    subtitle: 'Need help with your campaigns, wallet, or Meta integration? We are here 24/7.',
    contactSupport: 'Contact Support Team',
    emailSupport: 'Email Support',
    emailAddress: 'sahilking17341734@gmail.com',
    whatsappSupport: 'WhatsApp Support',
    whatsappHours: 'Available 9:00 AM - 9:00 PM IST',
    faqsTitle: 'Frequently Asked Questions',
    openTicketTitle: 'Submit a Support Ticket',
    openTicketDesc: 'Describe your issue or question and our operations team will respond promptly.',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'e.g., Question about campaign review status or wallet top-up',
    messageLabel: 'Message / Issue Details',
    messagePlaceholder: 'Please provide detailed information so we can assist you quickly...',
    sendTicketBtn: 'Submit Support Ticket',
    sending: 'Submitting Ticket...',
    ticketSentSuccess: 'Support ticket submitted successfully! Our team will contact you shortly.',
  },
  authModal: {
    signInTitle: 'Sign In to SMAP',
    signInSubtitle: 'Access your ad campaigns, wallet, and performance analytics.',
    signUpTitle: 'Create Your SMAP Account',
    signUpSubtitle: 'Start launching automated Meta campaigns in minutes.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'Email Address',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    phone: 'Phone Number (Optional)',
    phonePlaceholder: '+91 9876543210',
    signInBtn: 'Sign In',
    signUpBtn: 'Create Account',
    continueWithGoogle: 'Continue with Google',
    orWithEmail: 'Or continue with email',
    alreadyHaveAccount: 'Already have an account? Sign In',
    dontHaveAccount: "Don't have an account? Create one",
    termsAgreement: 'By signing in, you agree to our',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
  },
  statuses: {
    DRAFT: 'Draft',
    QUEUED: 'Queued',
    PENDING_REVIEW: 'Pending Review',
    PAYMENT_PENDING: 'Payment Pending',
    PAYMENT_CONFIRMED: 'Payment Confirmed',
    META_NOT_CONNECTED: 'Meta Setup Needed',
    SUBMITTING: 'Submitting to Meta',
    UNDER_REVIEW: 'Under Meta Review',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected by Meta',
    FAILED: 'Failed',
  },
};

const hiTranslations: Translations = {
  common: {
    save: 'सहेजें',
    saving: 'सहेजा जा रहा है...',
    saved: 'सफलतापूर्वक सहेजा गया',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    back: 'पीछे',
    next: 'आगे',
    continue: 'जारी रखें',
    confirm: 'पुष्टि करें',
    loading: 'लोड हो रहा है...',
    success: 'सफल',
    error: 'त्रुटि',
    view: 'देखें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    all: 'सभी',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    retry: 'पुनः प्रयास करें',
    refresh: 'रिफ्रेश करें',
    copied: 'कॉपी किया गया',
    copy: 'कॉपी करें',
    required: 'आवश्यक',
    optional: 'वैकल्पिक',
    officialMeta: 'आधिकारिक मेटा पार्टनर API',
    verified: 'सत्यापित',
  },
  nav: {
    dashboard: 'डैशबोर्ड',
    wallet: 'वॉलेट और फंड',
    createAd: 'विज्ञापन बनाएं',
    campaigns: 'अभियान',
    adLibrary: 'विज्ञापन लाइब्रेरी',
    payments: 'भुगतान',
    reports: 'रिपोर्ट्स',
    profile: 'खाता प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    support: 'सहायता और समर्थन',
    admin: 'व्यवस्थापक पैनल',
    logout: 'लॉग आउट',
    login: 'साइन इन करें',
    signUp: 'खाता बनाएं',
    hub: 'अभियान केंद्र',
  },
  header: {
    searchPlaceholder: 'अभियान, रिपोर्ट या लेनदेन खोजें...',
    wallet: 'वॉलेट',
    addFunds: 'फंड जोड़ें',
    myAccount: 'मेरा खाता',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    notifications: 'सूचनाएं',
    noNotifications: 'कोई नई सूचना नहीं है',
    language: 'भाषा',
  },
  settings: {
    title: 'सेटिंग्स और प्राथमिकताएं',
    subtitle: 'अपनी SMAP भाषा, थीम और खाता प्राथमिकताओं को अनुकूलित करें।',
    languageTitle: 'Language / भाषा',
    languageSubtitle: 'SMAP इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें।',
    english: 'English (अंग्रेज़ी)',
    englishDesc: 'डिफ़ॉल्ट साफ़ अंग्रेज़ी इंटरफ़ेस',
    hindi: 'हिन्दी (Hindi)',
    hindiDesc: 'सरल, प्राकृतिक और सहज हिन्दी इंटरफ़ेस',
    active: 'सक्रिय',
    themeTitle: 'इंटरफ़ेस थीम',
    themeSubtitle: 'अपनी दृश्य प्राथमिकता चुनें। सिस्टम मोड आपके डिवाइस के अनुसार ढल जाता है।',
    darkMode: 'डार्क मोड',
    darkModeDesc: 'गहरा काला रंग, कम रोशनी में आंखों के लिए आरामदायक और सुरुचिपूर्ण।',
    lightMode: 'लाइट मोड',
    lightModeDesc: 'उज्ज्वल और स्पष्ट डिज़ाइन, दिन के उजाले में उपयोग के लिए उत्तम।',
    systemMode: 'सिस्टम (ऑटो)',
    systemModeDesc: 'आपके फोन या कंप्यूटर की सेटिंग्स के साथ स्वचालित रूप से सिंक करें।',
    activeMode: 'सक्रिय मोड',
    securityTitle: 'सुरक्षा और प्रमाणीकरण',
    securitySubtitle: 'सत्यापित साख और सुरक्षित सत्र सुरक्षा।',
    accountEmail: 'खाता ईमेल',
    accountRole: 'खाता भूमिका',
    authProvider: 'प्रमाणीकरण प्रदाता',
    supportedNetworks: 'समर्थित नेटवर्क',
    metaNetworks: 'आधिकारिक मेटा विज्ञापन (फेसबुक और इंस्टाग्राम)',
  },
  wallet: {
    title: 'वॉलेट और फंड',
    subtitle: 'त्वरित अभियान फंडिंग, सत्यापित भुगतान और पारदर्शी लेनदेन खाता।',
    availableBalance: 'उपलब्ध शेष राशि',
    addFunds: 'फंड जोड़ें',
    syncRecords: 'लाइव रिकॉर्ड सिंक करें',
    syncing: 'सिंक हो रहा है...',
    ownerPromoTitle: 'विशेष प्लेटफ़ॉर्म स्वामी क्रेडिट',
    ownerPromoDesc: 'आधिकारिक मेटा विज्ञापनों और डेमो अभियानों के लिए स्थायी ₹50,000 प्रमोशनल बजट।',
    claimOwnerCredit: '₹50,000 स्वामी क्रेडिट प्राप्त करें',
    claiming: 'क्रेडिट प्राप्त हो रहा है...',
    promoActive: '₹50,000 प्रमोशनल क्रेडिट सक्रिय है',
    promoGrantedDesc: 'स्थायी ₹50,000 प्रमोशनल क्रेडिट आपके डेटाबेस लेज़र में सुरक्षित रूप से दर्ज है। यह आवंटन एक बार और सभी सत्रों में स्थायी है।',
    transactionLedger: 'लेनदेन खाता (Transaction Ledger)',
    transactionLedgerDesc: 'वॉलेट जमा, अभियान खर्च और स्वचालित रिफंड का ऑडिट योग्य वास्तविक समय रिकॉर्ड।',
    filterAll: 'सभी लेनदेन',
    filterDeposits: 'जमा (Deposits)',
    filterDebits: 'अभियान खर्च',
    filterRefunds: 'रिफंड (Refunds)',
    filterPromo: 'प्रमोशनल क्रेडिट',
    searchPlaceholder: 'विवरण, स्थिति या संदर्भ ID से लेनदेन खोजें...',
    noTransactions: 'कोई लेनदेन नहीं मिला',
    noTransactionsDesc: 'गतिविधि देखने के लिए अपने वॉलेट में फंड जोड़ें या एक विज्ञापन अभियान शुरू करें।',
    amount: 'राशि',
    status: 'स्थिति',
    date: 'तारीख',
    balanceAfter: 'बाद का शेष',
    reference: 'संदर्भ ID',
    type: 'प्रकार',
    description: 'विवरण',
    verifiedGatewayRecord: 'सत्यापित पेमेंट गेटवे रिकॉर्ड',
    manualCredit: 'मैन्युअल एडमिन क्रेडिट',
    statusSuccess: 'सफल',
    statusPending: 'लंबित',
    statusFailed: 'विफल',
  },
  addFunds: {
    title: 'वॉलेट में फंड जोड़ें',
    subtitle: 'UPI इंटेंट और रेज़रपे के माध्यम से सुरक्षित और त्वरित जमा।',
    selectAmount: 'राशि चुनें',
    customAmount: 'या कस्टम राशि दर्ज करें',
    minDepositNote: 'न्यूनतम जमा: ₹50। राशि तुरंत आपके वॉलेट शेष में जोड़ दी जाती है।',
    upiOptionTitle: 'त्वरित UPI इंटेंट (QR और ऐप्स)',
    upiOptionSubtitle: 'GPay, PhonePe, Paytm या BHIM',
    razorpayOptionTitle: 'रेज़रपे पेमेंट गेटवे',
    razorpayOptionSubtitle: 'क्रेडिट/डेबिट कार्ड, नेटबैंकिंग और UPI',
    scanQrTitle: 'किसी भी UPI ऐप से QR कोड स्कैन करें',
    scanQrSubtitle: 'भुगतान पूरा करने के लिए अपने फोन के कैमरे को QR कोड की ओर इंगित करें।',
    payWithAnyUpi: 'UPI ऐप से भुगतान करें',
    verifyPaymentBtn: 'मैंने भुगतान कर दिया है / सत्यापित करें',
    verifying: 'भुगतान सत्यापित हो रहा है...',
    successTitle: 'फंड सफलतापूर्वक जोड़े गए!',
    successMessage: 'आपके वॉलेट में राशि जुड़ चुकी है और अभियान लॉन्च के लिए तैयार है।',
    close: 'पूर्ण',
  },
  campaigns: {
    title: 'अभियान',
    subtitle: 'रियल-टाइम मेटा डिलीवरी, खर्च, समीक्षा स्थिति और लाइव पूर्वावलोकन ट्रैक करें।',
    newCampaign: 'नया अभियान बनाएं',
    searchCampaigns: 'नाम, उद्देश्य या ID से अभियान खोजें...',
    tabAll: 'सभी',
    tabActive: 'सक्रिय',
    tabReview: 'समीक्षाधीन',
    tabDraft: 'ड्राफ़्ट',
    tabCompleted: 'पूर्ण',
    tabFailed: 'विफल',
    noCampaigns: 'कोई अभियान नहीं मिला',
    noCampaignsDesc: 'हजारों संभावित ग्राहकों तक पहुंचने के लिए अपना पहला स्वचालित मेटा विज्ञापन अभियान बनाएं।',
    budget: 'बजट',
    duration: 'अवधि',
    days: 'दिन',
    platforms: 'प्लेटफ़ॉर्म',
    status: 'स्थिति',
    metaAdId: 'मेटा विज्ञापन ID',
    createdAt: 'बनाने की तारीख',
    viewDetails: 'विवरण देखें',
    viewOnMeta: 'मेटा पर देखें',
    objective: 'उद्देश्य',
    targeting: 'लक्ष्यीकरण',
  },
  createAd: {
    title: 'मेटा विज्ञापन बनाएं',
    subtitle: '4 आसान चरणों में स्वचालित फेसबुक और इंस्टाग्राम विज्ञापन।',
    step1: '1. पैकेज चुनें',
    step2: '2. विज्ञापन सामग्री',
    step3: '3. दर्शक और लक्ष्यीकरण',
    step4: '4. समीक्षा और लॉन्च',
    step1Desc: 'अपने बजट और अभियान अवधि के अनुसार सही विज्ञापन पैकेज चुनें।',
    step2Desc: 'प्रभावशाली शीर्षक, आकर्षक विवरण और उत्कृष्ट फ़ोटो/वीडियो जोड़ें।',
    step3Desc: 'स्थान, आयु समूह और लक्षित दर्शकों का चयन करें।',
    step4Desc: 'अभियान सारांश की समीक्षा करें और अपने वॉलेट शेष से भुगतान करें।',
    selectPackage: 'विज्ञापन पैकेज चुनें',
    popularBadge: 'सबसे लोकप्रिय',
    daysDuration: 'दिन सक्रिय',
    heading: 'शीर्षक (Heading)',
    headingHint: 'आवश्यक • अधिकतम 100 वर्ण। इसे प्रभावशाली और आकर्षक बनाएं।',
    headingPlaceholder: 'उदा. सभी ऑर्डर पर विशेष त्यौहारी छूट',
    description: 'विवरण (Description)',
    descriptionHint: 'आवश्यक • अधिकतम 400 वर्ण। अपने उत्पादों, छूट और ऑफ़र के बारे में बताएं।',
    descriptionPlaceholder: 'उदा. हमारे खास संग्रह और देशव्यापी त्वरित डिलीवरी का लाभ उठाएं। अभी खरीदें और सत्यापित संतुष्टि पाएं!',
    safeDefaultsTitle: 'स्वचालित मेटा सेटअप और सुरक्षित डिफ़ॉल्ट्स',
    safeDefaultsDesc: 'उच्च-रिज़ॉल्यूशन विज़ुअल, सत्यापित मर्चेंट पहचान, "Learn More" बटन, और सुरक्षित गंतव्य लिंक मेटा मार्केटिंग API के लिए स्वचालित रूप से सेट हैं।',
    destinationUrl: 'वेबसाइट या लैंडिंग पृष्ठ लिंक (URL)',
    destinationUrlHint: 'विज्ञापन पर क्लिक करने के बाद ग्राहक इस लिंक पर पहुंचेंगे।',
    destinationUrlPlaceholder: 'https://yourwebsite.com/special-offer',
    ctaButton: 'कॉल टू एक्शन (बटन)',
    uploadCreative: 'विज्ञापन फ़ोटो या वीडियो अपलोड करें',
    uploadCreativeHint: 'JPG, PNG, या MP4 अधिकतम 50MB तक। अधिकतम प्रभाव के लिए उच्च-गुणवत्ता की सिफारिश की जाती है।',
    country: 'देश',
    state: 'राज्य',
    city: 'शहर / क्षेत्र',
    ageRange: 'आयु सीमा',
    targetGender: 'लक्षित लिंग',
    allGenders: 'सभी लिंग',
    men: 'पुरुष',
    women: 'महिलाएं',
    summaryTitle: 'अभियान सारांश और भुगतान',
    summaryPackage: 'चुना गया पैकेज',
    totalAmount: 'कुल राशि',
    payWithWallet: 'वॉलेट शेष से भुगतान करें',
    availableBalance: 'उपलब्ध वॉलेट शेष',
    insufficientBalance: 'वॉलेट में अपर्याप्त शेष राशि',
    addFundsBtn: 'जारी रखने के लिए फंड जोड़ें',
    launchCampaignBtn: 'अभियान अभी लॉन्च करें',
    launching: 'मेटा को अभियान सबमिट हो रहा है...',
    campaignCreatedSuccess: 'अभियान सफलतापूर्वक बनाया गया! मेटा नेटवर्क को भेजा जा रहा है।',
    backBtn: 'पीछे',
    continueBtn: 'आगे बढ़ें',
  },
  reports: {
    title: 'रिपोर्ट्स और प्रदर्शन',
    subtitle: 'मेटा मार्केटिंग API से सीधे सिंक किए गए रीयल-टाइम प्रदर्शन मेट्रिक्स।',
    totalSpend: 'कुल खर्च',
    totalImpressions: 'कुल इंप्रेशन (Impressions)',
    totalReach: 'कुल पहुंच (Reach)',
    totalClicks: 'कुल क्लिक (Clicks)',
    avgCtr: 'औसत CTR',
    disclosuresTitle: 'आधिकारिक मेटा विज्ञापन प्रकटीकरण',
    impressionsVsReach: 'इंप्रेशन कुल विज्ञापन दृश्य दिखाते हैं (दोहराए गए दृश्य सहित)। पहुंच (Reach) उन अद्वितीय व्यक्तियों की संख्या है जिन्होंने विज्ञापन देखा।',
    latencyNotice: 'मेटा मार्केटिंग API में नए आंकड़ों के लिए 15 से 60 मिनट की रिपोर्टिंग देरी हो सकती है।',
    reviewWindow: 'नए अभियानों की मानक मेटा समीक्षा 24 से 48 घंटों में पूरी होती है।',
    campaignPerformance: 'अभियान प्रदर्शन विवरण',
    campaignName: 'अभियान का नाम',
    spend: 'खर्च',
    impressions: 'इंप्रेशन',
    reach: 'पहुंच',
    clicks: 'क्लिक',
    status: 'स्थिति',
  },
  support: {
    title: 'सहायता और ग्राहक सेवा',
    subtitle: 'क्या आपको अभियानों, वॉलेट या मेटा सेटअप में सहायता चाहिए? हम 24/7 उपलब्ध हैं।',
    contactSupport: 'सहायता टीम से संपर्क करें',
    emailSupport: 'ईमेल सहायता',
    emailAddress: 'sahilking17341734@gmail.com',
    whatsappSupport: 'व्हाट्सएप सहायता',
    whatsappHours: 'उपलब्ध: सुबह 9:00 से रात 9:00 बजे IST',
    faqsTitle: 'अक्सर पूछे जाने वाले प्रश्न',
    openTicketTitle: 'समस्या टिकट दर्ज करें',
    openTicketDesc: 'अपनी समस्या या प्रश्न लिखें, हमारी ऑपरेशंस टीम शीघ्र समाधान करेगी।',
    subjectLabel: 'विषय',
    subjectPlaceholder: 'उदा. अभियान समीक्षा स्थिति या वॉलेट टॉप-अप के संबंध में',
    messageLabel: 'समस्या का पूरा विवरण',
    messagePlaceholder: 'कृपया पूरी जानकारी दें ताकि हम आपकी तुरंत सहायता कर सकें...',
    sendTicketBtn: 'टिकट सबमिट करें',
    sending: 'टिकट भेजा जा रहा है...',
    ticketSentSuccess: 'सहायता टिकट सफलतापूर्वक दर्ज किया गया! हमारी टीम शीघ्र आपसे संपर्क करेगी।',
  },
  authModal: {
    signInTitle: 'SMAP में साइन इन करें',
    signInSubtitle: 'अपने विज्ञापन अभियानों, वॉलेट और प्रदर्शन एनालिटिक्स तक पहुंचें।',
    signUpTitle: 'अपना SMAP खाता बनाएं',
    signUpSubtitle: 'मिनटों में स्वचालित मेटा अभियान शुरू करें।',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
    email: 'ईमेल पता',
    emailPlaceholder: 'you@example.com',
    password: 'पासवर्ड',
    passwordPlaceholder: 'कम से कम 6 अक्षर',
    phone: 'फ़ोन नंबर (वैकल्पिक)',
    phonePlaceholder: '+91 9876543210',
    signInBtn: 'साइन इन करें',
    signUpBtn: 'खाता बनाएं',
    continueWithGoogle: 'Google के साथ जारी रखें',
    orWithEmail: 'या ईमेल से जारी रखें',
    alreadyHaveAccount: 'पहले से खाता है? साइन इन करें',
    dontHaveAccount: 'खाता नहीं है? नया खाता बनाएं',
    termsAgreement: 'साइन इन करके, आप हमारी सहमतियों को स्वीकार करते हैं',
    termsLink: 'सेवा की शर्तें',
    privacyLink: 'गोपनीयता नीति',
  },
  statuses: {
    DRAFT: 'ड्राफ़्ट',
    QUEUED: 'कतार में',
    PENDING_REVIEW: 'समीक्षा लंबित',
    PAYMENT_PENDING: 'भुगतान लंबित',
    PAYMENT_CONFIRMED: 'भुगतान स्वीकृत',
    META_NOT_CONNECTED: 'मेटा सेटअप आवश्यक',
    SUBMITTING: 'मेटा को भेजा जा रहा है',
    UNDER_REVIEW: 'मेटा समीक्षाधीन',
    ACTIVE: 'सक्रिय',
    PAUSED: 'रोक दिया गया',
    COMPLETED: 'पूर्ण',
    REJECTED: 'अस्वीकृत',
    FAILED: 'विफल',
  },
};

const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  hi: hiTranslations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isHindi: boolean;
  t: Translations;
  formatStatus: (status: string) => string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'smap_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored === 'hi' || stored === 'en') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  // When user signs in or user data loads, sync with user profile language if present
  useEffect(() => {
    if (user?.language && (user.language === 'en' || user.language === 'hi')) {
      if (user.language !== language) {
        setLanguageState(user.language);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, user.language);
        } catch {
          // ignore
        }
      }
    }
  }, [user?.language]);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }

    // If authenticated, persist to user's database profile permanently
    if (user) {
      try {
        await api.updateProfile({ language: newLang });
      } catch (err) {
        console.error('Failed to persist language preference to database', err);
      }
    }
  };

  const isHindi = language === 'hi';
  const t = translationsMap[language];

  const formatStatus = (status: string): string => {
    if (!status) return '';
    const upper = status.toUpperCase() as keyof typeof t.statuses;
    if (t.statuses[upper]) {
      return t.statuses[upper];
    }
    return status.replace(/_/g, ' ');
  };

  const formatCurrency = (amount: number): string => {
    const num = Number(amount) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isHindi,
        t,
        formatStatus,
        formatCurrency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
