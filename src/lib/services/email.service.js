import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Email from '../models/email.model.js';

function getLiveEnv(key, defaultVal = '') {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k && k.trim() === key && v.length) {
          const val = v.join('=').trim();
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (err) {}
  return defaultVal;
}

function writeLog(event, data = {}) {
  try {
    const logPath = path.resolve(process.cwd(), 'logs.txt');
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${event}] ${typeof data === 'string' ? data : JSON.stringify(data)}\n`;
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch (err) {
    console.warn('[EmailService::WriteLogFailed]', err.message);
  }
}

class EmailService {
  constructor() {
    this.resendApiUrl = 'https://api.resend.com/emails';
  }

  getApiKey() {
    return getLiveEnv('RESEND_API_KEY', '');
  }

  getFromEmail() {
    return getLiveEnv(
      'RESEND_FROM_EMAIL',
      'TeachyBlogs Newsroom <onboarding@resend.dev>'
    );
  }

  getWebhookSecret() {
    return getLiveEnv('RESEND_WEBHOOK_SECRET', 'tb_resend_webhook_sec_2026');
  }

  /**
   * Generates a standard RFC 2822 Message-ID
   */
  generateMessageId() {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `<${timestamp}.${randomHex}@teachyblogs.com>`;
  }

  /**
   * Sanitizes HTML email body to prevent XSS, javascript: URLs, and malicious elements
   */
  sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';

    return html
      // Strip script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Strip style tags with potential expression injections
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Strip dangerous tags: iframe, object, embed, applet, meta, link, base, form
      .replace(/<\/?(iframe|object|embed|applet|meta|link|base|form|input|button)\b[^>]*>/gi, '')
      // Strip on* event handlers (e.g. onload, onerror, onclick, onmouseover)
      .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      // Strip javascript:, data: (except safe images), vbscript: protocols from href/src
      .replace(/(href|src)\s*=\s*['"]\s*(javascript|vbscript|data(?!:image\/(png|jpeg|gif|webp))):[^'"]*['"]/gi, '$1="#"')
      .trim();
  }

  /**
   * Normalize and clean subject line for replies (prevent Re: Re: Re:)
   */
  formatReplySubject(subject) {
    if (!subject) return 'Re: (No Subject)';
    const clean = subject.replace(/^(Re:\s*)+/i, '').trim();
    return `Re: ${clean}`;
  }

  /**
   * Core outbound email dispatcher via Resend API
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
    cc = [],
    bcc = [],
    headers = {},
    actor = null,
    labels = ['Newsroom'],
    threadId = null,
    inReplyTo = null,
    references = [],
  }) {
    const apiKey = this.getApiKey();
    const fromAddress = from || this.getFromEmail();
    const messageId = this.generateMessageId();
    const resolvedThreadId = threadId || `thread_${crypto.randomBytes(12).toString('hex')}`;

    // Normalize recipients
    const toArray = Array.isArray(to) ? to : [to];
    const normalizedTo = toArray.map((recipient) => {
      if (typeof recipient === 'string') {
        return { email: recipient.toLowerCase().trim(), name: recipient.split('@')[0] };
      }
      return {
        email: recipient.email.toLowerCase().trim(),
        name: recipient.name || recipient.email.split('@')[0],
      };
    });

    const normalizedCc = (cc || []).map((c) =>
      typeof c === 'string' ? { email: c.toLowerCase().trim(), name: '' } : c
    );
    const normalizedBcc = (bcc || []).map((b) =>
      typeof b === 'string' ? { email: b.toLowerCase().trim(), name: '' } : b
    );

    // Prepare Resend payload
    const resendHeaders = {
      'Message-ID': messageId,
      ...headers,
    };
    if (inReplyTo) resendHeaders['In-Reply-To'] = inReplyTo;
    if (references && references.length) resendHeaders['References'] = references.join(' ');

    // Format from: if onboarding@resend.dev, use clean 'onboarding@resend.dev'
    const cleanFrom = fromAddress.includes('onboarding@resend.dev')
      ? 'onboarding@resend.dev'
      : fromAddress;

    // Format to: use clean plain email addresses for full Resend sandbox & production compatibility
    const cleanTo = normalizedTo.map((t) => t.email);

    const resendPayload = {
      from: cleanFrom,
      to: cleanTo,
      subject: subject || '(No Subject)',
      html: html || `<p>${text || ''}</p>`,
      text: text || '',
      headers: resendHeaders,
    };

    if (replyTo) resendPayload.reply_to = replyTo;
    if (normalizedCc.length) resendPayload.cc = normalizedCc.map((c) => c.email);
    if (normalizedBcc.length) resendPayload.bcc = normalizedBcc.map((b) => b.email);

    let providerId = '';
    let status = 'sent';
    let errorMsg = null;

    writeLog('EMAIL_DISPATCH_ATTEMPT', {
      to: normalizedTo.map((t) => t.email),
      subject,
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : 'none',
      from: fromAddress,
    });

    // Send via Resend if live key configured; otherwise simulate
    if (!apiKey || apiKey.startsWith('re_demo') || apiKey === 'mock') {
      providerId = 'simulated_' + crypto.randomBytes(10).toString('hex');
      writeLog('EMAIL_SIMULATED', {
        to: normalizedTo.map((t) => t.email),
        subject,
        providerId,
      });
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[EmailService::OutboundSimulated] To: ${normalizedTo.map((t) => t.email).join(', ')} | Subject: ${subject}`);
      }
    } else {
      try {
        const response = await fetch(this.resendApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendPayload),
        });

        const data = await response.json();
        writeLog('RESEND_API_RESULT', {
          status: response.status,
          statusText: response.statusText,
          data,
          to: normalizedTo.map((t) => t.email),
          subject,
        });

        if (!response.ok) {
          status = 'failed';
          errorMsg = data.message || 'Resend rejected outbound delivery';
          console.warn('[EmailService::ResendSendError]', data);
        } else {
          providerId = data.id || '';
        }
      } catch (err) {
        status = 'failed';
        errorMsg = err.message;
        writeLog('RESEND_NETWORK_EXCEPTION', { error: err.message });
        console.warn('[EmailService::SendNetworkError]', err.message);
      }
    }

    // Persist outbound record in MongoDB
    let savedEmail = null;
    try {
      const fromMatch = fromAddress.match(/^(?:(.*?)<)?([^>]+)>?$/);
      const fromObj = {
        name: fromMatch && fromMatch[1] ? fromMatch[1].trim() : 'TeachyBlogs Newsroom',
        email: fromMatch && fromMatch[2] ? fromMatch[2].trim() : fromAddress,
      };

      savedEmail = await Email.create({
        messageId,
        threadId: resolvedThreadId,
        inReplyTo,
        references,
        from: fromObj,
        to: normalizedTo,
        cc: normalizedCc,
        bcc: normalizedBcc,
        replyTo: replyTo || fromObj.email,
        subject: subject || '(No Subject)',
        text: text || '',
        html: this.sanitizeHtml(html || text || ''),
        direction: 'outbound',
        folder: 'sent',
        status,
        isRead: true,
        labels,
        providerId,
        providerMetadata: { error: errorMsg },
        sentAt: new Date(),
        createdBy: actor?._id || null,
      });
    } catch (err) {
      console.warn('[EmailService::SaveOutboundError]', err.message);
    }

    if (status === 'failed') {
      throw new Error(errorMsg || 'Failed to dispatch email via Resend.');
    }

    return {
      success: true,
      id: providerId,
      messageId,
      threadId: resolvedThreadId,
      email: savedEmail,
    };
  }

  /**
   * Threaded reply dispatcher
   */
  async sendReply({ originalEmailId, text, html, to, cc = [], bcc = [], actor = null }) {
    if (!originalEmailId) {
      throw new Error('Original email ID is required to reply.');
    }
    if (!text && !html) {
      throw new Error('Reply message body cannot be empty.');
    }

    const originalEmail = await Email.findById(originalEmailId);
    if (!originalEmail) {
      throw new Error('Original conversation not found.');
    }

    const targetRecipient = to || originalEmail.replyTo || originalEmail.from?.email;
    if (!targetRecipient) {
      throw new Error('Unable to determine recipient for this reply.');
    }

    const threadId = originalEmail.threadId || `thread_${originalEmail.messageId}`;
    const inReplyTo = originalEmail.messageId;
    const existingRefs = originalEmail.references || [];
    const references = existingRefs.includes(originalEmail.messageId)
      ? existingRefs
      : [...existingRefs, originalEmail.messageId];

    const replySubject = this.formatReplySubject(originalEmail.subject);

    return this.sendEmail({
      to: targetRecipient,
      subject: replySubject,
      text,
      html,
      cc,
      bcc,
      threadId,
      inReplyTo,
      references,
      actor,
      labels: originalEmail.labels && originalEmail.labels.length ? originalEmail.labels : ['Newsroom'],
    });
  }

  /**
   * Inbound email webhook processor (Resend Inbound Webhook)
   */
  async processInboundEmail(payload, signatureHeader = '') {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid inbound email payload');
    }

    writeLog('INBOUND_EMAIL_WEBHOOK_RECEIVED', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
    });

    const emailData = payload.data && typeof payload.data === 'object' ? payload.data : payload;

    const {
      from,
      to,
      cc = [],
      bcc = [],
      reply_to,
      subject = '(No Subject)',
      text = '',
      html = '',
      headers = {},
      attachments = [],
      message_id,
      id: providerId,
    } = emailData;

    const messageId = message_id || headers['message-id'] || headers['Message-ID'] || this.generateMessageId();
    const inReplyTo = headers['in-reply-to'] || headers['In-Reply-To'] || null;
    const referencesRaw = headers['references'] || headers['References'] || '';
    const references = typeof referencesRaw === 'string'
      ? referencesRaw.split(/\s+/).filter(Boolean)
      : Array.isArray(referencesRaw)
      ? referencesRaw
      : [];

    let resolvedThreadId = null;
    const lookupIds = [inReplyTo, ...references].filter(Boolean);

    if (lookupIds.length > 0) {
      const parentEmail = await Email.findOne({
        $or: [{ messageId: { $in: lookupIds } }, { inReplyTo: { $in: lookupIds } }],
      });
      if (parentEmail) {
        resolvedThreadId = parentEmail.threadId;
      }
    }

    if (!resolvedThreadId) {
      const normalizedSubject = subject.replace(/^(Re:\s*)+/i, '').trim();
      const subjectMatch = await Email.findOne({
        subject: new RegExp(`^Re:\\s*${escapeRegex(normalizedSubject)}$|^${escapeRegex(normalizedSubject)}$`, 'i'),
      }).sort({ createdAt: -1 });

      if (subjectMatch) {
        resolvedThreadId = subjectMatch.threadId;
      } else {
        resolvedThreadId = `thread_${crypto.randomBytes(12).toString('hex')}`;
      }
    }

    const parseAddress = (addr) => {
      if (!addr) return { name: '', email: 'unknown@sender.com' };
      if (typeof addr === 'object' && addr.email) {
        return { name: addr.name || '', email: addr.email.toLowerCase().trim() };
      }
      const match = String(addr).match(/^(?:(.*?)<)?([^>]+)>?$/);
      return {
        name: match && match[1] ? match[1].trim().replace(/^["']|["']$/g, '') : '',
        email: match && match[2] ? match[2].toLowerCase().trim() : String(addr).toLowerCase().trim(),
      };
    };

    const fromObj = parseAddress(from);
    const toArray = (Array.isArray(to) ? to : [to]).map(parseAddress);
    const ccArray = (Array.isArray(cc) ? cc : []).map(parseAddress);
    const bccArray = (Array.isArray(bcc) ? bcc : []).map(parseAddress);

    const attachmentMetadata = (attachments || []).map((att) => ({
      filename: (att.filename || 'attachment').replace(/[/\\?%*:|"<>]/g, '_'),
      contentType: att.content_type || att.contentType || 'application/octet-stream',
      size: Number(att.size) || 0,
      url: att.url || '',
    }));

    const sanitizedHtml = this.sanitizeHtml(html || text || '');

    // Smart Label Routing based on Destination Inbox or Subject
    let detectedLabel = 'Newsroom';
    const subLower = (subject || '').toLowerCase();
    const toEmails = toArray.map((t) => (t.email || '').toLowerCase()).join(' ');

    if (toEmails.includes('support@') || subLower.includes('support') || subLower.includes('help') || subLower.includes('issue')) {
      detectedLabel = 'Reader Support';
    } else if (toEmails.includes('tips@') || subLower.includes('tip') || subLower.includes('leak') || subLower.includes('story')) {
      detectedLabel = 'Article Tips';
    } else if (toEmails.includes('press@') || subLower.includes('press') || subLower.includes('media')) {
      detectedLabel = 'Press';
    } else if (toEmails.includes('business@') || toEmails.includes('sponsor@') || subLower.includes('sponsor') || subLower.includes('partner') || subLower.includes('business')) {
      detectedLabel = 'Business';
    } else if (toEmails.includes('contact@') || toEmails.includes('editorial@')) {
      detectedLabel = 'Newsroom';
    }

    const existing = await Email.findOne({ messageId });
    if (existing) {
      return { success: true, duplicate: true, email: existing };
    }

    const savedEmail = await Email.create({
      messageId,
      threadId: resolvedThreadId,
      inReplyTo,
      references,
      from: fromObj,
      to: toArray,
      cc: ccArray,
      bcc: bccArray,
      replyTo: reply_to ? parseAddress(reply_to).email : fromObj.email,
      subject,
      text,
      html: sanitizedHtml,
      direction: 'inbound',
      folder: 'inbox',
      status: 'received',
      isRead: false,
      labels: [detectedLabel],
      attachments: attachmentMetadata,
      providerId: providerId || '',
      receivedAt: new Date(),
    });

    writeLog('INBOUND_EMAIL_STORED', {
      messageId,
      threadId: resolvedThreadId,
      from: fromObj.email,
      subject,
    });

    return {
      success: true,
      email: savedEmail,
      threadId: resolvedThreadId,
    };
  }

  /**
   * Thread-Based Conversation Aggregator with Bounded Pagination & Search
   */
  async getThreads({
    folder = 'inbox',
    label = '',
    isStarred = null,
    isUnread = null,
    search = '',
    page = 1,
    limit = 25,
    sortBy = 'lastActivity',
    sortOrder = 'desc',
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * pageLimit;

    const matchStage = {};

    if (folder === 'starred') {
      matchStage.isStarred = true;
    } else if (folder === 'archived') {
      matchStage.isArchived = true;
    } else if (folder === 'unread') {
      matchStage.isRead = false;
      matchStage.folder = 'inbox';
    } else if (folder === 'all') {
      // no folder constraint
    } else if (folder) {
      matchStage.folder = folder;
      if (folder !== 'archived') {
        matchStage.isArchived = { $ne: true };
      }
    }

    if (label) {
      matchStage.labels = label;
    }
    if (isStarred === true || isStarred === 'true') {
      matchStage.isStarred = true;
    }
    if (isUnread === true || isUnread === 'true') {
      matchStage.isRead = false;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const escaped = escapeRegex(search.trim());
      matchStage.$or = [
        { subject: { $regex: escaped, $options: 'i' } },
        { text: { $regex: escaped, $options: 'i' } },
        { 'from.name': { $regex: escaped, $options: 'i' } },
        { 'from.email': { $regex: escaped, $options: 'i' } },
        { 'to.email': { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    let sortField = 'lastActivity';
    if (sortBy === 'subject') sortField = 'subject';
    if (sortBy === 'unread') sortField = 'unreadCount';

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$threadId',
          threadId: { $first: '$threadId' },
          subject: { $last: '$subject' },
          folder: { $last: '$folder' },
          labels: { $last: '$labels' },
          isStarred: { $max: '$isStarred' },
          isArchived: { $max: '$isArchived' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
          },
          lastActivity: { $max: '$createdAt' },
          participants: { $addToSet: '$from' },
          latestMessage: {
            $last: {
              _id: '$_id',
              messageId: '$messageId',
              from: '$from',
              to: '$to',
              subject: '$subject',
              text: '$text',
              direction: '$direction',
              createdAt: '$createdAt',
              isRead: '$isRead',
            },
          },
        },
      },
      { $sort: { [sortField]: sortDirection } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: pageLimit }],
        },
      },
    ];

    const [result] = await Email.aggregate(pipeline);
    const totalThreads = result?.metadata[0]?.total || 0;
    const threads = result?.data || [];
    const totalPages = Math.ceil(totalThreads / pageLimit) || 1;

    return {
      threads,
      pagination: {
        total: totalThreads,
        page: pageNum,
        limit: pageLimit,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    };
  }

  /**
   * Get all messages in a conversation thread in chronological order
   */
  async getThreadMessages(threadId) {
    if (!threadId) throw new Error('Thread ID is required.');

    const messages = await Email.find({ threadId })
      .sort({ createdAt: 1 })
      .populate('createdBy', 'name email role')
      .lean();

    if (!messages || messages.length === 0) {
      throw new Error('Conversation thread not found.');
    }

    await Email.updateMany(
      { threadId, isRead: false },
      { isRead: true }
    );

    return messages;
  }

  /**
   * Thread & Message Actions (Star, Archive, MarkRead, Folder, Label)
   */
  async performThreadAction({ threadId, messageIds, action, value }) {
    const filter = threadId ? { threadId } : { _id: { $in: messageIds } };

    switch (action) {
      case 'markRead':
        return Email.updateMany(filter, { isRead: true });
      case 'markUnread':
        return Email.updateMany(filter, { isRead: false });
      case 'star':
        return Email.updateMany(filter, { isStarred: true });
      case 'unstar':
        return Email.updateMany(filter, { isStarred: false });
      case 'archive':
        return Email.updateMany(filter, { isArchived: true, folder: 'archived' });
      case 'unarchive':
        return Email.updateMany(filter, { isArchived: false, folder: 'inbox' });
      case 'trash':
        return Email.updateMany(filter, { folder: 'trash' });
      case 'restore':
        return Email.updateMany(filter, { folder: 'inbox' });
      case 'setLabel':
        return Email.updateMany(filter, { labels: [value] });
      case 'deletePermanent':
        return Email.deleteMany(filter);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Get folder and unread counts for navigation badges
   */
  async getFolderCounts() {
    const [inboxUnread, inboxTotal, starredTotal, sentTotal, archivedTotal, trashTotal] =
      await Promise.all([
        Email.countDocuments({ folder: 'inbox', isRead: false, isArchived: { $ne: true } }),
        Email.countDocuments({ folder: 'inbox', isArchived: { $ne: true } }),
        Email.countDocuments({ isStarred: true }),
        Email.countDocuments({ folder: 'sent' }),
        Email.countDocuments({ isArchived: true }),
        Email.countDocuments({ folder: 'trash' }),
      ]);

    return {
      inbox: { unread: inboxUnread, total: inboxTotal },
      starred: { total: starredTotal },
      sent: { total: sentTotal },
      archived: { total: archivedTotal },
      trash: { total: trashTotal },
    };
  }

  async sendOtpEmail({ to, otp, purpose, expiryMinutes = 10, recipientName }) {
    let purposeLabel = 'Verification Code';
    let subject = `${otp} is your TeachyBlogs verification code`;

    if (purpose === 'PASSWORD_RESET') {
      purposeLabel = 'Reset Your Newsroom Password';
      subject = `${otp} is your TeachyBlogs password reset code`;
    } else if (purpose === 'SECURITY_TOKEN_RECOVERY') {
      purposeLabel = 'Recover Your Security Token';
      subject = `${otp} is your TeachyBlogs security token recovery code`;
    } else if (purpose === 'EMAIL_VERIFICATION') {
      purposeLabel = 'Verify Your Email Address';
      subject = `${otp} is your TeachyBlogs email verification code`;
    } else if (purpose === 'LOGIN_VERIFICATION') {
      purposeLabel = 'Confirm Your Newsroom Sign In';
      subject = `${otp} is your TeachyBlogs sign-in code`;
    }

    writeLog('OTP_DISPATCH_REQUEST', { to, purpose, otp, expiryMinutes });

    console.log(`
┌──────────────────────────────────────────────────────────┐
│  TEACHYBLOGS SECURITY OTP DISPATCH                       │
│  To:      ${(to || '').padEnd(45)}  │
│  Purpose: ${(purpose || '').padEnd(45)}  │
│  CODE:    >>> ${otp} <<<                                 │
│  Expires: ${String(expiryMinutes).padEnd(45)} minutes
└──────────────────────────────────────────────────────────┘
    `);

    const html = this.buildOtpHtml({ otp, purposeLabel, expiryMinutes, recipientName });
    const text = `${purposeLabel}\n\nYour one-time verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.\nIf you did not request this, please safely ignore this email.`;

    try {
      const res = await this.sendEmail({ to, subject, html, text, labels: ['Security Alert'] });
      writeLog('OTP_DISPATCH_SUCCESS', { to, providerId: res.id });
      return res;
    } catch (err) {
      writeLog('OTP_DISPATCH_ERROR', { to, error: err.message });
      console.warn('[EmailService::SendOtpWarning]', err.message);
      return { success: true, simulated: true, error: err.message };
    }
  }

  /**
   * Helper: Send Security Alert Notification
   */
  async sendSecurityAlert({ to, eventType, timestamp, ip, recipientName }) {
    let eventTitle = 'Security Alert';
    let eventDescription = 'An update occurred on your account.';

    if (eventType === 'PASSWORD_CHANGED') {
      eventTitle = 'Your Password Was Changed';
      eventDescription = 'The password for your TeachyBlogs account was recently updated.';
    } else if (eventType === 'SECURITY_TOKEN_CHANGED') {
      eventTitle = 'Your Security Token Was Updated';
      eventDescription = 'The personal security token for your TeachyBlogs newsroom account was updated.';
    }

    const subject = `[Security Alert] ${eventTitle}`;
    const html = this.buildAlertHtml({ eventTitle, eventDescription, timestamp, ip, recipientName });
    const text = `${eventTitle}\n\n${eventDescription}\nTime: ${new Date().toUTCString()}\n\nIf you did not make this change, please recover your account immediately.`;

    writeLog('SECURITY_ALERT_DISPATCH', { to, eventType });
    return this.sendEmail({ to, subject, html, text, labels: ['Security Alert'] });
  }

  buildOtpHtml({ otp, purposeLabel, expiryMinutes = 10, recipientName }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purposeLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 28px 32px; text-align: center; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
    .logo-sub { color: #dc2626; }
    .body { padding: 32px; }
    .title { font-size: 20px; font-weight: 800; color: #09090b; margin-top: 0; margin-bottom: 8px; }
    .greeting { font-size: 14px; color: #71717a; margin-bottom: 24px; }
    .otp-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 0.25em; color: #dc2626; margin: 0; padding-left: 0.25em; }
    .otp-notice { font-size: 12px; font-weight: 600; color: #71717a; margin-top: 12px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
    .warning { font-size: 12px; color: #71717a; line-height: 1.5; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Teachy<span class="logo-sub">Blogs</span></h1>
    </div>
    <div class="body">
      <h2 class="title">${purposeLabel}</h2>
      <p class="greeting">Hello${recipientName ? ' ' + recipientName : ''}, use the one-time verification code below to authorize your request.</p>
      
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <p class="otp-notice">Expires in ${expiryMinutes} minutes</p>
      </div>

      <p class="warning">
        <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email. Never share your one-time code or credentials with anyone.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TeachyBlogs Publication Group · Digital Publishing & Journal</p>
      <p>This is an automated administrative notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  buildAlertHtml({ eventTitle, eventDescription, timestamp = new Date(), ip, recipientName }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${eventTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; padding: 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 18px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin: 0; }
    .logo-sub { color: #dc2626; }
    .body { padding: 32px; }
    .alert-badge { display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 800; color: #09090b; margin-top: 0; }
    .meta { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 12px; color: #52525b; line-height: 1.6; }
    .footer { padding: 20px; background: #fafafa; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Teachy<span class="logo-sub">Blogs</span></h1>
    </div>
    <div class="body">
      <span class="alert-badge">Security Event</span>
      <h2 class="title">${eventTitle}</h2>
      <p style="font-size: 14px; color: #52525b;">Hello${recipientName ? ' ' + recipientName : ''}, ${eventDescription}</p>
      
      <div class="meta">
        <div><strong>Time:</strong> ${new Date(timestamp).toUTCString()}</div>
        ${ip ? `<div><strong>IP Address:</strong> ${ip}</div>` : ''}
      </div>

      <p style="font-size: 12px; color: #71717a;">
        If you did not perform this action, please access the Newsroom Command Center immediately and reset your security credentials.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} TeachyBlogs Publication Group · Security Notification
    </div>
  </div>
</body>
</html>`;
  }
}

function escapeRegex(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const emailService = new EmailService();
export default emailService;
