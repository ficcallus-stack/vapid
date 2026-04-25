/**
 * KindredCare US — Email Templates
 * All templates use inline CSS + table layout for maximum email client compatibility.
 * Brand colors: Primary #031f41, Secondary #8e4e14, Accent #ffb780
 */

const BRAND = {
  name: "KindredCare US",
  color: "#031f41",
  accent: "#ffb780",
  secondary: "#8e4e14",
  bg: "#f9f9f9",
  cardBg: "#ffffff",
  textPrimary: "#1a1c1c",
  textSecondary: "#44474e",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://www.kindredcareus.com",
};

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>KindredCare US</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:24px;font-weight:800;color:${BRAND.color};letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">KindredCare <span style="color:${BRAND.secondary};font-style:italic;">US</span></span>
            </td>
          </tr>
          <!-- Card Body -->
          <tr>
            <td style="background-color:${BRAND.cardBg};border-radius:16px;padding:48px 40px;box-shadow:0 2px 16px rgba(0,0,0,0.04);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                © ${new Date().getFullYear()} KindredCare US. Secure & Verified Caregiving.<br/>
                <a href="${BRAND.url}/safety" style="color:#999;text-decoration:underline;">Trust & Safety</a> · 
                <a href="${BRAND.url}" style="color:#999;text-decoration:underline;">Visit Website</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#bbb;">
                You're receiving this because you have an account at kindredcareus.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px 0;">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND.color},#1d3557);color:#ffffff;font-size:15px;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── 1. OTP Verification ───

export function otpEmailTemplate(name: string, otp: string) {
  return layout(`
    <td align="center">
      <div style="width:64px;height:64px;background-color:#f3f3f3;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">✉️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:${BRAND.color};letter-spacing:-0.5px;">Verify your email</h1>
      <p style="margin:0 0 32px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
        Hi ${name}, enter this code to finish setting up your KindredCare account.
      </p>
      <div style="background-color:#f9f9f9;border-radius:12px;padding:24px 40px;display:inline-block;margin-bottom:32px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:${BRAND.color};font-family:monospace;">${otp}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
        This code expires in <strong>10 minutes</strong>. If you didn't create an account, ignore this email.
      </p>
    </td>
  `);
}

export function otpEmailText(name: string, otp: string) {
  return `Hi ${name},\n\nYour KindredCare verification code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't create an account, ignore this email.\n\n— KindredCare US`;
}

// ─── 2. Welcome ───

export function welcomeEmailTemplate(name: string, role: string) {
  const isParent = role === "parent";
  const greeting = isParent
    ? "You're all set to find trusted, certified caregivers for your family."
    : "You're ready to connect with families looking for experienced caregivers.";
  const ctaUrl = isParent ? `${BRAND.url}/browse` : `${BRAND.url}/jobs`;
  const ctaText = isParent ? "Browse Caregivers" : "Find Jobs";

  return layout(`
    <td>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:${BRAND.color};">Welcome to KindredCare! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${name}, ${greeting}
      </p>
      <div style="background-color:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:${BRAND.textPrimary};font-weight:600;">What's next?</p>
        <ul style="margin:12px 0 0;padding-left:20px;font-size:14px;color:${BRAND.textSecondary};line-height:2;">
          ${isParent
            ? `<li>Browse verified caregivers in your area</li>
               <li>Post a job to receive applications</li>
               <li>Book and pay securely through our platform</li>`
            : `<li>Complete your profile and upload certifications</li>
               <li>Browse and apply to job listings</li>
               <li>Get booked and earn through our secure wallet</li>`
          }
        </ul>
      </div>
      ${btn(ctaText, ctaUrl)}
    </td>
  `);
}

export function welcomeEmailText(name: string, role: string) {
  return `Welcome to KindredCare, ${name}!\n\nYour account is verified and ready to go.\n\nVisit ${BRAND.url} to get started.\n\n— KindredCare US`;
}

// ─── 3. Password Reset ───

