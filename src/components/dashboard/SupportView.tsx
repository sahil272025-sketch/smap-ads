import React, { useState, useEffect } from 'react';
import { SupportTicket, Campaign } from '../../types';
import { api } from '../../lib/api';
import { Headphones, Plus, MessageSquare, Send, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ticket State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Ticket View
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const loadTickets = () => {
    setLoading(true);
    Promise.all([api.getSupportTickets(), api.getCampaigns()])
      .then(([tRes, cRes]) => {
        setTickets(tRes.tickets || []);
        setCampaigns(cRes.campaigns || []);
      })
      .catch((err) => console.error('Failed to load tickets', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await api.createSupportTicket({
        subject,
        message,
        campaignId: campaignId || null,
      });
      setTickets([res.ticket, ...tickets]);
      setShowCreateModal(false);
      setSubject('');
      setMessage('');
      setCampaignId('');
      setFeedbackMsg({ type: 'success', text: 'Support ticket opened successfully. Our team will review it shortly.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create support ticket' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const res = await api.replySupportTicket(selectedTicket.id, replyText);
      setSelectedTicket(res.ticket);
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to add reply' });
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return <span className="rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Open</span>;
      case 'IN_PROGRESS':
        return <span className="rounded-full border border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">In Progress</span>;
      case 'RESOLVED':
        return <span className="rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Resolved</span>;
      case 'CLOSED':
        return <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Support Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Open a support ticket for campaign queries, Meta policy guidance, or payment verification.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Open New Ticket</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tickets List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Headphones className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active support tickets</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Need assistance with your campaigns or UPI verification? Open a ticket to reach our operations team.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Support Ticket</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 pl-4">Ticket ID & Subject</th>
                  <th className="py-3.5">Related Campaign</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Replies</th>
                  <th className="py-3.5">Date Opened</th>
                  <th className="py-3.5 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 pl-4">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {t.subject}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {t.id}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {t.campaign_id || 'General inquiry'}
                    </td>

                    <td className="py-3.5">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {t.replies?.length || 0} messages
                    </td>

                    <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 text-right pr-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Open Support Ticket</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Describe your inquiry with your campaign or UPI payment.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. UPI payment verification inquiry for campaign"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Related Campaign (Optional)
                </label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">None / General Inquiry</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name} ({c.id.slice(-8)}) - {c.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide specific details..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <span className="font-mono text-[11px] text-slate-400 mt-1 block">
                  Ticket #{selectedTicket.id} · Created {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="my-4 flex-1 overflow-y-auto space-y-3 pr-2 max-h-[45vh]">
              {/* Original User Message */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4 text-xs">
                <div className="flex justify-between font-semibold text-purple-600 dark:text-purple-400 mb-1">
                  <span>{selectedTicket.user_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(selectedTicket.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((rep) => (
                <div
                  key={rep.id}
                  className={`rounded-xl border p-4 text-xs ${
                    rep.sender === 'admin'
                      ? 'border-purple-500/30 bg-purple-50 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 ml-4'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between font-semibold mb-1">
                    <span className={rep.sender === 'admin' ? 'text-purple-600 dark:text-purple-300' : 'text-slate-600 dark:text-slate-300'}>
                      {rep.sender === 'admin' ? '🛡️ SMAP Support Team' : rep.sender_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rep.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{rep.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleAddReply} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a response to support..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isReplying}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
