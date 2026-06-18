#!/usr/bin/env node
/**
 * build-notes.js — v4
 * Converts Obsidian markdown notes into HTML for kanishkez.github.io
 * Uses `marked` for robust markdown parsing with LaTeX protection.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ── Config ─────────────────────────────────────────────────────
const NOTES_DIR = process.argv[2] || '/Users/kanishkk/Library/Mobile Documents/com~apple~CloudDocs/notes';
const OUTPUT_DIR = path.join(__dirname, 'notes');
const DATA_FILE = path.join(OUTPUT_DIR, 'notes-data.js');

// Ordered with RL, RAG, and Transformers on top
const CATEGORIES = [
  {
    id: 'reinforcement_learning',
    title: 'Reinforcement Learning',
    description: 'Policy gradients, value functions, actor critic methods, PPO, GRPO, and post training alignment.',
    notes: [
      { file: 'Introduction to Reinforcement Learning.md', folder: 'Reinforcement Learning' },
      { file: 'Policy Gradient Theorem.md', folder: 'Reinforcement Learning' },
      { file: 'Post-Training.md', folder: 'Reinforcement Learning' },
    ],
  },
  {
    id: 'rag',
    title: 'Retrieval Augmented Generation',
    description: 'Sparse/dense retrieval, vector databases, and knowledge augmented generation systems.',
    notes: [
      { file: 'Retrieval Augmented Generation.md', folder: null },
    ],
  },
  {
    id: 'transformers_llms',
    title: 'Transformers & LLMs',
    description: 'Attention mechanisms, scaling laws, KV caching, MoE, quantization, and LLM optimization.',
    notes: [
      { file: '01 Transformers.md', folder: 'Transformer' },
      { file: '02 GPT BERT and BART.md', folder: 'Transformer' },
      { file: '03 KV Caching.md', folder: 'Transformer' },
      { file: '04 Flash Attention.md', folder: 'Transformer' },
      { file: '05 llm scaling laws.md', folder: 'Transformer' },
      { file: 'Decoding and Sampling Algorithms.md', folder: 'Transformer' },
      { file: 'GPU Optimization.md', folder: 'Transformer' },
      { file: 'Mixture of Experts.md', folder: 'Transformer' },
      { file: 'PEFT.md', folder: 'Transformer' },
      { file: 'Quantization.md', folder: 'Transformer' },
      { file: 'RoPE.md', folder: 'Transformer' },
    ],
  },
  {
    id: 'sequence_models',
    title: 'Sequence & Recurrent Models',
    description: 'Recurrent networks, Seq2Seq, LSTMs, GRUs, and recurrent attention mechanisms.',
    notes: [
      { file: '15 RNNS.md', folder: 'ml' },
      { file: '16 Sequence to Sequence RNNS.md', folder: 'ml' },
      { file: '17 LSTM and GRU.md', folder: 'ml' },
      { file: '18 Bidirectional RNNS.md', folder: 'ml' },
      { file: '19 Attention in RNNS.md', folder: 'ml' },
    ],
  },
  {
    id: 'computer_vision',
    title: 'Computer Vision',
    description: 'Convolutional networks, residual architectures, and visual sequence models.',
    notes: [
      { file: '13 Convolutional Neural Networks.md', folder: 'ml' },
      { file: '14 Residual_Networks.md', folder: 'ml' },
      { file: 'CRNNs and Advanced Computer Vision.md', folder: 'ml' },
    ],
  },
  {
    id: 'deep_learning',
    title: 'Deep Learning Foundations',
    description: 'Neural networks, activation functions, optimization, normalization, and backpropagation mechanics.',
    notes: [
      { file: '07 Neural Networks.md', folder: 'ml' },
      { file: '08 Non Linearity and Activation Functions.md', folder: 'ml' },
      { file: '09 Optimization Algorithms.md', folder: 'ml' },
      { file: '10 Backpropagation.md', folder: 'ml' },
      { file: '11 Normalization.md', folder: 'ml' },
      { file: '12 Activation_Functions.md', folder: 'ml' },
      { file: 'Regularization.md', folder: 'ml' },
    ],
  },
];

// ── LaTeX Protection ───────────────────────────────────────────
// We must protect LaTeX BEFORE markdown parsing to avoid conflicts
// (e.g. `_` in LaTeX being treated as emphasis, `<` as HTML, etc.)

function protectLatex(md) {
  const store = [];
  let idx = 0;

  // 1) Display math: $$ ... $$ (possibly multi-line)
  //    Handle both inline `$$ content $$` and block-style with $$ on own lines
  //    Also absorb trailing punctuation (.,;:!?) immediately following the closing $$
  //    Use [ \t]* instead of \s* to prevent consuming trailing newlines
  md = md.replace(/\$\$([\s\S]*?)\$\$[ \t]*([.,;:!?]*)/g, (match, content, punctuation) => {
    const placeholder = `LATEXDISPLAY${idx}LATEXEND`;
    let latex = content.trim();
    if (punctuation) {
      latex += `\\text{${punctuation}}`;
    }
    store.push({ type: 'display', content: latex });
    idx++;
    return placeholder;
  });

  // 2) Inline math: $...$  (single line, not greedy)
  //    Be careful not to match $$ or currency amounts
  md = md.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g, (match, content) => {
    const placeholder = `LATEXINLINE${idx}LATEXEND`;
    store.push({ type: 'inline', content: content.trim() });
    idx++;
    return placeholder;
  });

  return { md, store };
}

function escapeLatexForHtml(latex) {
  // Escape < and > so the browser doesn't treat them as HTML tags
  // KaTeX handles &lt; and &gt; correctly
  return latex.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function restoreLatex(html, store) {
  for (let i = 0; i < store.length; i++) {
    const item = store[i];
    const safeContent = escapeLatexForHtml(item.content);
    if (item.type === 'display') {
      const replacement = `<span class="math-display">$$${safeContent}$$</span>`;
      // Handle all wrapping variants marked might produce
      html = html.replace(new RegExp(`<p>\\s*LATEXDISPLAY${i}LATEXEND\\s*</p>`, 'g'), () => replacement);
      html = html.replace(new RegExp(`LATEXDISPLAY${i}LATEXEND`, 'g'), () => replacement);
    } else {
      const replacement = `<span class="math-inline">$${safeContent}$</span>`;
      html = html.replace(new RegExp(`LATEXINLINE${i}LATEXEND`, 'g'), () => replacement);
    }
  }
  return html;
}

// ── Image Link Cleanup ─────────────────────────────────────────
// Handle Obsidian-style linked images: [![alt](url)](link)
// and broken Google Image search URLs

function cleanObsidianImages(md) {
  // Pattern: [![alt](imgUrl)](linkUrl) — linked images
  // or [![alt](imgUrl)![alt2](imgUrl2)](linkUrl) — multiple images in a link
  // Just extract the first image and show it
  md = md.replace(/\[!\[([^\]]*)\]\(([^)]+)\)(?:!\[[^\]]*\]\([^)]+\))?\]\([^)]+\)/g, (match, alt, imgUrl) => {
    // Skip Google redirect URLs
    if (imgUrl.includes('google.com/url') || imgUrl.includes('encrypted-tbn0')) {
      // Try to extract the actual image URL
      const realUrl = imgUrl.match(/url=([^&]+)/);
      if (realUrl) {
        imgUrl = decodeURIComponent(realUrl[1]);
      }
    }
    return `![${alt}](${imgUrl})`;
  });

  // Fix unclosed linked images (e.g. [![alt](imgUrl) without a closing link)
  md = md.replace(/\[!\[([^\]]*)\]\(([^)]+)\)/g, '![$1]($2)');

  // Obsidian wiki-style image embeds: ![[filename]]
  md = md.replace(/!\[\[([^\]]+)\]\]/g, (match, filename) => {
    return `![image](images/${encodeURIComponent(filename.trim())})`;
  });

  return md;
}

// ── Configure Marked ───────────────────────────────────────────

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
  mangle: false,
  headerIds: true,
});

// Custom renderer for heading IDs (no hyphens)
const renderer = new marked.Renderer();

renderer.heading = function(token) {
  let parsedText = this.parser.parseInline(token.tokens);
  // Strip any remaining unparsed ** or * characters (e.g. malformed or unclosed bold)
  parsedText = parsedText.replace(/\*\*/g, '').replace(/\*/g, '');

  const rawText = token.text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
  const id = rawText
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/[^\w_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `<h${token.depth} id="${id}">${parsedText}</h${token.depth}>\n`;
};

