import JSZip from 'jszip';
import { pythonProjectFiles } from '../data/pythonCodeRepository';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // 1. Put files directly in root of zip so running "pip install -r requirements.txt" works immediately wherever extracted!
  for (const file of pythonProjectFiles) {
    zip.file(file.path, file.content);
  }

  // Also include files inside 'subscription_project' subfolder in case user prefers a neat folder
  const subFolder = zip.folder('subscription_project');
  if (subFolder) {
    for (const file of pythonProjectFiles) {
      subFolder.file(file.path, file.content);
    }
  }

  // Generate Word Document inside both root and subfolder
  const readmeFile = pythonProjectFiles.find(f => f.filename === 'README.md');
  if (readmeFile) {
    const wordContent = generateWordHtml(readmeFile.content);
    zip.file('README_راهنمای_راه_اندازی.doc', '\ufeff' + wordContent);
    if (subFolder) {
      subFolder.file('README_راهنمای_راه_اندازی.doc', '\ufeff' + wordContent);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subscription_project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateWordHtml(markdown: string): string {
  const lines = markdown.split('\n');
  let html = lines.map(line => {
    if (line.startsWith('# ')) return `<h1 style="color:#0284c7; border-bottom:2px solid #0284c7; padding-bottom:6px;">${line.replace('# ', '')}</h1>`;
    if (line.startsWith('## ')) return `<h2 style="color:#0369a1; margin-top:16px;">${line.replace('## ', '')}</h2>`;
    if (line.startsWith('### ')) return `<h3 style="color:#334155; margin-top:12px;">${line.replace('### ', '')}</h3>`;
    if (line.startsWith('```')) return `<hr/>`;
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return `<li>${line.trim().substring(2)}</li>`;
    return `<p style="margin:6px 0; line-height:1.8;">${line}</p>`;
  }).join('');

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>راهنما</title>
      <style>
        body { font-family: 'B Nazanin', 'Vazirmatn', Tahoma, sans-serif; direction: rtl; text-align: right; line-height: 1.8; }
        code { font-family: 'Consolas', monospace; direction: ltr; display: inline-block; background-color: #f1f5f9; padding: 2px 4px; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;
}