export function passwordResetTemplate(email: string, resetLink: string) {
  return layout(`
    <td>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${BRAND.color};">Reset your password</h1>
      <p style="margin:0 0 32px;font-size:15px;color:${BRAND.textSecondary};line-height:1.7;">
        Follow this link to reset your <strong>${BRAND.name}</strong> password for your <strong>${email}</strong> account.
      </p>
      ${btn("Reset Password", resetLink)}
      <p style="margin:32px 0 0;font-size:13px;color:#999;line-height:1.6;">
        If you didn't ask to reset your password, you can ignore this email.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#999;font-weight:700;">
        Thanks,<br/>Your ${BRAND.name} team
      </p>
    </td>
  `);
}

export function passwordResetText(email: string, resetLink: string) {
  return `Follow this link to reset your KindredCareUS password for your ${email} account.\n\n${resetLink}\n\nIf you didn't ask to reset your password, you can ignore this email.\n\nThanks,\nYour KindredCareUS team`;
}

// ─── 4. New Application ───

export function newApplicationTemplate(parentName: string, nannyName: string, jobTitle: string) {
  return layout(`
    <td>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.color};">New Application Received 📋</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${parentName}, <strong>${nannyName}</strong> has applied to your job listing: <strong>"${jobTitle}"</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:${BRAND.textSecondary};">
        Review their profile and experience to decide if they're a good fit for your family.
      </p>
      ${btn("Review Application", `${BRAND.url}/dashboard/parent/applicants`)}
    </td>
  `);
}

export function newApplicationText(parentName: string, nannyName: string, jobTitle: string) {
  return `Hi ${parentName},\n\n${nannyName} has applied to your job "${jobTitle}".\n\nReview at: ${BRAND.url}/dashboard/parent/applicants\n\n— KindredCare US`;
}

// ─── 5/6. Application Status ───

export function applicationStatusTemplate(nannyName: string, jobTitle: string, status: "accepted" | "rejected") {
  const isAccepted = status === "accepted";
  return layout(`
    <td>
      <div style="width:56px;height:56px;background-color:${isAccepted ? "#e8f5e9" : "#fff3e0"};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:24px;">${isAccepted ? "🎉" : "📝"}</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.color};">
        ${isAccepted ? "Application Accepted!" : "Application Update"}
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${nannyName}, your application for <strong>"${jobTitle}"</strong> has been 
        <strong style="color:${isAccepted ? "#2e7d32" : BRAND.secondary};">${status}</strong>.
      </p>
      ${isAccepted
        ? `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.textSecondary};">The family will reach out to you shortly to discuss next steps. Check your messages!</p>
           ${btn("View Messages", `${BRAND.url}/dashboard/messages`)}`
        : `<p style="margin:0 0 16px;font-size:14px;color:${BRAND.textSecondary};">Don't be discouraged — there are many families looking for great caregivers like you!</p>
           ${btn("Browse More Jobs", `${BRAND.url}/jobs`)}`
      }
    </td>
  `);
}

export function applicationStatusText(nannyName: string, jobTitle: string, status: "accepted" | "rejected") {
  return `Hi ${nannyName},\n\nYour application for "${jobTitle}" has been ${status}.\n\nVisit ${BRAND.url} for more.\n\n— KindredCare US`;
}

// ─── 7/8/9. Bookings ───

export function bookingEmailTemplate(
  name: string,
  type: "confirmed" | "cancelled" | "completed",
  details: { jobTitle?: string; amount?: number; bookingId: string }
) {
  const cfg = {
    confirmed: { emoji: "✅", title: "Booking Confirmed!", color: "#2e7d32", msg: "A new booking has been confirmed. Check the details in your dashboard." },
    cancelled: { emoji: "❌", title: "Booking Cancelled", color: "#c62828", msg: "A booking has been cancelled. Any held funds will be released." },
    completed: { emoji: "💰", title: "Booking Completed!", color: "#2e7d32", msg: "The booking is complete and payment has been released to your wallet." },
  }[type];

  return layout(`
    <td>
      <div style="width:56px;height:56px;background-color:${type === "cancelled" ? "#fce4ec" : "#e8f5e9"};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:24px;">${cfg.emoji}</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.color};">${cfg.title}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${name}, ${cfg.msg}
      </p>
      <div style="background-color:#f9f9f9;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#999;padding-bottom:8px;">Booking ID</td>
            <td align="right" style="font-size:13px;font-weight:700;color:${BRAND.textPrimary};padding-bottom:8px;">#${details.bookingId.slice(0, 8).toUpperCase()}</td>
          </tr>
          ${details.amount ? `
          <tr>
            <td style="font-size:13px;color:#999;">Amount</td>
            <td align="right" style="font-size:13px;font-weight:700;color:${cfg.color};">$${(details.amount / 100).toFixed(2)}</td>
          </tr>` : ""}
        </table>
      </div>
      ${btn("View Dashboard", `${BRAND.url}/dashboard`)}
    </td>
  `);
}

