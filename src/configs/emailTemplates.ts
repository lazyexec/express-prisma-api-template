/**
 * Centralized email templates
 * All email HTML and text content in one place
 */

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export const emailTemplates = {
    /**
     * Registration confirmation email
     */
    registration: (token: string): EmailTemplate => ({
        subject: "Registration Confirmation",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to InDesk!</h2>
        <p>Please confirm your registration using this token:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: bold;">${token}</code>
        </div>
        <p>Thank you for joining us!</p>
      </div>
    `,
        text: `Please confirm your registration using this token: ${token}`,
    }),

    /**
     * Password reset email
     */
    resetPassword: (token: string): EmailTemplate => ({
        subject: "Reset Password",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Please use this code to recover your account:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: bold;">${token}</code>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
        text: `Please recover your account using this code: ${token}`,
    }),

    /**
     * Account restriction email
     */
    restriction: (reason: string): EmailTemplate => ({
        subject: "Account Restriction",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Restricted</h2>
        <p>Your account has been restricted.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <strong>Reason:</strong> ${reason}
        </div>
        <p>Please contact support for assistance.</p>
      </div>
    `,
        text: `Your account has been restricted. Reason: ${reason}. Consider contacting support for assistance.`,
    }),

    /**
     * Account unrestricted email
     */
    unrestricted: (): EmailTemplate => ({
        subject: "Account Unrestricted",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Unrestricted</h2>
        <p>Good news! Your account has been unrestricted.</p>
        <p>You can now access all features. Enjoy your stay!</p>
      </div>
    `,
        text: `Your account has been unrestricted. Enjoy your stay!`,
    }),

    /**
     * Welcome email
     */
    welcome: (token: string): EmailTemplate => ({
        subject: "Welcome to InDesk",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to InDesk!</h2>
        <p>We're excited to have you on board.</p>
        <p>Please confirm your registration using this token:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <code style="font-size: 18px; font-weight: bold;">${token}</code>
        </div>
        <p>Get started by setting up your clinic and inviting your team!</p>
      </div>
    `,
        text: `Please confirm your registration using this token: ${token}`,
    }),

    /**
     * Assessment assignment email
     */
    assessment: (
        assessmentTitle: string,
        shareUrl: string,
        customMessage?: string
    ): EmailTemplate => ({
        subject: `Assessment: ${assessmentTitle}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Assessment Assigned</h2>
        ${customMessage ? `<p>${customMessage}</p>` : `<p>You have been assigned an assessment: <strong>"${assessmentTitle}"</strong></p>`}
        <p>Please complete the assessment by clicking the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${shareUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Assessment
          </a>
        </div>
        ${customMessage ? "" : "<p>Thank you!</p>"}
      </div>
    `,
        text: `
Hello,

${customMessage || `You have been assigned an assessment: "${assessmentTitle}"`}

Please complete the assessment by clicking the link below:
${shareUrl}

${customMessage ? "" : "Thank you!"}
    `,
    }),

    /**
     * Payment link email
     */
    paymentLink: (paymentLink: string, appointmentDetails: any): EmailTemplate => ({
        subject: `Payment Required: ${appointmentDetails.sessionName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Scheduled</h2>
        <p>Hello ${appointmentDetails.clientName},</p>
        <p>Your appointment for <strong>"${appointmentDetails.sessionName}"</strong> has been scheduled.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details</h3>
          <p><strong>Date:</strong> ${appointmentDetails.date}</p>
          <p><strong>Time:</strong> ${appointmentDetails.time}</p>
          ${appointmentDetails.clinicianName ? `<p><strong>Clinician:</strong> ${appointmentDetails.clinicianName}</p>` : ""}
          <p><strong>Price:</strong> ${appointmentDetails.price}</p>
        </div>
        
        <p>Please complete the payment to confirm your appointment:</p>
        <div style="margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Pay Now
          </a>
        </div>
        <p>Thank you!</p>
      </div>
    `,
        text: `
Hello ${appointmentDetails.clientName},

Your appointment for "${appointmentDetails.sessionName}" has been scheduled.

Date: ${appointmentDetails.date}
Time: ${appointmentDetails.time}
${appointmentDetails.clinicianName ? `Clinician: ${appointmentDetails.clinicianName}` : ""}
Price: ${appointmentDetails.price}

Please complete the payment to confirm your appointment by clicking the link below:
${paymentLink}

Thank you!
    `,
    }),

    /**
     * Invoice email
     */
    invoice: (
        invoiceLink: string,
        clientName: string,
        clinicName: string,
        invoiceNumber: string,
        issueDate: string,
        dueDate: string,
        totalAmount: string,
        customMessage?: string
    ): EmailTemplate => ({
        subject: `Invoice from ${clinicName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${clientName},</h2>
        
        <p>You have received an invoice from <strong>${clinicName}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice Details</h3>
          <table style="width: 100%;">
            <tr>
              <td><strong>Invoice Number:</strong></td>
              <td>${invoiceNumber}</td>
            </tr>
            <tr>
              <td><strong>Issue Date:</strong></td>
              <td>${issueDate}</td>
            </tr>
            <tr>
              <td><strong>Due Date:</strong></td>
              <td>${dueDate}</td>
            </tr>
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td style="font-size: 18px; color: #2563eb;"><strong>$${totalAmount}</strong></td>
            </tr>
          </table>
        </div>
        
        ${customMessage ? `<p>${customMessage}</p>` : ""}
        
        <div style="margin: 30px 0;">
          <a href="${invoiceLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View and Pay Invoice
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          ${customMessage ? "" : "Thank you for your business!"}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          This is an automated email from ${clinicName}. 
          Please do not reply to this email.
        </p>
      </div>
    `,
        text: `
Hello ${clientName},

You have received an invoice from ${clinicName}.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Issue Date: ${issueDate}
- Due Date: ${dueDate}
- Total Amount: $${totalAmount}

You can view and pay your invoice by clicking the link below:
${invoiceLink}

${customMessage || "Thank you for your business!"}
    `,
    }),
};

export default emailTemplates;
