import { pythonProjectFiles } from '../data/pythonCodeRepository';

/**
 * Downloads the README as a Microsoft Word compatible HTML document (.doc)
 * with complete Persian typography, RTL styling, tables, code blocks, and colors.
 */
export function downloadReadmeAsWordDoc() {
  const readmeFile = pythonProjectFiles.find(f => f.filename === 'README.md');
  const markdownContent = readmeFile ? readmeFile.content : '';

  // Simple and clean conversion of the markdown to rich Word-compatible HTML
  const lines = markdownContent.split('\n');
  let htmlBody = '';
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        htmlBody += `
          <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-right: 4px solid #0284c7; padding: 12px 16px; margin: 12px 0; font-family: 'Consolas', 'Courier New', monospace; font-size: 10.5pt; direction: ltr; text-align: left; border-radius: 6px;">
            ${codeBuffer.map(c => `<div>${escapeHtml(c)}</div>`).join('')}
          </div>
        `;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      htmlBody += `<h1 style="color: #0f172a; font-size: 20pt; font-family: 'B Nazanin', 'Vazirmatn', Tahoma, Arial; font-weight: bold; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-top: 24px; margin-bottom: 12px;">${escapeHtml(line.replace('# ', ''))}</h1>`;
    } else if (line.startsWith('## ')) {
      htmlBody += `<h2 style="color: #1e293b; font-size: 16pt; font-family: 'B Nazanin', 'Vazirmatn', Tahoma, Arial; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #0369a1;">${escapeHtml(line.replace('## ', ''))}</h2>`;
    } else if (line.startsWith('### ')) {
      htmlBody += `<h3 style="color: #334155; font-size: 13pt; font-family: 'B Nazanin', 'Vazirmatn', Tahoma, Arial; font-weight: bold; margin-top: 16px; margin-bottom: 8px;">${escapeHtml(line.replace('### ', ''))}</h3>`;
    } else if (line.startsWith('---')) {
      htmlBody += `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />`;
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().substring(2);
      htmlBody += `<li style="margin-bottom: 6px; font-size: 11.5pt; color: #334155;">${formatInlineMarkdown(text)}</li>`;
    } else if (/^\d+\.\s/.test(line.trim())) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      htmlBody += `<li style="margin-bottom: 6px; font-size: 11.5pt; color: #334155;">${formatInlineMarkdown(text)}</li>`;
    } else if (line.trim() === '') {
      htmlBody += `<p style="margin: 6px 0;"></p>`;
    } else {
      htmlBody += `<p style="font-size: 11.5pt; line-height: 1.8; color: #1e293b; margin: 8px 0; text-align: justify;">${formatInlineMarkdown(line)}</p>`;
    }
  }

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>راهنمای راه‌اندازی ربات و سیستم فروش اشتراک</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 2.5cm 2cm 2.5cm 2cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'B Nazanin', 'Vazirmatn', 'Tahoma', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          background-color: #ffffff;
          color: #0f172a;
          line-height: 1.8;
          font-size: 12pt;
        }
        b, strong {
          color: #0f172a;
          font-family: 'B Titr', 'B Nazanin', 'Vazirmatn', Tahoma;
        }
        code {
          font-family: 'Consolas', 'Courier New', monospace;
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          color: #0284c7;
          direction: ltr;
          display: inline-block;
          font-size: 10.5pt;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="color: #0284c7; margin: 0; font-size: 22pt;">مستندات و راهنمای جامع راه‌اندازی سیستم</h1>
        <p style="color: #64748b; margin: 8px 0 0 0; font-size: 11pt;">ربات همزمان تلگرام و بله + درگاه پرداخت شاپرک پی‌پینگ + پنل ادمین جنگو</p>
      </div>
      ${htmlBody}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordDocumentHtml], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'README_راهنمای_راه_اندازی.doc';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #0284c7; text-decoration: underline;">$1</a>');
}