export function bookingEmailText(
  name: string,
  type: "confirmed" | "cancelled" | "completed",
  details: { jobTitle?: string; amount?: number; bookingId: string }
) {
  const msg = {
    confirmed: "Your booking has been confirmed.",
    cancelled: "A booking has been cancelled.",
    completed: "Booking completed and payment released.",
  }[type];
  return `Hi ${name},\n\n${msg}\n\nBooking ID: #${details.bookingId.slice(0, 8)}\n${details.amount ? `Amount: $${(details.amount / 100).toFixed(2)}` : ""}\n\nView at: ${BRAND.url}/dashboard\n\n— KindredCare US`;
}

// ─── 10. Premium Subscription ───

export function subscriptionSuccessTemplate(name: string) {
  return layout(`
    <td>
      <div style="width:64px;height:64px;background-color:#fff8e1;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">💎</span>
      </div>
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:${BRAND.color};">Welcome to Kindred Premium!</h1>
      <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${name}, your family is now a <strong>Premium Member</strong> of KindredCare US.
      </p>
      <div style="background-color:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #ffcc80;">
        <p style="margin:0 0 12px;font-size:14px;color:${BRAND.textPrimary};font-weight:700;">Your Unlocked Benefits:</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;color:${BRAND.textSecondary};line-height:1.8;">
          <li><strong>Unlimited Messaging</strong>: Chat with nannies before hiring them.</li>
          <li><strong>Premium Badge</strong>: Your profile stands out to the top caregivers.</li>
          <li><strong>Priority Support</strong>: Direct access to our dedicated family support team.</li>
        </ul>
      </div>
      <p style="margin:0 0 24px;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">
        Ready to find the perfect care match? Start messaging verified caregivers today.
      </p>
      ${btn("Explore Caregivers", `${BRAND.url}/browse`)}
      <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
        You can manage your subscription and view billing details anytime in your dashboard settings.
      </p>
    </td>
  `);
}

export function subscriptionSuccessText(name: string) {
  return `Hi ${name},\n\nWelcome to Kindred Premium! Your family is now a Premium Member.\n\nBenefits Unlocked:\n- Unlimited Messaging with nannies\n- Premium Badge\n- Priority Support\n\nGet started at: ${BRAND.url}/browse\n\n— KindredCare US`;
}

// ─── 8. Escrow Receipt ───

export function escrowReceiptTemplate(name: string, details: { amount: number; hours: number; rate: number; fee: number; transactionId: string }) {
  return layout(`
    <td align="left">
      <div style="background-color:${BRAND.color};border-radius:12px;padding:24px;margin-bottom:32px;color:#ffffff;text-align:center;">
        <span style="font-size:32px;margin-bottom:12px;display:block;">🛡️</span>
        <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Secure Escrow Authorization</h2>
      </div>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${BRAND.color};letter-spacing:-0.5px;">Deposit Receipt</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
        Hi ${name}, your secure deposit has been authorized and is now held in **Kindred Escrow**.
      </p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:32px;border:1px solid #eeeeee;">
        <tr>
          <td style="padding-bottom:12px;font-size:14px;color:${BRAND.textSecondary};">Care Hours (${details.hours}h @ $${details.rate}/hr)</td>
          <td align="right" style="padding-bottom:12px;font-size:14px;font-weight:700;color:${BRAND.color};">$${(details.hours * details.rate).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;font-size:14px;color:${BRAND.textSecondary};">Service Fee</td>
          <td align="right" style="padding-bottom:12px;font-size:14px;font-weight:700;color:${BRAND.color};">$${details.fee.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding-top:12px;border-top:1px solid #dddddd;font-size:16px;font-weight:800;color:${BRAND.color};">Total Authorized</td>
          <td align="right" style="padding-top:12px;border-top:1px solid #dddddd;font-size:18px;font-weight:800;color:${BRAND.color};">$${details.amount.toFixed(2)}</td>
        </tr>
      </table>

      <div style="margin-bottom:32px;padding:16px;border-left:4px solid ${BRAND.accent};background-color:#fffdf5;">
        <p style="margin:0;font-size:13px;color:${BRAND.textSecondary};line-height:1.5;">
          <strong>Escrow Protection:</strong> Funds are held securely and only released after you approve completed work. If the job is cancelled or no match is found, your deposit is returned in full.
        </p>
      </div>

      <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Transaction Reference</p>
      <p style="margin:0;font-size:14px;font-family:monospace;color:${BRAND.textSecondary};font-weight:bold;">${details.transactionId.toUpperCase()}</p>

      ${btn("View Job Posting", `${BRAND.url}/dashboard/parent`)}
    </td>
  `);
}

