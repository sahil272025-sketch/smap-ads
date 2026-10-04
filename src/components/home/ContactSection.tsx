import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const ContactSection: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user ? user.email : '');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setIsSubmitting(true);
    try {
      if (user) {
        await api.createSupportTicket({ subject, message });
      }
      setSubmitted(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Contact error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 border-t border-slate-800/80 bg-[#090D18]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Info column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
                Get in Touch
              </p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Support & Inquiries
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Have questions regarding package selection, UPI payment verification, or Meta compliance? Reach out to our dedicated support operations team.
              </p>
            </div>

            <div className="space-y-4 pt-4 text-xs text-slate-300">
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Direct Support Email</span>
                  <span className="font-semibold text-white">support@smap.in</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                <Phone className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Merchant Operations Phone</span>
                  <span className="font-semibold text-white">+91 98765 43210 (Mon-Sat, 9AM-8PM IST)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Business Presence</span>
                  <span className="font-semibold text-white">SMAP (Sahil Marketing Ads Powerful), India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact / Ticket Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Message Received</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Thank you for reaching out. Our support operations team will review your inquiry and follow up via email.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-base font-bold text-white mb-2">Send a Message</h3>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="business@example.com"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Question about 10-day Instagram campaign"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your inquiry, campaign requirements, or questions..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
