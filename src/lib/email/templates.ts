import "server-only";

const WRAPPER = (inner: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0B0B0B;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;color:#F5F1E8;">
      <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #262626;">
        <span style="font-size:26px;letter-spacing:0.35em;color:#C8A96B;">RA</span>
      </div>
      <div style="padding:32px 8px;font-size:16px;line-height:1.6;color:#A8A39A;">
        ${inner}
      </div>
      <div style="padding-top:24px;border-top:1px solid #262626;text-align:center;font-size:12px;color:#6E6A62;">
        RA Fragrances — Own Your Presence.
      </div>
    </div>
  </body>
</html>`;

export function verificationEmail(link: string) {
  const text = `Verify your RA account by opening this link: ${link}\n\nThis link expires in 24 hours. If you did not create an account, you can safely ignore this email.`;
  return {
    subject: "Verify your RA account",
    text,
    html: WRAPPER(
      `<p>Welcome to RA.</p>
       <p>Please confirm your email address to finish setting up your account.</p>
       <p><a href="${link}" style="display:inline-block;padding:12px 28px;background:#C8A96B;color:#0B0B0B;text-decoration:none;letter-spacing:0.12em;">VERIFY EMAIL</a></p>
       <p style="font-size:13px;color:#6E6A62;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>`,
    ),
  };
}

export function passwordResetEmail(link: string) {
  const text = `Reset your RA password by opening this link: ${link}\n\nThis link expires in 1 hour. If you did not request a reset, you can safely ignore this email.`;
  return {
    subject: "Reset your RA password",
    text,
    html: WRAPPER(
      `<p>We received a request to reset your password.</p>
       <p><a href="${link}" style="display:inline-block;padding:12px 28px;background:#C8A96B;color:#0B0B0B;text-decoration:none;letter-spacing:0.12em;">RESET PASSWORD</a></p>
       <p style="font-size:13px;color:#6E6A62;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>`,
    ),
  };
}
