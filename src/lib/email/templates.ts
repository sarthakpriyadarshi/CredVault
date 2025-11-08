/**
 * Email Templates for CredVault
 * Uses inline styles and hosted images for maximum email client compatibility
 * Matches the exact website design
 */

// Get base URL from environment variable (fallback for development)
const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:4300";

// Logo image URL (hosted on domain)
const LOGO_URL = `${BASE_URL}/assets/email/logo.png`;
const LOGO_ALT = "CredVault Logo";

// Icon images from CDN (reliable in email clients)
const ICON_CLOCK = `${BASE_URL}/assets/email/time.png`;
const ICON_LOCK = `${BASE_URL}/assets/email/lock.png`;
const ICON_SMARTPHONE = `${BASE_URL}/assets/email/smartphone.png`;
const ICON_TROPHY = `${BASE_URL}/assets/email/trophy.png`;
const ICON_SHIELD = `${BASE_URL}/assets/email/shield.png`;
const ICON_CHECKMARK = `${BASE_URL}/assets/email/checked.png`;

// Brand colors matching website dark theme CSS (oklch converted to hex)
const C = {
  primary: "#f55971", // oklch(0.70 0.20 15) - Pink/coral for button, links, and accents
  primaryDark: "rgba(245, 89, 113, 0.8)", // primary/80 for gradient end
  primaryForeground: "#2E2D2F", // oklch(0.1797 0.0043 308.1928) - dark text on button
  bg: "#000000", // Pure black background matching website bg-black
  bgGradient:
    "linear-gradient(to bottom right, #18181b 0%, #000000 50%, #18181b 100%)", // Auth page gradient: from-zinc-900 via-black to-zinc-900
  bgFallback: "#0a0a0a", // Fallback solid color approximating the gradient
  primary10: "rgba(245, 89, 113, 0.1)", // Primary color at 10% opacity for decorative elements
  primary5: "rgba(245, 89, 113, 0.05)", // Primary color at 5% opacity for decorative elements
  zinc900: "#18181b", // zinc-900 color for gradient
  cardBg: "#151515", // Darker black for card background (was #2E2E2E which looked grey)
  textPrimary: "#CFCFCF", // oklch(0.8109 0 0) - foreground text
  textSecondary: "#9F9F9F", // oklch(0.6268 0 0) - muted foreground
  textMuted: "#808080", // Muted text (intermediate between secondary and border)
  border: "#404040", // oklch(0.252 0 0) - border color
  borderLight: "#353535", // Slightly lighter border for subtle elements
  buttonBg: "#f55971", // Primary color for button background
  buttonText: "#2E2D2F", // Dark text on button (primary-foreground)
  backdrop: "rgba(46, 45, 47, 0.8)", // background/80 for cards with backdrop
};

interface EmailVerificationData {
  name: string;
  verificationLink: string;
}

interface OrganizationSignupNotificationData {
  organizationName: string;
  organizationEmail: string;
  organizationWebsite?: string;
  adminDashboardLink: string;
}

interface OrganizationApprovalNotificationData {
  organizationName: string;
  issuerName: string;
  issuerLoginLink: string;
}

export function generateVerificationEmail(data: EmailVerificationData): string {
  return `<!DOCTYPE html>
<html lang="en" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Your Email - CredVault</title>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };table-layout:fixed;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<tr><td bgcolor="${
    C.bgFallback
  }" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">Verify Your Email Address</h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Hello <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.name
  }</strong>,</p></td></tr>
<tr><td><p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Thank you for signing up with CredVault! To complete your registration and start using our platform, please verify your email address by clicking the button below.</p></td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.verificationLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Verify Email Address</a>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:20px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_CLOCK}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Important Information</p></td></tr>
</table>
<p style="margin:0;font-size:14px;color:${
    C.textSecondary
  };line-height:1.8;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">• This verification link will expire in <strong style="color:${
    C.textPrimary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">24 hours</strong><br>• If you didn't create an account, you can safely ignore this email<br>• For security reasons, do not share this link with anyone</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 0;"><div style="height:1px;background-color:${
    C.border
  };"></div></td></tr>
<tr><td><p style="margin:0 0 12px;font-size:14px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">If the button doesn't work, copy and paste this link:</p></td></tr>
<tr><td><p style="margin:0;word-break:break-all;font-size:12px;background-color:${
    C.borderLight
  };padding:12px;border-radius:8px;border:1px solid ${
    C.border
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><a href="${
    data.verificationLink
  }" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.verificationLink
  }</a></p></td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Need help? <a href="mailto:support@credvault.app" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Contact Support</a></p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}

interface PasswordResetData {
  name: string;
  resetLink: string;
}

export function generatePasswordResetEmail(data: PasswordResetData): string {
  return `<!DOCTYPE html>
<html lang="en" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Your Password - CredVault</title>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };table-layout:fixed;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<tr><td bgcolor="${
    C.bgFallback
  }" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">Reset Your Password</h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Hello <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.name
  }</strong>,</p></td></tr>