renderer.code = function({ text, lang }) {
  const langClass = lang ? ` class="language-${lang}"` : '';
  const escapedCode = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre><code${langClass}>${escapedCode}</code></pre>\n`;
};

renderer.codespan = function({ text }) {
  return `<code class="inline-code">${text}</code>`;
};

renderer.table = function({ header, rows }) {
  let headerHtml = '<tr>';
  header.forEach(cell => {
    headerHtml += `<th>${this.parser.parseInline(cell.tokens)}</th>`;
  });
  headerHtml += '</tr>';

  let bodyHtml = '';
  rows.forEach(row => {
    bodyHtml += '<tr>';
    row.forEach(cell => {
      bodyHtml += `<td>${this.parser.parseInline(cell.tokens)}</td>`;
    });
    bodyHtml += '</tr>';
  });

  return `<div class="table-wrapper"><table>
<thead>${headerHtml}</thead>
<tbody>${bodyHtml}</tbody>
</table></div>\n`;
};

renderer.image = function({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : '';
  const caption = text ? `<figcaption>${text}</figcaption>` : '';
  return `<figure><img src="${href}" alt="${text || ''}" loading="lazy"${titleAttr}>${caption}</figure>`;
};

marked.use({ renderer });

// ── Convert Markdown ───────────────────────────────────────────

function removeStrayAsterisks(html) {
  const parts = html.split(/(<pre>[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<pre>') || parts[i].startsWith('<code')) {
      continue;
    }
    parts[i] = parts[i].replace(/\*\*/g, '');
  }
  return parts.join('');
}

function convertNote(rawMd) {
  // Step 1: Clean Obsidian-specific syntax
  let md = cleanObsidianImages(rawMd);

  // Step 2: Remove hyphens from all heading lines
  md = md.split('\n').map(line => {
    if (line.trim().startsWith('#')) {
      return line.replace(/-/g, ' ');
    }
    return line;
  }).join('\n');

  // Step 3: Protect LaTeX from markdown parser
  const { md: protectedMd, store } = protectLatex(md);

  // Step 4: Parse markdown with marked
  let html = marked.parse(protectedMd);

  // Step 5: Restore LaTeX
  html = restoreLatex(html, store);

  // Step 6: Clean up
  // Remove empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  // Fix display math wrapped in paragraphs
  html = html.replace(/<p>(<span class="math-display">)/g, '$1');
  html = html.replace(/(<\/span>)<\/p>/g, '$1');
  // Fix figures wrapped in paragraphs
  html = html.replace(/<p>(<figure>)/g, '$1');
  html = html.replace(/(<\/figure>)<\/p>/g, '$1');

  // Step 7: Remove stray asterisks from non-code segments
  html = removeStrayAsterisks(html);

  return html;
}

// ── Heading Extraction ─────────────────────────────────────────

function extractHeadings(md) {
  const headings = [];
  // Remove code blocks and latex first
  const cleaned = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^\$\n]+?\$/g, '');

  for (const line of cleaned.split('\n')) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      const text = m[2].replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/-/g, ' ');
      headings.push({
        level: m[1].length,
        text,
        id: text.toLowerCase().replace(/[-\s]+/g, '_').replace(/[^\w_]/g, '').replace(/_+/g, '_').replace(/^_+|_+$/g, ''),
      });
    }
  }
  return headings;
}

function titleCase(str) {
  const minorWords = new Set(['to', 'and', 'in', 'of', 'a', 'the', 'for', 'with', 'by', 'on', 'at', 'is', 'an', 'as']);
  const acronyms = {
    'llm': 'LLM',
    'llms': 'LLMs',
    'rag': 'RAG',
    'rl': 'RL',
    'rnn': 'RNN',
    'rnns': 'RNNs',
    'kv': 'KV',
    'peft': 'PEFT',
    'gpt': 'GPT',
    'bert': 'BERT',
    'bart': 'BART',
    'gpu': 'GPU',
    'moe': 'MoE',
    'rope': 'RoPE',
    'crnn': 'CRNN',
    'crnns': 'CRNNs',
    'lstm': 'LSTM',
    'gru': 'GRU',
    'cnn': 'CNN',
    'cnns': 'CNNs',
  };

  return str
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (acronyms[lower]) {
        return acronyms[lower];
      }
      if (index === 0 || !minorWords.has(lower)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return lower;
    })
    .join(' ');
}

function cleanTitle(filename) {
  const raw = filename.replace(/\.md$/, '').replace(/^\d+\s+/, '').replace(/_/g, ' ').replace(/-/g, ' ');
  return titleCase(raw);
}

// Slugs generated without hyphens (use underscores)
function slugify(filename) {
  return filename.replace(/\.md$/, '').toLowerCase()
    .replace(/[-\s]+/g, '_').replace(/[^\w_]/g, '').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

// ── HTML Template ──────────────────────────────────────────────

function generateNotePage(note, category, prev, next) {
  const headings = note.headings.filter(h => h.level >= 2 && h.level <= 3);

  const tocHtml = headings.length > 1
    ? `<nav class="note-toc" id="note-toc">
        <div class="toc-title">Table of Contents</div>
        <div class="toc-items">
          ${headings.map(h =>
            `<a href="#${h.id}" class="toc-item toc-h${h.level}">${h.text}</a>`
          ).join('\n          ')}
        </div>
      </nav>`
    : '';

  const prevLink = prev
    ? `<a href="${prev.slug}.html" class="nav-prev"><span class="nav-label">Previous</span><span class="nav-title">← ${prev.title}</span></a>`
    : '<span></span>';
  const nextLink = next
    ? `<a href="${next.slug}.html" class="nav-next"><span class="nav-label">Next</span><span class="nav-title">${next.title} →</span></a>`
    : '<span></span>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${note.title} — kanishk's notes</title>
  <meta name="description" content="${note.title} — ${category.title} notes by kanishk" />
  <link rel="icon" type="image/png" href="../assets/favicon.png" />
  <link rel="stylesheet" href="../css/style.css?v=2" />
  <link rel="stylesheet" href="../css/notes.css?v=2" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous" />
</head>
<body>
<canvas id="ambient-canvas"></canvas>
 
<!-- Top Floating Navigation Bar -->
<header class="navbar">
  <div class="nav-container">
    <a href="../index.html" class="nav-logo">kanishk</a>
    <nav class="nav-links">
      <a href="../index.html#home">Home</a>
      <a href="../index.html#projects">Projects</a>
      <a href="../index.html#blogs">Blogs</a>
      <a href="../index.html#notes" class="active">Notes</a>
    </nav>
    <div class="nav-socials">
      <a href="https://github.com/kanishkez" target="_blank" rel="noopener">GitHub</a>
      <a href="https://huggingface.co/kanishkez" target="_blank" rel="noopener">HuggingFace</a>
    </div>
  </div>
</header>
 
<div class="container">
  <main class="main-content">
    <article class="note-page">
      <div class="note-breadcrumb">
        <a href="../index.html#notes">Notes</a>
        <span class="breadcrumb-sep">›</span>
        <a href="../index.html#notes">${category.title}</a>
        <span class="breadcrumb-sep">›</span>
        <span>${note.title}</span>
      </div>

      <header class="note-header">
        <div class="note-category-tag">${category.title}</div>
        <h1>${note.title}</h1>
      </header>

      ${tocHtml}

      <div class="note-content" id="note-content">
        ${note.html}
      </div>

      <nav class="note-nav-bottom">
        ${prevLink}
        ${nextLink}
      </nav>
    </article>
  </main>
</div>

<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"
  onload="renderMathInElement(document.getElementById('note-content'), {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false}
    ],
    throwOnError: false,
    trust: true,
    strict: false
  });"></script>
<script>
(function initAmbientBackground() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
  
  const particles = [];
  const particleCount = Math.min(60, Math.floor((width * height) / 20000));
  const connectionDistance = 120;
  
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.radius = Math.random() * 1.2 + 0.6;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(126, 247, 201, 0.4)';
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < connectionDistance) {
          const alpha = (1 - (dist / connectionDistance)) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = "rgba(126, 247, 201, " + alpha + ")";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
</script>
</body>
</html>`;
}

