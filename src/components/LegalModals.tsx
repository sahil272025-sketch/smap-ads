import React from 'react';
import { X, Shield } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'refund' | 'advertising' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0E1424] p-6 sm:p-8 text-slate-300 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white capitalize">
              {type === 'terms' && 'Terms & Conditions'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'refund' && 'Refund Policy'}
              {type === 'advertising' && 'Advertising Policy & Meta Compliance'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
          {type === 'terms' && (
            <>
              <p>
                <strong>1. Acceptance of Terms:</strong> By accessing and using SMAP (Sahil Marketing Ads Powerful), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.
              </p>
              <p>
                <strong>2. Platform Scope:</strong> SMAP provides campaign creation, audience targeting parameter compilation, and advertising lifecycle management for Facebook and Instagram using official Meta Graph APIs. SMAP is an independent SaaS platform and does not guarantee reach, clicks, conversions, or sales.
              </p>
              <p>
                <strong>3. User Obligations:</strong> Customers are solely responsible for ensuring that their advertising copy, creatives (images/videos), headlines, and target landing pages comply with applicable laws and Meta Advertising Standards.
              </p>
              <p>
                <strong>4. Account Security:</strong> You are responsible for safeguarding your SMAP account credentials and any authorized Meta OAuth tokens.
              </p>
              <p>
                <strong>5. Duration and Expiry:</strong> Campaigns run for the exact duration of the purchased package (5, 10, 14, or 30 days). Upon expiry, the campaign is automatically paused on Meta by our server scheduler.
              </p>
            </>
          )}

          {type === 'privacy' && (
            <>
              <p>
                <strong>1. Information Collection:</strong> We collect necessary account details including your Name, Email Address, Phone Number, and hashed credentials.
              </p>
              <p>
                <strong>2. Meta Authorization:</strong> When you connect your Facebook or Instagram advertising account via OAuth, we only store authorized OAuth tokens and ad account IDs necessary to submit campaigns. We never ask for or store your Facebook or Instagram passwords.
              </p>
              <p>
                <strong>3. Payment Information:</strong> All payments are processed strictly via mobile UPI. We do not store credit card or debit card numbers. UPI transaction reference numbers (UTR) and payment status logs are retained solely for transaction verification and auditing.
              </p>
              <p>
                <strong>4. Data Security:</strong> Data is encrypted in transit and sensitive operations require authenticated sessions.
              </p>
            </>
          )}

          {type === 'refund' && (
            <>
              <p>
                <strong>1. Campaign Activation & Submission:</strong> Because advertising campaign packages involve computational resource provisioning and immediate ad submission to Meta's auction servers, once a campaign has been approved or submitted to Meta, fees are non-refundable.
              </p>
              <p>
                <strong>2. Unsubmitted / Verification Discrepancies:</strong> If a payment was verified but the campaign could not be submitted due to a technical error on our platform that cannot be resolved within 48 hours, a refund may be initiated upon request to support@smap.in.
              </p>
              <p>
                <strong>3. Meta Policy Rejection:</strong> If Meta's automated review system rejects an ad creative or copy due to the customer violating Meta policies, the customer may revise the creative and resubmit within the campaign window without an additional package fee.
              </p>
            </>
          )}

          {type === 'advertising' && (
            <>
              <p>
                <strong>1. Meta Auction Disclaimer:</strong> SMAP provides advertising campaign management and does not guarantee impressions, reach, clicks, leads or sales. Campaign performance depends on Meta's advertising auction, audience targeting, creative quality, competition and other factors.
              </p>
              <p>
                <strong>2. Prohibited Content:</strong> Creatives must not contain deceptive claims, counterfeit products, unsafe substances, adult content, or intellectual property infringements.
              </p>
              <p>
                <strong>3. Review Process:</strong> All submitted ads undergo Meta review before delivery. Ad approval time is subject to Meta's automated algorithms.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