<tr><td><p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">We received a request to reset your password. Click the button below to create a new password for your CredVault account.</p></td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.resetLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Reset Password</a>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:16px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_LOCK}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0;font-size:13px;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><strong style="color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Security Notice:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email and your password will remain unchanged.</p></td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 0;"><div style="height:1px;background-color:${
    C.border
  };"></div></td></tr>
<tr><td><p style="margin:0 0 12px;font-size:14px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">If the button doesn't work, copy and paste this link:</p></td></tr>
<tr><td><p style="margin:0;word-break:break-all;font-size:12px;background-color:${
    C.borderLight
  };padding:12px;border-radius:8px;border:1px solid ${
    C.border
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><a href="${
    data.resetLink
  }" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.resetLink
  }</a></p></td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Need help? <a href="mailto:support@credvault.app" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Contact Support</a></p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}

interface PasswordResetConfirmationData {
  name: string;
  loginLink: string;
  timestamp: string;
}

export function generatePasswordResetConfirmationEmail(
  data: PasswordResetConfirmationData
): string {
  return `<!DOCTYPE html>
<html lang="en" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset Successful - CredVault</title>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };table-layout:fixed;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<tr><td bgcolor="${
    C.bgFallback
  }" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">Password Reset Successful</h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Hello <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.name
  }</strong>,</p></td></tr>
<tr><td><p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Your password has been successfully reset. You can now sign in to your CredVault account using your new password.</p></td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.loginLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Sign In to Your Account</a>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:20px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_CHECKMARK}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Reset Confirmed</p></td></tr>
</table>
<p style="margin:0;font-size:14px;color:${
    C.textSecondary
  };line-height:1.8;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Your password was successfully changed on ${
    data.timestamp
  }. If you did not make this change, please contact our support team immediately to secure your account.</p>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:16px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_SHIELD}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0;font-size:13px;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><strong style="color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Security Tip:</strong> For your security, we recommend using a strong, unique password that you don't use for other accounts.</p></td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Need help? <a href="mailto:support@credvault.app" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Contact Support</a></p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}

interface CredentialIssuedData {
  recipientName: string;
  credentialName: string;
  issuerName: string;
  issuerOrganization: string;
  issuedDate: string;
  credentialId: string;
  viewCredentialLink: string;
  blockchainVerified?: boolean;
}

export function generateCredentialIssuedEmail(
  data: CredentialIssuedData
): string {
  return `<!DOCTYPE html>
<html lang="en" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Credential Issued - CredVault</title>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };table-layout:fixed;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;width:100%;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${C.bgFallback};">
<tr><td bgcolor="${
    C.bgFallback
  }" style="background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">New Credential Issued</h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Congratulations <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.recipientName
  }</strong>!</p></td></tr>
<tr><td><p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">You have been issued a new credential on CredVault. This credential has been added to your digital wallet and is ready to share.</p></td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:24px;text-align:center;">
<div style="display:inline-block;margin-bottom:12px;"><img src="${ICON_TROPHY}" width="48" height="48" style="display:block;" alt="Trophy"></div>
<h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:${
    C.textPrimary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.credentialName
  }</h3>
<p style="margin:0 0 16px;font-size:14px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Issued by ${
    data.issuerOrganization
  }</p>
