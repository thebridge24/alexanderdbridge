export function getWelcomeEmailHtml(recipientName?: string, devotionalUrl?: string): string {
  const nameGreeting = recipientName ? `Hey ${recipientName},` : "Hey there,";
  const readUrl = devotionalUrl || "https://alexanderdbridge.com/devotional";
  const profileImageUrl = "https://res.cloudinary.com/glqzvvh2/image/upload/v1791448597/Sos20231224_112632_a87hnk.jpg";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bridge Daily Devotional</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #d4d4d4; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0d0d0d; padding: 20px 20px;">
          
          <!-- Top Header / Logo -->
          <tr>
            <td align="left" style="padding-bottom: 40px;">
              <span style="font-size: 14px; letter-spacing: 0.15em; text-transform: lowercase; color: #ffffff; font-weight: 600;">
                bridge <span style="font-size: 11px; font-weight: 400; color: #a3a3a3; letter-spacing: 0.2em;">daily devotional</span>
              </span>
            </td>
          </tr>

          <!-- Big Headline -->
          <tr>
            <td align="left" style="padding-bottom: 32px;">
              <h1 style="font-size: 56px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: 0.05em; line-height: 1;">
                WELCOME!
              </h1>
            </td>
          </tr>

          <!-- Greeting & Main Message Part 1 -->
          <tr>
            <td align="left" style="padding-bottom: 24px;">
              <p style="font-size: 15px; font-weight: 600; color: #ffffff; margin: 0 0 16px 0;">
                ${nameGreeting}
              </p>
              
              <p style="font-size: 15px; color: #a3a3a3; margin: 0 0 16px 0; line-height: 1.7;">
                I’m really glad to have you here. ❤️
              </p>

              <p style="font-size: 15px; color: #a3a3a3; margin: 0 0 16px 0; line-height: 1.7;">
                Welcome to Bridge Daily Devotional. This started from a simple desire to help people stay consistent with God and His Word, and I’m grateful that you’ve decided to be part of it.
              </p>
            </td>
          </tr>

          <!-- Section Subtitle & CTA Button -->
          <tr>
            <td align="left" style="padding: 12px 0 28px 0;">
              <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #ffffff; font-weight: 800; margin: 0 0 16px 0;">
                WANT TO READ TODAY'S DEVOTIONAL?
              </p>
              
              <a href="${readUrl}" target="_blank" style="display: inline-block; background-color: #ff0000; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 9999px; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">
                EXPLORE MORE
              </a>
            </td>
          </tr>

          <!-- Main Message Part 2 -->
          <tr>
            <td align="left" style="padding-bottom: 36px;">
              <p style="font-size: 15px; color: #a3a3a3; margin: 0 0 16px 0; line-height: 1.7;">
                My prayer is that as you read, meditate and practise the Word each day, you will grow stronger in your walk with God and become everything He has called you to be.
              </p>

              <p style="font-size: 15px; color: #a3a3a3; margin: 0; line-height: 1.7;">
                Welcome to the family. 🙏🏽❤️
              </p>
            </td>
          </tr>

          <!-- Author Profile Section (Circular Image + Name/Title) -->
          <tr>
            <td align="left" style="padding-bottom: 40px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 20px;" valign="middle">
                    <img src="${profileImageUrl}" alt="Alexander D. Bridge" width="90" height="90" style="display: block; border-radius: 50%; object-fit: cover;" />
                  </td>
                  <td valign="middle">
                    <p style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0;">
                      Alexander D. Bridge
                    </p>
                    <p style="font-size: 13px; color: #737373; margin: 0 0 2px 0;">
                      Founder & Author
                    </p>
                    <p style="font-size: 13px; color: #737373; margin: 0;">
                      Bridge Daily Devotional
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider & Unsubscribe -->
          <tr>
            <td align="center" style="border-top: 1px solid #262626; padding-top: 28px;">
              <p style="font-size: 11px; color: #525252; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">
                UNSUBSCRIBE
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

export function getWelcomeEmailText(recipientName?: string, devotionalUrl?: string): string {
  const nameGreeting = recipientName ? `Hey ${recipientName},` : "Hey there,";
  const readUrl = devotionalUrl || "https://alexanderdbridge.com/devotional";

  return `WELCOME!

${nameGreeting}

I’m really glad to have you here. ❤️

Welcome to Bridge Daily Devotional. This started from a simple desire to help people stay consistent with God and His Word, and I’m grateful that you’ve decided to be part of it.

WANT TO READ TODAY'S DEVOTIONAL?
Explore More: ${readUrl}

My prayer is that as you read, meditate and practise the Word each day, you will grow stronger in your walk with God and become everything He has called you to be.

Welcome to the family. 🙏🏽❤️

Alexander D. Bridge
Founder & Author - Bridge Daily Devotional`;
}