export function escrowReceiptText(name: string, details: { amount: number; hours: number; rate: number; fee: number; transactionId: string }) {
  return `Hi ${name},\n\nYour secure deposit of $${details.amount.toFixed(2)} has been authorized for Kindred Escrow.\n\nCare Hours: ${details.hours}h @ $${details.rate}/hr ($${(details.hours * details.rate).toFixed(2)})\nService Fee: $${details.fee.toFixed(2)}\n\nTransaction ID: ${details.transactionId.toUpperCase()}\n\nFunds are held securely and only released after you approve completed work.\n\nView details: ${BRAND.url}/dashboard/parent`;
}

export function nannyBookingAlertTemplate(
  nannyName: string,
  details: {
    bookingId: string;
    parentPhone: string;
    locationName: string;
    locationDescription: string;
    childCount: number;
    amount: number; // Net earnings in cents
    hiringMode: "hourly" | "retainer";
    startDate: Date;
  }
) {
  const isRetainer = details.hiringMode === "retainer";
  return layout(`
    <td>
      <div style="width:64px;height:64px;background-color:#e8f5e9;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">📅</span>
      </div>
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:${BRAND.color};">New Booking Paid!</h1>
      <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${nannyName}, a family has confirmed and paid for a new booking with you. You can now reach out directly to coordinate arrival.
      </p>

      <div style="background-color:#f9f9f9;border-radius:16px;padding:32px;margin-bottom:32px;border:1px solid #eeeeee;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:16px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Parent Coordination</td>
            <td align="right" style="padding-bottom:16px;font-size:15px;font-weight:800;color:${BRAND.color};">${details.parentPhone}</td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Start Date</td>
            <td align="right" style="padding-bottom:16px;font-size:15px;font-weight:800;color:${BRAND.color};">${details.startDate.toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Care Environment</td>
            <td align="right" style="padding-bottom:16px;font-size:15px;font-weight:800;color:${BRAND.color};">${details.locationName}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:16px;background-color:#ffffff;border-radius:12px;font-size:13px;color:${BRAND.textSecondary};line-height:1.5;font-style:italic;border:1px solid #f0f0f0;">
              <strong>Note:</strong> ${details.locationDescription}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Net Earnings</td>
            <td align="right" style="padding-top:24px;font-size:24px;font-weight:800;color:#2e7d32;">$${(details.amount / 100).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color:#fffdf5;border-radius:12px;padding:20px;border-left:4px solid ${BRAND.accent};margin-bottom:32px;">
        <p style="margin:0;font-size:13px;color:${BRAND.textSecondary};line-height:1.5;">
          <strong>Payout Timing:</strong> Earnings are updated in your wallet upon session completion. For weekly retainers, funds are available for withdrawal every Friday after parent approval.
        </p>
      </div>

      ${btn("View Booking Details", `${BRAND.url}/dashboard/nanny`)}
    </td>
  `);
}

