const ZEPTO_API_URL = "https://api.zeptomail.eu/v1.1/email";

interface EmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  htmlBody: string;
  textBody: string;
  from?: { email: string; name: string };
  replyTo?: { email: string; name: string };
}

/**
 * Send a transactional email via ZeptoMail.
 * Uses REST API for reliability — no npm dependency needed.
 */
export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.ZEPTO_API_KEY;
  if (!apiKey) {
    console.error("ZEPTO_API_KEY not set — skipping email send");
    return { success: false, error: "No API key" };
  }

  const fromDomain = process.env.ZEPTO_FROM_DOMAIN || "kindredcareus.com";
  const defaultFrom = options.from || {
    email: `noreply@${fromDomain}`,
    name: "KindredCare US",
  };

  const payload = {
    from: { address: defaultFrom.email, name: defaultFrom.name },
    to: options.to.map((r) => ({
      email_address: { address: r.email, name: r.name || "" },
    })),
    subject: options.subject,
    htmlbody: options.htmlBody,
    textbody: options.textBody,
    ...(options.replyTo && {
      reply_to: { address: options.replyTo.email, name: options.replyTo.name },
    }),
    track_clicks: true,
    track_opens: true,
  };

  try {
    const res = await fetch(ZEPTO_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: apiKey.startsWith("Zoho-enczapikey") ? apiKey : `Zoho-enczapikey ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ZeptoMail error:", res.status, err);
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("ZeptoMail send failed:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Convenience wrappers ───

const domain = () => process.env.ZEPTO_FROM_DOMAIN || "kindredcareus.com";

export async function sendOTPEmail(email: string, name: string, otp: string) {
  const { otpEmailTemplate, otpEmailText } = await import("./email-templates");
  return sendEmail({
    to: [{ email, name }],
    subject: `${otp} is your KindredCare verification code`,
    htmlBody: otpEmailTemplate(name, otp),
    textBody: otpEmailText(name, otp),
    from: { email: `noreply@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendWelcomeEmail(email: string, name: string, role: string) {
  const { welcomeEmailTemplate, welcomeEmailText } = await import("./email-templates");
  return sendEmail({
    to: [{ email, name }],
    subject: "Welcome to KindredCare US! 🎉",
    htmlBody: welcomeEmailTemplate(name, role),
    textBody: welcomeEmailText(name, role),
    from: { email: `welcome@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const { passwordResetTemplate, passwordResetText } = await import("./email-templates");
  return sendEmail({
    to: [{ email }],
    subject: "Reset your KindredCare password",
    htmlBody: passwordResetTemplate(email, resetLink),
    textBody: passwordResetText(email, resetLink),
    from: { email: `noreply@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendNewApplicationEmail(
  parentEmail: string, parentName: string,
  nannyName: string, jobTitle: string
) {
  const { newApplicationTemplate, newApplicationText } = await import("./email-templates");
  return sendEmail({
    to: [{ email: parentEmail, name: parentName }],
    subject: `New application for "${jobTitle}"`,
    htmlBody: newApplicationTemplate(parentName, nannyName, jobTitle),
    textBody: newApplicationText(parentName, nannyName, jobTitle),
    from: { email: `notifications@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendApplicationStatusEmail(
  nannyEmail: string, nannyName: string,
  jobTitle: string, status: "accepted" | "rejected"
) {
  const { applicationStatusTemplate, applicationStatusText } = await import("./email-templates");
  const subject = status === "accepted"
    ? `Great news! Your application for "${jobTitle}" was accepted`
    : `Update on your application for "${jobTitle}"`;
  return sendEmail({
    to: [{ email: nannyEmail, name: nannyName }],
    subject,
    htmlBody: applicationStatusTemplate(nannyName, jobTitle, status),
    textBody: applicationStatusText(nannyName, jobTitle, status),
    from: { email: `notifications@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendBookingEmail(
  email: string, name: string,
  type: "confirmed" | "cancelled" | "completed",
  details: { jobTitle?: string; amount?: number; bookingId: string }
) {
  const { bookingEmailTemplate, bookingEmailText } = await import("./email-templates");
  const subjects = {
    confirmed: "Your booking has been confirmed!",
    cancelled: "A booking has been cancelled",
    completed: "Booking completed — payment released!",
  };
  return sendEmail({
    to: [{ email, name }],
    subject: subjects[type],
    htmlBody: bookingEmailTemplate(name, type, details),
    textBody: bookingEmailText(name, type, details),
    from: { email: `bookings@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendSubscriptionSuccessEmail(email: string, name: string) {
  const { subscriptionSuccessTemplate, subscriptionSuccessText } = await import("./email-templates");
  return sendEmail({
    to: [{ email, name }],
    subject: "Welcome to Kindred Premium! 💎",
    htmlBody: subscriptionSuccessTemplate(name),
    textBody: subscriptionSuccessText(name),
    from: { email: `premium@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendEscrowReceiptEmail(
  email: string, name: string,
  details: { amount: number; hours: number; rate: number; fee: number; transactionId: string }
) {
  const { escrowReceiptTemplate, escrowReceiptText } = await import("./email-templates");
  return sendEmail({
    to: [{ email, name }],
    subject: `Receipt: $${details.amount.toFixed(2)} Secure Escrow Deposit`,
    htmlBody: escrowReceiptTemplate(name, details),
    textBody: escrowReceiptText(name, details),
    from: { email: `escrow@${domain()}`, name: "KindredCare US" },
  });
}
export function sendNannyBookingAlert(
  email: string,
  name: string,
  details: {
    bookingId: string;
    parentPhone: string;
    locationName: string;
    locationDescription: string;
    childCount: number;
    amount: number;
    hiringMode: "hourly" | "retainer";
    startDate: Date;
  }
) {
  const { nannyBookingAlertTemplate, nannyBookingAlertText } = require("./email-templates");
  return sendEmail({
    to: [{ email, name }],
    subject: "Action Required: New Paid Booking Coordination!",
    htmlBody: nannyBookingAlertTemplate(name, details),
    textBody: nannyBookingAlertText(name, details),
    from: { email: `bookings@${domain()}`, name: "KindredCare US" },
  });
}

export async function sendReferenceRequestEmail(
  employerEmail: string,
  employerName: string,
  nannyName: string,
  token: string
) {
  const { referenceRequestTemplate, referenceRequestText } = await import("./email-templates");
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.kindredcareus.com"}/references/${token}`;
  
  return sendEmail({
    to: [{ email: employerEmail, name: employerName }],
    subject: `Can you vouch for ${nannyName}? (KindredCare)`,
    htmlBody: referenceRequestTemplate(nannyName, employerName, verifyUrl),
    textBody: referenceRequestText(nannyName, employerName, verifyUrl),
    from: { email: `trust@${domain()}`, name: "KindredCare Trust & Safety" },
  });
}

export async function sendVerificationStatusEmail(
  email: string,
  name: string,
  status: "verified" | "rejected",
  notes?: string
) {
  const { verificationStatusTemplate, verificationStatusText } = await import("./email-templates");
  const subject = status === "verified"
    ? "Verified: Your professional dossier is approved! ✅"
    : "Action Required: Update your verification dossier ⚠️";
    
  return sendEmail({
    to: [{ email, name }],
    subject,
    htmlBody: verificationStatusTemplate(name, status, notes),
    textBody: verificationStatusText(name, status, notes),
    from: { email: `trust@${domain()}`, name: "KindredCare Trust & Safety" },
  });
}

