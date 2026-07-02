const nodemailer = require('nodemailer');

async function sendEmail() {
  try {
    const base64Payload = process.argv[2];
    if (!base64Payload) {
      console.error("No payload provided to send_email.js");
      process.exit(1);
    }
    
    const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    const data = JSON.parse(jsonPayload);

    // Create transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: data.sender_email,
        pass: data.sender_password,
      },
    });

    const mailOptions = {
      from: `HepatoAI IT Operations <${data.sender_email}>`,
      to: data.recipient_email,
      bcc: data.sender_email, // ALWAYS SEND BCC TO SENDER SO ADMIN RECEIVES IT EVEN IF FAKE EMAIL WAS TYPED
      subject: data.subject,
      html: data.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Nodemailer: " + info.response);
    process.exit(0);
  } catch (error) {
    console.error("Nodemailer Error: ", error.message || error);
    process.exit(1);
  }
}

sendEmail();
