import { readFileSync, writeFileSync } from 'fs';

const md = readFileSync('HANDLEIDING.md', 'utf-8');

// Eenvoudige markdown naar HTML conversie
function convert(md) {
  return md
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Horizontale lijn
    .replace(/^---$/gm, '<hr>')
    // H1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // H4
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // Lijsten (ongeordend)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Genummerde lijsten
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Links (inhoudsopgave ankers)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Lege regels → alinea's
    .split(/\n\n+/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<hr') || block.startsWith('<blockquote')) return block;
      if (block.includes('<li>')) {
        return '<ul>' + block + '</ul>';
      }
      return '<p>' + block.replace(/\n/g, ' ') + '</p>';
    })
    .join('\n');
}

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Handleiding MTB Kruibeke</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 50px;
  }
  h1 {
    font-size: 22pt;
    color: #b91c1c;
    border-bottom: 3px solid #b91c1c;
    padding-bottom: 10px;
    margin: 30px 0 20px;
  }
  h1:first-child { margin-top: 0; }
  h2 {
    font-size: 15pt;
    color: #b91c1c;
    margin: 28px 0 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid #fca5a5;
  }
  h3 {
    font-size: 12pt;
    color: #333;
    margin: 18px 0 8px;
    font-weight: 700;
  }
  h4 {
    font-size: 11pt;
    color: #555;
    margin: 14px 0 6px;
    font-weight: 700;
    font-style: italic;
  }
  p { margin: 8px 0; }
  ul { margin: 8px 0 8px 22px; }
  li { margin: 4px 0; }
  hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 30px 0;
  }
  code {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    padding: 1px 5px;
    font-family: monospace;
    font-size: 10pt;
  }
  blockquote {
    border-left: 4px solid #fca5a5;
    background: #fff7f7;
    padding: 10px 16px;
    margin: 12px 0;
    color: #555;
    font-style: italic;
    border-radius: 0 4px 4px 0;
  }
  strong { color: #111; }
  @media print {
    body { padding: 20px 30px; }
    h2 { page-break-before: auto; }
    h1, h2, h3 { page-break-after: avoid; }
    blockquote, ul { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${convert(md)}
</body>
</html>`;

writeFileSync('HANDLEIDING.html', html, 'utf-8');
console.log('HTML aangemaakt: HANDLEIDING.html');
