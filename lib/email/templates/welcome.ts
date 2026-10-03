export function getWelcomeEmailHtml(recipientName?: string, devotionalUrl?: string): string {
  const nameGreeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const readUrl = devotionalUrl || "https://alexanderdbridge.com/devotional";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bridge Daily Devotional</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e5e5; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0a0a0a; border: 1px solid #262626; border-radius: 24px; padding: 40px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td align="left" style="padding-bottom: 24px; border-bottom: 1px solid #1f1f1f;">
              <span style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #ff0000; font-weight: 700;">
                Bridge Daily Devotional
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-top: 28px;">
              <p style="font-size: 17px; font-weight: 600; color: #ffffff; margin: 0 0 16px 0;">
                ${nameGreeting}
              </p>
              
              <p style="font-size: 15px; color: #d4d4d4; margin: 0 0 18px 0; line-height: 1.7;">
                I’m really glad to have you here. ❤️
              </p>

              <p style="font-size: 15px; color: #d4d4d4; margin: 0 0 18px 0; line-height: 1.7;">
                Welcome to Bridge Daily Devotional. This started from a simple desire to help people stay consistent with God and His Word, and I’m grateful that you’ve decided to be part of it.
              </p>

              <p style="font-size: 15px; color: #d4d4d4; margin: 0 0 24px 0; line-height: 1.7;">
                My prayer is that as you read, meditate and practise the Word each day, you will grow stronger in your walk with God and become everything He has called you to be.
              </p>

              <p style="font-size: 15px; font-weight: 500; color: #ffffff; margin: 0 0 28px 0;">
                Welcome to the family. 🙏🏽❤️
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${readUrl}" target="_blank" style="display: inline-block; background-color: #ff0000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; letter-spacing: 0.02em;">
                      Read Today's Devotional &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1f1f1f;">
                <p style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 0;">
                  Alexander D. Bridge
                </p>
                <p style="font-size: 13px; color: #737373; margin: 4px 0 0 0;">
                  Bridge Daily Devotional
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getWelcomeEmailText(recipientName?: string, devotionalUrl?: string): string {
  const nameGreeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const readUrl = devotionalUrl || "https://alexanderdbridge.com/devotional";

  return `${nameGreeting}

I’m really glad to have you here. ❤️

Welcome to Bridge Daily Devotional. This started from a simple desire to help people stay consistent with God and His Word, and I’m grateful that you’ve decided to be part of it.

My prayer is that as you read, meditate and practise the Word each day, you will grow stronger in your walk with God and become everything He has called you to be.

Welcome to the family. 🙏🏽❤️

Read today's devotional: ${readUrl}

Alexander D. Bridge
Bridge Daily Devotional`;
}