export function nannyBookingAlertText(nannyName: string, details: any) {
  return `Hi ${nannyName}, a new booking has been confirmed!\n\nParent Phone: ${details.parentPhone}\nStart Date: ${details.startDate.toLocaleDateString()}\nEarnings: $${(details.amount / 100).toFixed(2)}\n\nView details: ${BRAND.url}/dashboard/nanny\n\n— KindredCare US`;
}
export function referenceRequestTemplate(nannyName: string, employerName: string, verifyUrl: string) {
  return layout(`
    <td>
      <div style="width:64px;height:64px;background-color:#fef3e8;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">🌟</span>
      </div>
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${BRAND.color};line-height:1.2;">Reference Request for ${nannyName}</h1>
      <p style="margin:0 0 20px;font-size:16px;color:${BRAND.textPrimary};line-height:1.6;">
        Hello ${employerName},
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
        ${nannyName} is applying to join **KindredCare US**, our elite marketplace for high-fidelity childcare. They have listed you as a former employer who can vouch for their professionalism and care.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
        Could you spare 60 seconds to provide a quick verification? Your feedback is crucial for maintaining the safety and quality of our community.
      </p>
      ${btn("Provide Reference", verifyUrl)}
      
      <div style="margin-top:32px;padding:20px;background-color:#f9f9f9;border-radius:12px;border:1px solid #eeeeee;">
         <p style="margin:0;font-size:12px;color:${BRAND.textSecondary};line-height:1.6;">
           <strong>Privacy & Coordination:</strong> This request is part of our standard trust and safety protocol. Your feedback remains confidential and is used solely to verify the professional history of ${nannyName}.
         </p>
         <p style="margin:8px 0 0;font-size:11px;color:#999;line-height:1.6;">
           Please do not reply to this automated message. If you have questions, please visit our website's help center.
         </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#999;line-height:1.6;font-style:italic;">
        KindredCare US uses advanced trust-scoring to verify every caregiver. Your response is confidential and handled with the highest security standards.
      </p>
    </td>
  `);
}

export function referenceRequestText(nannyName: string, employerName: string, verifyUrl: string) {
    return `Hello ${employerName},\n\n${nannyName} is applying to join KindredCare US and has listed you as a reference.\n\nPlease provide your feedback here: ${verifyUrl}\n\nImportant: If you need to discuss this request, please email kindredcareus@gmail.com directly. Do not reply to this automated message.\n\nThank you for helping us maintain a safe community.\n\nKindredCare US`;
}

// ─── 11. Verification Status ───

export function verificationStatusTemplate(name: string, status: "verified" | "rejected", notes?: string) {
  const isVerified = status === "verified";
  return layout(`
    <td>
      <div style="width:64px;height:64px;background-color:${isVerified ? "#e8f5e9" : "#fff3e0"};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:28px;">${isVerified ? "🛡️" : "⚠️"}</span>
      </div>
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:${BRAND.color};line-height:1.2;">
        ${isVerified ? "Dossier Verified!" : "Action Required"}
      </h1>
      <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textSecondary};line-height:1.7;">
        Hi ${name}, your professional verification dossier has been 
        <strong style="color:${isVerified ? "#2e7d32" : BRAND.secondary};">${isVerified ? "approved" : "flagged for review"}</strong>.
      </p>
      
      ${!isVerified && notes ? `
        <div style="background-color:#fffdf5;border-radius:12px;padding:20px;border-left:4px solid ${BRAND.accent};margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${BRAND.textPrimary};text-transform:uppercase;letter-spacing:1px;">Moderator Notes:</p>
          <p style="margin:0;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;font-style:italic;">
            "${notes}"
          </p>
        </div>
      ` : ""}

      <p style="margin:0 0 24px;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">
        ${isVerified 
          ? "You are now an officially verified caregiver in the KindredCare ecosystem. Your profile will now display the Trust & Safety badge, giving families total peace of mind."
          : "Our team noticed a few details that need your attention before we can finalize your verification. Please log in to your dashboard to address the notes above."
        }
      </p>

      ${btn(isVerified ? "Go to Dashboard" : "Fix My Dossier", `${BRAND.url}/dashboard/nanny/verification`)}
      
      <p style="margin:32px 0 0;font-size:12px;color:#999;text-align:center;">
        KindredCare US Trust & Safety Team
      </p>
    </td>
  `);
}

export function verificationStatusText(name: string, status: "verified" | "rejected", notes?: string) {
  const isVerified = status === "verified";
  return `Hi ${name},\n\nYour verification dossier was ${isVerified ? "APPROVED" : "REJECTED"}.\n\n${!isVerified && notes ? `Moderator Notes: "${notes}"\n\n` : ""}Log in to your dashboard to see next steps: ${BRAND.url}/dashboard/nanny/verification\n\n— KindredCare US Trust & Safety`;
}
