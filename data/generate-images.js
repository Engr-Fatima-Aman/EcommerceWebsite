/**
 * Generates elegant SVG placeholder images for jewellery products.
 * Run once: `node data/generate-images.js`
 */
const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'img', 'products');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Soft palette inspired by warm jewelry tones
const palettes = [
    { bg1: '#f5e9d4', bg2: '#e9c97a', metal: '#b8860b', dark: '#6b4f1d' }, // gold
    { bg1: '#fbeaea', bg2: '#e8c4c4', metal: '#a67878', dark: '#5d3030' }, // rose
    { bg1: '#eef0f3', bg2: '#cfd8e3', metal: '#9aa6b5', dark: '#3d4a5c' }, // silver
    { bg1: '#f3ecf7', bg2: '#d9c5e9', metal: '#8a6db4', dark: '#43306b' }  // lilac
];

function gradientDefs(id, p) {
    return `
    <defs>
      <radialGradient id="${id}-bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%"  stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <linearGradient id="${id}-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${p.metal}"/>
        <stop offset="50%"  stop-color="${p.dark}"/>
        <stop offset="100%" stop-color="${p.metal}"/>
      </linearGradient>
    </defs>`;
}

// ---- Drawings per jewellery type ----
function ring(p) {
    return `
    ${gradientDefs('ring', p)}
    <rect width="600" height="600" fill="url(#ring-bg)"/>
    <ellipse cx="300" cy="380" rx="160" ry="40" fill="#000" opacity="0.08"/>
    <g transform="translate(300 290)">
      <circle r="120" fill="none" stroke="url(#ring-metal)" stroke-width="28"/>
      <polygon points="0,-150 -22,-110 0,-90 22,-110" fill="#ffffff" stroke="url(#ring-metal)" stroke-width="3"/>
      <polygon points="0,-145 -16,-115 0,-95 16,-115" fill="#e8f0ff" opacity="0.7"/>
    </g>`;
}

function necklace(p) {
    return `
    ${gradientDefs('neck', p)}
    <rect width="600" height="600" fill="url(#neck-bg)"/>
    <path d="M 120 140 Q 300 460 480 140"
          stroke="url(#neck-metal)" stroke-width="6" fill="none"/>
    <path d="M 300 400 L 282 440 L 300 480 L 318 440 Z"
          fill="#ffffff" stroke="url(#neck-metal)" stroke-width="3"/>
    <circle cx="300" cy="438" r="6" fill="#e8f0ff"/>`;
}

function earring(p) {
    return `
    ${gradientDefs('ear', p)}
    <rect width="600" height="600" fill="url(#ear-bg)"/>
    <g transform="translate(220 200)">
      <circle r="22" fill="none" stroke="url(#ear-metal)" stroke-width="6"/>
      <line x1="0" y1="22" x2="0" y2="60" stroke="url(#ear-metal)" stroke-width="4"/>
      <polygon points="0,60 -22,100 0,150 22,100" fill="#ffffff" stroke="url(#ear-metal)" stroke-width="3"/>
    </g>
    <g transform="translate(380 200)">
      <circle r="22" fill="none" stroke="url(#ear-metal)" stroke-width="6"/>
      <line x1="0" y1="22" x2="0" y2="60" stroke="url(#ear-metal)" stroke-width="4"/>
      <polygon points="0,60 -22,100 0,150 22,100" fill="#ffffff" stroke="url(#ear-metal)" stroke-width="3"/>
    </g>`;
}

function bracelet(p) {
    return `
    ${gradientDefs('brac', p)}
    <rect width="600" height="600" fill="url(#brac-bg)"/>
    <ellipse cx="300" cy="300" rx="200" ry="120"
             fill="none" stroke="url(#brac-metal)" stroke-width="22"/>
    <ellipse cx="300" cy="300" rx="200" ry="120"
             fill="none" stroke="${p.bg1}" stroke-width="2"/>
    <g fill="#ffffff" stroke="url(#brac-metal)" stroke-width="2">
      <circle cx="100" cy="300" r="10"/>
      <circle cx="500" cy="300" r="10"/>
      <circle cx="300" cy="180" r="10"/>
      <circle cx="300" cy="420" r="10"/>
    </g>`;
}

const items = [
    { file: 'ring-1.svg',     draw: ring,     palette: 0 },
    { file: 'ring-2.svg',     draw: ring,     palette: 2 },
    { file: 'ring-3.svg',     draw: ring,     palette: 1 },
    { file: 'necklace-1.svg', draw: necklace, palette: 0 },
    { file: 'necklace-2.svg', draw: necklace, palette: 1 },
    { file: 'necklace-3.svg', draw: necklace, palette: 3 },
    { file: 'earring-1.svg',  draw: earring,  palette: 2 },
    { file: 'earring-2.svg',  draw: earring,  palette: 0 },
    { file: 'earring-3.svg',  draw: earring,  palette: 1 },
    { file: 'bracelet-1.svg', draw: bracelet, palette: 2 },
    { file: 'bracelet-2.svg', draw: bracelet, palette: 0 },
    { file: 'bracelet-3.svg', draw: bracelet, palette: 1 }
];

for (const item of items) {
    const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
${item.draw(palettes[item.palette])}
</svg>`;
    fs.writeFileSync(path.join(OUT_DIR, item.file), svg);
}

// ---- Hero image ----
const hero =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%"   stop-color="#f7ecd6"/>
      <stop offset="100%" stop-color="#d9b56b"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#fff3c4"/>
      <stop offset="50%" stop-color="#b8860b"/>
      <stop offset="100%" stop-color="#5c3d0a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#bg)"/>
  <g opacity="0.9" transform="translate(820 350)">
    <circle r="180" fill="none" stroke="url(#metal)" stroke-width="42"/>
    <polygon points="0,-230 -34,-170 0,-140 34,-170" fill="#ffffff" stroke="url(#metal)" stroke-width="4"/>
    <polygon points="0,-220 -22,-178 0,-148 22,-178" fill="#f0f6ff" opacity="0.85"/>
  </g>
  <g opacity="0.4">
    <circle cx="200" cy="160" r="3" fill="#ffffff"/>
    <circle cx="350" cy="520" r="2" fill="#ffffff"/>
    <circle cx="600" cy="120" r="4" fill="#ffffff"/>
    <circle cx="100" cy="450" r="2" fill="#ffffff"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(__dirname, '..', 'public', 'img', 'hero.svg'), hero);

// ---- Logo ----
const logo =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#8b6914"/>
    </linearGradient>
  </defs>
  <g transform="translate(20 22)">
    <polygon points="18,0 36,18 18,36 0,18" fill="url(#lg)"/>
    <polygon points="18,8 28,18 18,28 8,18" fill="#fff8e1"/>
  </g>
  <text x="80" y="50"
        font-family="Playfair Display, Georgia, serif"
        font-size="34" font-weight="700" fill="#1a1a1a" letter-spacing="6">RIWAQ</text>
</svg>`;
fs.writeFileSync(path.join(__dirname, '..', 'public', 'img', 'logo.svg'), logo);

console.log('✅ Generated', items.length, 'product images, hero, and logo.');
