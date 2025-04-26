/**
 * Alternative email implementation for development/testing without requiring
 * domain verification. This uses MailCatcher API instead of SendGrid.
 * 
 * To use:
 * 1. Rename this file to email.ts (after backing up the original)
 * 2. Restart the server
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// NAUMAH support email address for replies
export const NAUMAH_SUPPORT_EMAIL = 'asknaumah@gmail.com';
// Simulated verified sender
const SENDGRID_VERIFIED_SENDER = 'noreply@naumah.com';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

/**
 * Send an email using MailCatcher (no verification required)
 * Emails are not actually delivered but can be viewed at mailcatcher.cc
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('🔍 DEBUG: Attempting to send test email:', {
    to: options.to,
    from: options.from,
    subject: options.subject,
    hasText: !!options.text,
    hasHtml: !!options.html,
    replyTo: options.replyTo || 'not set'
  });
  
  try {
    // Generate a unique inbox ID
    const inboxId = uuidv4();
    
    // Log the mailcatcher.cc URL where the email can be viewed
    console.log(`📧 TEST EMAIL: View this email at https://mailcatcher.cc/inbox/${inboxId}`);
    
    // Make the API request to mailcatcher.cc
    const response = await axios.post(`https://mailcatcher.cc/api/inbox/${inboxId}`, {
      to: options.to,
      from: options.from,
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
      html: options.html || '',
      replyTo: options.replyTo
    });
    
    if (response.status === 200) {
      console.log('📧 TEST EMAIL: Email sent successfully to mailcatcher.cc');
      return true;
    } else {
      console.error('❌ TEST EMAIL: Failed to send email to mailcatcher.cc', response.status);
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ TEST EMAIL: Error sending test email:', error.message);
    return false;
  }
}

/**
 * Send a notification email when a new user joins the waitlist
 */
export async function sendWaitlistNotification(
  recipientEmail: string, 
  entry: { name: string; mobile: string; email: string }
): Promise<boolean> {
  const subject = 'New NauMah Waitlist Entry';
  const html = `
    <h1>New User Joined NauMah Waitlist</h1>
    <p>A new user has joined the waitlist for NauMah:</p>
    <ul>
      <li><strong>Name:</strong> ${entry.name}</li>
      <li><strong>Email:</strong> ${entry.email}</li>
      <li><strong>Mobile:</strong> ${entry.mobile}</li>
    </ul>
    <p>Time: ${new Date().toLocaleString()}</p>
  `;
  
  return sendEmail({
    to: recipientEmail,
    from: SENDGRID_VERIFIED_SENDER,
    subject,
    html
  });
}

/**
 * Send a welcome email to a newly registered user
 */
export async function sendWelcomeEmail(
  user: { 
    id: number;
    email: string; 
    firstName?: string | null; 
    lastName?: string | null;
    username: string;
  }
): Promise<boolean> {
  const userName = user.firstName || user.username;
  const subject = '💛 Pregnancy Made Beautiful, Safe, and Joyful — Welcome to NauMah !';
  
  // Create the HTML email template using the provided design
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NauMah</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      color: #FF4D4D;
      padding: 20px;
      text-align: center;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border-left: 1px solid #eeeeee;
      border-right: 1px solid #eeeeee;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-bottom: 1px solid #eeeeee;
      border-left: 1px solid #eeeeee;
      border-right: 1px solid #eeeeee;
    }
    h1 {
      color: #FF4D4D;
      margin: 0;
      font-size: 24px;
    }
    p {
      margin: 10px 0;
    }
    .emoji {
      font-size: 18px;
    }
    .highlight {
      color: #FF4D4D;
      font-weight: bold;
    }
    .mission-list {
      margin: 20px 0;
    }
    .mission-item {
      margin-bottom: 10px;
      padding-left: 25px;
      position: relative;
    }
    .mission-item:before {
      content: "🌟";
      position: absolute;
      left: 0;
    }
    .support-info {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    @media screen and (max-width: 480px) {
      .container {
        width: 100%;
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💛 Pregnancy Made Beautiful, Safe, and Joyful — Welcome to NauMah !</h1>
    </div>
    <div class="content">
      <p>Dear ${userName},</p>
      
      <p>Congratulations and welcome to NauMah – your trusted companion for the extraordinary journey ahead! <span class="emoji">🌸</span></p>
      
      <p>At NauMah, we believe that pregnancy should be a time of joy, confidence, and celebration — not stress. The name NauMah comes from two Hindi words — "Nau" (Nine) and "Mah" (Months) — symbolizing the nine incredible months that bring a new life into the world.</p>
      
      <p>With the power of advanced AI technology, we're here to support you every step of the way — offering personalized insights, timely reminders, and round-the-clock assistance, tailored just for you.</p>
      
      <p><strong>Our Mission at NauMah AI Technologies:</strong></p>
      <div class="mission-list">
        <div class="mission-item">Empower expectant mothers with personalized, week-by-week guidance.</div>
        <div class="mission-item">Make pregnancy journeys safer, happier, and better informed.</div>
        <div class="mission-item">Provide 24/7 AI-powered pregnancy support — whenever you need it.</div>
        <div class="mission-item">Be your trusted partner through the beautiful, life-changing journey of motherhood.</div>
      </div>
      
      <p>You're not alone in this journey. With NauMah, you have a loving, intelligent support system at your fingertips — making every moment memorable, meaningful, and magical. <span class="emoji">💛</span></p>
      
      <div class="support-info">
        <p><strong>Have questions or need assistance?</strong></p>
        <p>Write to us anytime at <a href="mailto:${NAUMAH_SUPPORT_EMAIL}">${NAUMAH_SUPPORT_EMAIL}</a> — we're always here for you!</p>
      </div>
      
      <p>Warm wishes,<br>Team NauMah<br>Your AI Companion for a Beautiful 9-Month Journey</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NauMah AI Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Track the email sending attempt
  const { storage } = await import('./storage');
  
  // First log that we're about to send the email
  await storage.trackEmail({
    userId: user.id,
    emailType: 'welcome',
    emailTo: user.email,
    emailFrom: NAUMAH_SUPPORT_EMAIL,
    subject: subject,
    status: 'pending',
    statusDetails: 'Test email sending initiated'
  });
  
  try {
    // Send test email
    const result = await sendEmail({
      to: user.email,
      from: SENDGRID_VERIFIED_SENDER,
      replyTo: NAUMAH_SUPPORT_EMAIL,
      subject,
      html
    });
    
    // Track the result
    await storage.trackEmail({
      userId: user.id,
      emailType: 'welcome',
      emailTo: user.email,
      emailFrom: SENDGRID_VERIFIED_SENDER,
      subject: subject,
      status: result ? 'sent' : 'failed',
      statusDetails: result ? 'Test email sent successfully' : 'Failed to send test email'
    });
    
    return result;
  } catch (error: any) {
    // Track the error
    await storage.trackEmail({
      userId: user.id,
      emailType: 'welcome',
      emailTo: user.email,
      emailFrom: SENDGRID_VERIFIED_SENDER,
      subject: subject,
      status: 'failed',
      statusDetails: `Error: ${error.message || 'Unknown error'}`
    });
    
    console.error('Error sending welcome test email:', error);
    return false;
  }
}