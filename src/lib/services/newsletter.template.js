/**
 * Email-safe HTML Newsletter Compiler for TeachyBlogs
 * Supports: Morning Briefing, Weekly Digest, Breaking Alerts, and Kashmir Edition
 */

export function buildNewsletterHTML({
  campaignTitle,
  edition = 'Global',
  previewText = '',
  intro = '',
  featuredStories = [],
  closing = '',
  unsubscribeUrl = '#',
  preferencesUrl = '#',
  utmCampaign = 'newsletter',
}) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const storiesHtml = featuredStories
    .map((story, idx) => {
      const storyUrl = `${story.url || `https://teachyblogs.com/blogs/${story.slug || ''}`}?utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(
        utmCampaign
      )}`;

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 24px;">
          ${
            story.image
              ? `<tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${storyUrl}" target="_blank" style="text-decoration: none;">
                      <img src="${story.image}" alt="${story.headline || 'Story cover'}" width="100%" style="max-width: 560px; height: auto; border-radius: 8px; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>`
              : ''
          }
          <tr>
            <td>
              ${
                story.desk
                  ? `<span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #dc2626; letter-spacing: 0.05em; display: inline-block; margin-bottom: 4px;">${story.desk}</span>`
                  : ''
              }
              <h3 style="margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; line-height: 1.3; font-weight: bold; color: #18181b;">
                <a href="${storyUrl}" target="_blank" style="color: #18181b; text-decoration: none;">
                  ${story.headline}
                </a>
              </h3>
              ${
                story.excerpt
                  ? `<p style="margin: 0 0 10px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #52525b;">
                      ${story.excerpt}
                    </p>`
                  : ''
              }
              <a href="${storyUrl}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; color: #dc2626; text-decoration: none;">
                Read Story &rarr;
              </a>
            </td>
          </tr>
        </table>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaignTitle || 'TeachyBlogs Morning Briefing'}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- PREHEADER -->
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText || 'Today’s top editorial stories and analysis from TeachyBlogs.'}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- MAIN CONTAINER -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          
          <!-- MASTHEAD -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; background-color: #09090b; border-bottom: 4px solid #dc2626; color: #ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff;">
                      TEACHYBLOGS
                    </h1>
                    <div style="margin-top: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.1em;">
                      ${edition.toUpperCase()} EDITION &bull; ${dateStr.toUpperCase()}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 32px;">
              ${
                intro
                  ? `<div style="margin-bottom: 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #27272a; border-left: 3px solid #dc2626; padding-left: 14px;">
                      ${intro}
                    </div>`
                  : ''
              }

              <!-- STORIES -->
              ${storiesHtml}

              ${
                closing
                  ? `<div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 14px; line-height: 1.5; color: #52525b; font-style: italic;">
                      ${closing}
                    </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #71717a; line-height: 1.5;">
              <p style="margin: 0 0 10px 0;">
                You are receiving this newsletter because you subscribed to TeachyBlogs ${edition} Briefings.
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="${preferencesUrl}" style="color: #18181b; font-weight: bold; text-decoration: underline; margin-right: 12px;">Manage Preferences</a>
                <a href="${unsubscribeUrl}" style="color: #dc2626; font-weight: bold; text-decoration: underline;">Unsubscribe</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} TeachyBlogs Digital Publication. All rights reserved.
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