${
  data.blockchainVerified
    ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background-color:${C.borderLight};border:1px solid ${C.border};border-radius:20px;font-size:12px;color:${C.buttonBg};font-weight:600;margin-top:8px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><img src="${ICON_CHECKMARK}" width="12" height="12" style="display:inline-block;vertical-align:middle;margin:0 6px 0 0;" alt="">Blockchain Verified</div>`
    : ""
}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;padding-top:20px;border-top:1px solid ${
    C.border
  };">
<tr><td style="padding:8px 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:14px;color:${
    C.textMuted
  };text-align:left;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Issuer</td><td style="font-size:14px;color:${
    C.textPrimary
  };font-weight:600;text-align:right;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.issuerName
  }</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:14px;color:${
    C.textMuted
  };text-align:left;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Issued Date</td><td style="font-size:14px;color:${
    C.textPrimary
  };font-weight:600;text-align:right;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.issuedDate
  }</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:14px;color:${
    C.textMuted
  };text-align:left;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Credential ID</td><td style="font-size:14px;color:${
    C.textPrimary
  };font-weight:600;text-align:right;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${data.credentialId.substring(
    0,
    16
  )}...</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.viewCredentialLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">View Credential</a>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:20px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_SMARTPHONE}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">What's Next?</p></td></tr>
</table>
<p style="margin:0;font-size:14px;color:${
    C.textSecondary
  };line-height:1.8;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">• View your credential in your CredVault dashboard<br>• Download as a PDF or image to share<br>• Share your credential link with employers or institutions<br>• Add to your LinkedIn profile or resume</p>
</td></tr>
</table>
</td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:16px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td style="vertical-align:top;padding-right:8px;"><img src="${ICON_SHIELD}" width="20" height="20" style="display:block;" alt=""></td><td><p style="margin:0;font-size:13px;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;"><strong style="color:${
    C.buttonBg
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Security:</strong> This credential is cryptographically signed and ${
    data.blockchainVerified ? "verified on the blockchain" : "securely stored"
  }, ensuring its authenticity and preventing tampering.</p></td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Need help? <a href="mailto:support@credvault.app" style="color:${
    C.buttonBg
  };text-decoration:none;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Contact Support</a></p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}

export function generateOrganizationSignupNotificationEmail(
  data: OrganizationSignupNotificationData
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>New Organization Registration - CredVault</title>
<style>a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}</style>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background-color:${C.bgFallback};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;width:100%;">
<tr><td style="padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">New Organization Registration</h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">A new organization has registered on CredVault and is awaiting your verification.</p></td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:24px;">
<h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:${
    C.textPrimary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.organizationName
  }</h3>
<p style="margin:0 0 8px;font-size:14px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Email: <strong style="color:${
    C.textPrimary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.organizationEmail
  }</strong></p>
${
  data.organizationWebsite
    ? `<p style="margin:0 0 8px;font-size:14px;color:${C.textMuted};font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Website: <strong style="color:${C.textPrimary};font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${data.organizationWebsite}</strong></p>`
    : ""
}
<p style="margin:16px 0 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Status: <span style="color:${
    C.buttonBg
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Pending Verification</span></p>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.adminDashboardLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Review Organization</a>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}

export function generateOrganizationApprovalNotificationEmail(
  data: OrganizationApprovalNotificationData
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Organization Approved - CredVault</title>
<style>a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}</style>
</head>
<body bgcolor="${
    C.bgFallback
  }" style="margin:0;padding:0;background:radial-gradient(circle at 10% 20%, ${
    C.primary10
  } 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${
    C.primary5
  } 0%, transparent 50%), ${C.bgGradient};background-color:${
    C.bgFallback
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">
<center style="width:100%;background-color:${C.bgFallback};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;width:100%;">
<tr><td style="padding:40px 20px;">
<table role="presentation" width="650" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:650px;width:100%;background-color:${
    C.cardBg
  };border:1px solid ${
    C.border
  };border-radius:12px;overflow:hidden;box-shadow:0 8px 16px rgba(0,0,0,0.4);">
<tr><td style="position:relative;background-color:${
    C.cardBg
  };background-image:radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245, 89, 113, 0.12), transparent 70%);padding:48px 32px;text-align:center;border-bottom:1px solid ${
    C.border
  };">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<img src="${LOGO_URL}" alt="${LOGO_ALT}" width="60" height="60" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
<span style="display:inline-block;vertical-align:middle;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Geist Sans',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;">CredVault</span>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:40px 32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center"><h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${
    C.textPrimary
  };letter-spacing:-0.02em;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center;">Organization Approved! </h2></td></tr>
<tr><td><p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Congratulations <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.issuerName
  }</strong>!</p></td></tr>
<tr><td><p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${
    C.textSecondary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Your organization <strong style="color:${
    C.textPrimary
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.organizationName
  }</strong> has been approved by our admin team. You can now start issuing credentials to recipients!</p></td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${
    C.borderLight
  };border:1px solid ${C.border};border-radius:12px;margin:24px 0;">
<tr><td style="padding:24px;text-align:center;">
<div style="display:inline-block;margin-bottom:12px;"><img src="${ICON_CHECKMARK}" width="48" height="48" style="display:block;" alt="Checkmark"></div>
<h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:${
    C.textPrimary
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">${
    data.organizationName
  }</h3>
<p style="margin:0;font-size:14px;color:${
    C.buttonBg
  };font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Verified Organization</p>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:8px 0 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-radius:6px;background:linear-gradient(to bottom,${
    C.primary
  },${
    C.primaryDark
  });border-top:2px solid rgba(255,255,255,0.3);box-shadow:0px 2px 0px 0px rgba(255,255,255,0.3) inset, 0px 4px 8px rgba(0,0,0,0.3), 0px 2px 4px rgba(0,0,0,0.2);">
<a href="${
    data.issuerLoginLink
  }" target="_blank" style="display:inline-block;padding:8px 16px;color:${
    C.buttonText
  };text-decoration:none;font-weight:700;font-size:14px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">Sign In</a>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid ${
    C.border
  };background-color:${C.bg};">
<p style="margin:8px 0;font-size:13px;color:${
    C.textMuted
  };font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,'Geist Sans',Roboto,'Helvetica Neue',Arial,sans-serif;">© ${new Date().getFullYear()} CredVault. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</center>
</body>
</html>`.trim();
}
