import { db, SupportTicket } from './db.js';

export class SupportService {
  public static createTicket(params: {
    userId: string;
    subject: string;
    message: string;
    campaignId?: string | null;
    attachmentUrl?: string | null;
  }): SupportTicket {
    const user = db.findUserById(params.userId);
    if (!user) throw new Error('User not found');

    if (!params.subject || !params.message) {
      throw new Error('Subject and message are required');
    }

    const now = new Date().toISOString();
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const ticket: SupportTicket = {
      id: ticketId,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      campaign_id: params.campaignId || null,
      subject: params.subject.trim(),
      message: params.message.trim(),
      attachment_url: params.attachmentUrl || null,
      status: 'OPEN',
      created_at: now,
      updated_at: now,
      replies: [],
    };

    db.createTicket(ticket);
    db.log('ADMIN', 'INFO', `New support ticket opened: ${ticket.subject} by ${user.email}`, { ticketId });

    return ticket;
  }

  public static addReply(ticketId: string, senderId: string, role: 'user' | 'admin', message: string) {
    const ticket = db.findTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const sender = db.findUserById(senderId);
    if (!sender) throw new Error('Sender not found');

    if (role === 'user' && ticket.user_id !== senderId) {
      throw new Error('Unauthorized');
    }

    const reply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: role,
      sender_name: sender.name,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = db.addTicketReply(ticketId, reply);
    if (role === 'admin' && ticket.status === 'OPEN') {
      return db.updateTicket(ticketId, { status: 'IN_PROGRESS' }) || updated;
    }

    return updated;
  }

  public static updateStatus(ticketId: string, status: SupportTicket['status']) {
    const ticket = db.findTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    return db.updateTicket(ticketId, { status });
  }
}
