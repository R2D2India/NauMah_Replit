import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found. Email notifications will not be sent.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Cannot send email: SENDGRID_API_KEY not found');
    return false;
  }
  
  try {
    await sgMail.send({
      to: options.to,
      from: options.from,
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
      html: options.html || ''
    });
    
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Log additional details if available
    if (error && error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body));
    }
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
    from: 'info@sendgrid.net', // Using a default SendGrid sender email that should work
    subject,
    html
  });
}