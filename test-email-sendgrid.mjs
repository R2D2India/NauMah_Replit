// Test script for sending an email directly using SendGrid with verified sender
import sgMail from '@sendgrid/mail';

// Get API key from environment variable
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('Error: SENDGRID_API_KEY environment variable not found');
  process.exit(1);
}

console.log('Using SendGrid API Key:', apiKey.substring(0, 5) + '...');
sgMail.setApiKey(apiKey);

// SendGrid verified sender email (the one we know SendGrid has verified)
const SENDGRID_SENDER = 'info@sendgrid.net';
const TEST_EMAIL = 'test@example.com'; // Replace with your email if you want to receive the test

async function sendTestEmail() {
  console.log(`Sending test email to: ${TEST_EMAIL}`);
  
  try {
    // Try sending with verified email
    const msg = {
      to: TEST_EMAIL,
      from: SENDGRID_SENDER, // Use verified sender email
      subject: 'NauMah Test Email (Verified Sender)',
      text: 'This is a test email from NauMah using the verified sender.',
      html: '<strong>This is a test email from NauMah using the verified sender.</strong>',
    };

    console.log('Sending email with the following configuration:');
    console.log(JSON.stringify(msg, null, 2));
    
    const response = await sgMail.send(msg);
    console.log('Email sent successfully!');
    console.log('SendGrid Response:', response);
    
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    
    if (error.response) {
      console.error('SendGrid error details:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
  }
}

sendTestEmail();