// ── Main Build ─────────────────────────────────────────────────

function build() {
  console.log('🔨 Building notes (v4)...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Copy images from source vault to notes/images/
  const srcImagesDir = path.join(NOTES_DIR, 'images');
  const destImagesDir = path.join(OUTPUT_DIR, 'images');
  if (fs.existsSync(srcImagesDir)) {
    if (!fs.existsSync(destImagesDir)) {
      fs.mkdirSync(destImagesDir, { recursive: true });
    }
    try {
      const images = fs.readdirSync(srcImagesDir);
      let copiedCount = 0;
      images.forEach(img => {
        const srcImgPath = path.join(srcImagesDir, img);
        const destImgPath = path.join(destImagesDir, img);
        if (fs.statSync(srcImgPath).isFile()) {
          fs.copyFileSync(srcImgPath, destImgPath);
          copiedCount++;
        }
      });
      console.log(`🖼️  Copied ${copiedCount} images to ${destImagesDir}`);
    } catch (err) {
      console.error(`⚠️  Failed to copy images: ${err.message}`);
    }
  }

  const allCategories = [];
  let totalNotes = 0;
  let errors = 0;

  for (const category of CATEGORIES) {
    console.log(`📁 ${category.title}`);
    const notes = [];

    for (const item of category.notes) {
      const filepath = item.folder
        ? path.join(NOTES_DIR, item.folder, item.file)
        : path.join(NOTES_DIR, item.file);

      if (!fs.existsSync(filepath)) {
        console.warn(`  ⚠️  Missing: ${item.file}`);
        errors++;
        continue;
      }

      try {
        const rawMd = fs.readFileSync(filepath, 'utf-8');
        const title = cleanTitle(item.file);
        const slug = slugify(item.file);
        const html = convertNote(rawMd);
        const headings = extractHeadings(rawMd);

        notes.push({ title, slug, html, headings, filename: item.file });
        console.log(`  ✓ ${title}`);
        totalNotes++;
      } catch (err) {
        console.error(`  ✗ ${item.file}: ${err.message}`);
        errors++;
      }
    }

    // Generate individual pages
    for (let i = 0; i < notes.length; i++) {
      const page = generateNotePage(
        notes[i], category,
        i > 0 ? notes[i - 1] : null,
        i < notes.length - 1 ? notes[i + 1] : null
      );
      fs.writeFileSync(path.join(OUTPUT_DIR, `${notes[i].slug}.html`), page, 'utf-8');
    }

    allCategories.push({
      id: category.id,
      title: category.title,
      description: category.description,
      notes: notes.map(n => ({ title: n.title, slug: n.slug })),
    });
  }

  // Write data file for the index page
  const dataJs = `// Auto-generated by build-notes.js\nconst NOTES_DATA = ${JSON.stringify(allCategories, null, 2)};`;
  fs.writeFileSync(DATA_FILE, dataJs, 'utf-8');

  console.log(`\n✅ Built ${totalNotes} notes across ${allCategories.length} categories`);
  if (errors > 0) console.log(`⚠️  ${errors} errors`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
}

build();
