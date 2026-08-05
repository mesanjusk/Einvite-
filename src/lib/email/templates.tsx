type MagicLinkEmailProps = {
  url: string;
};

export function magicLinkEmailHtml({ url }: MagicLinkEmailProps) {
  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; background:#faf3ea; padding:40px 20px;">
    <div style="max-width:480px;margin:0 auto;background:#fffdf9;border-radius:16px;border:1px solid rgba(201,148,42,0.3);padding:36px;text-align:center;">
      <p style="letter-spacing:0.3em;font-size:11px;color:#c9942a;margin:0 0 12px;">AI WEDDING INVITATION STUDIO</p>
      <h1 style="color:#7a2e2e;font-size:24px;margin:0 0 16px;">Sign in to your studio</h1>
      <p style="color:#6b4a3a;font-size:15px;line-height:1.6;margin:0 0 28px;">
        Click the button below to securely sign in. This link expires in 24 hours.
      </p>
      <a href="${url}" style="display:inline-block;background:#7a2e2e;color:#fdf0e2;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:14px;letter-spacing:0.08em;">
        SIGN IN
      </a>
      <p style="color:#9a8a80;font-size:12px;margin-top:28px;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  </div>`;
}

type RsvpNotificationEmailProps = {
  coupleNames: string;
  guestName: string;
  status: "ACCEPTED" | "DECLINED" | "MAYBE";
  guestCount: number;
  foodPreference?: string | null;
  comment?: string | null;
};

export function rsvpNotificationEmailHtml({
  coupleNames,
  guestName,
  status,
  guestCount,
  foodPreference,
  comment,
}: RsvpNotificationEmailProps) {
  const statusLabel =
    status === "ACCEPTED" ? "is coming! 🎉" : status === "DECLINED" ? "can't make it" : "might come";

  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; background:#faf3ea; padding:40px 20px;">
    <div style="max-width:480px;margin:0 auto;background:#fffdf9;border-radius:16px;border:1px solid rgba(201,148,42,0.3);padding:36px;">
      <p style="letter-spacing:0.3em;font-size:11px;color:#c9942a;margin:0 0 12px;">NEW RSVP · ${coupleNames}</p>
      <h1 style="color:#7a2e2e;font-size:22px;margin:0 0 16px;">${guestName} ${statusLabel}</h1>
      <table style="width:100%;font-size:14px;color:#3a1414;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b4a3a;">Guests</td><td style="padding:6px 0;text-align:right;">${guestCount}</td></tr>
        ${foodPreference ? `<tr><td style="padding:6px 0;color:#6b4a3a;">Food preference</td><td style="padding:6px 0;text-align:right;">${foodPreference}</td></tr>` : ""}
        ${comment ? `<tr><td style="padding:6px 0;color:#6b4a3a;">Comment</td><td style="padding:6px 0;text-align:right;">${comment}</td></tr>` : ""}
      </table>
    </div>
  </div>`;
}
