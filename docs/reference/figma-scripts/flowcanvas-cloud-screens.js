// Flowcanvas · cloud workspace screens (32–37) + cloud patch for existing screens
// Paste into Scripter and run inside the Flowcanvas file AFTER flowcanvas-screens.js.
// Adds screens next to the existing ones; re-running replaces only screens 32–37.

(async () => {
  const IN_SCRIPTER = typeof print === 'function';
  const log = m => (IN_SCRIPTER ? print(m) : console.log(m));

  try {
    // ════════════════════ SETUP ════════════════════
    const setPage = async p => { if (figma.setCurrentPageAsync) await figma.setCurrentPageAsync(p); else figma.currentPage = p; };
    const FONTS = [['Inter', 'Regular'], ['Inter', 'Medium'], ['Inter', 'Semi Bold'], ['JetBrains Mono', 'Regular'], ['JetBrains Mono', 'Medium']];
    await Promise.all(FONTS.map(([family, style]) => figma.loadFontAsync({ family, style })));

    // Muted Graphite palette: neutral shades of each hue
    const HEX = {
      'surface/canvas': '#0B0C0E', 'surface/panel': '#111317', 'surface/raised': '#181B20', 'surface/hover': '#1E2228', 'surface/selected': '#252A31', 'surface/inverse': '#E6E8EB',
      'border/subtle': '#2C323A', 'border/control': '#383F49', 'border/strong': '#4A525E',
      'text/primary': '#EDEFF2', 'text/secondary': '#A3AAB5', 'text/tertiary': '#6B7380', 'text/on-accent': '#0B0C0E',
      'accent/solid': '#7487AD', 'accent/hover': '#8496BB', 'accent/tint': '#182031', 'accent/ring': '#34405A', 'accent/text': '#A9B7D3',
      'state/added/solid': '#6E9C82', 'state/added/tint': '#18221D', 'state/added/text': '#9FC2AD',
      'state/modified/solid': '#B39B6B', 'state/modified/tint': '#24211A', 'state/modified/text': '#D2BE93',
      'state/removed/solid': '#B07473', 'state/removed/tint': '#261B1B', 'state/removed/text': '#CFA09F',
      'state/affected/solid': '#8C83B0', 'state/affected/tint': '#1F1D29', 'state/affected/text': '#B5AED3',
      'state/scope/solid': '#A97A96', 'state/scope/tint': '#251C22', 'state/scope/text': '#C9A3BA',
      'edge/observed': '#A3AAB5', 'edge/default': '#6B7380',
      'preview/surface': '#FFFFFF', 'preview/ink': '#1F2328', 'preview/muted': '#6E7781', 'preview/line': '#E5E7EB', 'preview/brand': '#1F2328'
    };
    const hx = n => HEX[n];
    const rgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });

    // Update or create variables so every bound colour follows the new palette
    let VARS = [];
    try {
      if (figma.variables && figma.variables.getLocalVariablesAsync) VARS = await figma.variables.getLocalVariablesAsync();
      else if (figma.variables && figma.variables.getLocalVariables) VARS = figma.variables.getLocalVariables();
    } catch (e) { VARS = []; }
    const varByName = name => VARS.find(v => v.name === name);
    try {
      const anchor = varByName('surface/canvas');
      if (anchor && figma.variables) {
        const coll = figma.variables.getVariableCollectionByIdAsync ? await figma.variables.getVariableCollectionByIdAsync(anchor.variableCollectionId) : figma.variables.getVariableCollectionById(anchor.variableCollectionId);
        const mode = coll.modes[0].modeId;
        for (const [name, h] of Object.entries(HEX)) {
          let v = varByName(name);
          if (!v) {
            v = figma.variables.createVariable(name, coll, 'COLOR');
            v.scopes = name.startsWith('text/') ? ['TEXT_FILL', 'SHAPE_FILL'] : name.startsWith('border/') ? ['STROKE_COLOR'] : ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'];
            VARS.push(v);
          }
          v.setValueForMode(mode, rgb(h));
        }
      }
    } catch (e) { log('Note: could not update variables (' + e.message + '); using direct colours.'); }

    const paint = (name, opacity = 1) => {
      const base = { type: 'SOLID', color: rgb(HEX[name] || '#FF00FF'), opacity };
      const v = varByName(name);
      if (v && figma.variables && figma.variables.setBoundVariableForPaint) {
        const bound = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: base.color }, 'color', v);
        return Object.assign({}, bound, { opacity });
      }
      return base;
    };

    const STYLE_DEFS = [
      ['Display', 'Inter', 'Semi Bold', 24, 32, -1.5], ['Title', 'Inter', 'Semi Bold', 20, 28, -1], ['Heading', 'Inter', 'Semi Bold', 15, 22, -1],
      ['Body', 'Inter', 'Regular', 13, 20, 0], ['Body strong', 'Inter', 'Medium', 13, 20, 0],
      ['Small', 'Inter', 'Regular', 12, 16, 0], ['Small strong', 'Inter', 'Medium', 12, 16, 0], ['Caption', 'Inter', 'Medium', 11, 14, 0],
      ['Mono', 'JetBrains Mono', 'Regular', 12, 18, 0], ['Mono small', 'JetBrains Mono', 'Regular', 11, 16, 0]
    ];
    const existingStyles = figma.getLocalTextStylesAsync ? await figma.getLocalTextStylesAsync() : figma.getLocalTextStyles();
    const S = {};
    for (const [name, family, style, size, lh, ls] of STYLE_DEFS) {
      let s = existingStyles.find(x => x.name === name);
      if (!s) { s = figma.createTextStyle(); s.name = name; }
      s.fontName = { family, style }; s.fontSize = size; s.lineHeight = { unit: 'PIXELS', value: lh }; s.letterSpacing = { unit: 'PERCENT', value: ls };
      S[name] = s.id;
    }

    // ════════════════════ HELPERS ════════════════════
    async function T(chars, style, color) {
      const t = figma.createText();
      if (t.setTextStyleIdAsync) await t.setTextStyleIdAsync(S[style]); else t.textStyleId = S[style];
      t.characters = chars; t.fills = [paint(color)]; return t;
    }
    function AL(dir, name, o = {}) {
      const f = figma.createFrame(); f.name = name || 'Stack';
      f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.fills = []; f.clipsContent = false;
      f.itemSpacing = o.gap || 0;
      let p = [0, 0, 0, 0];
      if (o.pad != null) p = Array.isArray(o.pad) ? (o.pad.length === 2 ? [o.pad[0], o.pad[1], o.pad[0], o.pad[1]] : o.pad) : [o.pad, o.pad, o.pad, o.pad];
      f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
      if (o.align) f.counterAxisAlignItems = o.align;
      if (o.justify) f.primaryAxisAlignItems = o.justify;
      if (o.fill) f.fills = [paint(o.fill, o.fillOpacity == null ? 1 : o.fillOpacity)];
      if (o.radius != null) f.cornerRadius = o.radius;
      if (o.stroke) { f.strokes = [paint(o.stroke)]; f.strokeWeight = o.strokeWeight || 1; f.strokeAlign = 'INSIDE'; }
      return f;
    }
    const fixSize = (f, w, h) => { f.resize(w, h); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; return f; };
    const fixW = (f, w) => { f.resize(w, Math.max(f.height, 1)); if (f.layoutMode === 'VERTICAL') { f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'AUTO'; } else { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; } return f; };
    const put = (parent, child, h, v) => { parent.appendChild(child); if (h) child.layoutSizingHorizontal = h; if (v) child.layoutSizingVertical = v; return child; };
    const spacer = parent => { const s = figma.createFrame(); s.name = 'Spacer'; s.fills = []; s.resize(1, 1); parent.appendChild(s); s.layoutGrow = 1; return s; };
    const gapBox = (parent, h) => { const s = figma.createFrame(); s.name = 'Gap'; s.fills = []; s.resize(1, h); parent.appendChild(s); return s; };
    const side = (f, sides, color = 'border/subtle') => {
      f.strokes = [paint(color)]; f.strokeAlign = 'INSIDE';
      f.strokeTopWeight = sides.includes('t') ? 1 : 0; f.strokeRightWeight = sides.includes('r') ? 1 : 0;
      f.strokeBottomWeight = sides.includes('b') ? 1 : 0; f.strokeLeftWeight = sides.includes('l') ? 1 : 0;
    };
    const ICON = (inner, color = hx('text/tertiary'), size = 16, sw = 1.5) => {
      const n = figma.createNodeFromSvg(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${color}" stroke-width="${(sw * 24 / size).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`);
      n.name = 'Icon'; n.fills = []; return n;
    };
    const dot = (color, size = 6) => { const e = figma.createEllipse(); e.name = 'Dot'; e.resize(size, size); e.fills = [paint(color)]; return e; };
    async function kbd(text) { const k = AL('HORIZONTAL', 'Kbd', { pad: [1, 5], radius: 3, stroke: 'border/control', align: 'CENTER' }); k.appendChild(await T(text, 'Mono small', 'text/tertiary')); return k; }
    async function wrapT(parent, chars, style, color, width) { const t = await T(chars, style, color); parent.appendChild(t); t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FIXED'; t.resize(width, t.height); return t; }
    async function fixedT(chars, style, color, width, align) { const t = await T(chars, style, color); t.textAutoResize = 'HEIGHT'; t.resize(width, t.height); if (align) t.textAlignHorizontal = align; return t; }
    const colorRange = (t, re, color) => { let m; const r = new RegExp(re.source, 'g'); while ((m = r.exec(t.characters))) { if (m[0].length) t.setRangeFills(m.index, m.index + m[0].length, [paint(color)]); } };
    async function toggle(on) {
      const f = fixSize(AL('HORIZONTAL', on ? 'Toggle · on' : 'Toggle · off', { pad: 2, radius: 8, fill: on ? 'accent/solid' : 'surface/selected', align: 'CENTER', justify: on ? 'MAX' : 'MIN' }), 28, 16);
      const k = figma.createEllipse(); k.resize(12, 12); k.fills = [paint(on ? 'text/on-accent' : 'text/tertiary')]; f.appendChild(k); return f;
    }
    function meter(width, pct, color = 'text/secondary') {
      const f = figma.createFrame(); f.name = 'Meter'; f.resize(width, 4); f.cornerRadius = 2; f.fills = [paint('surface/selected')];
      const b = figma.createRectangle(); b.resize(Math.max(2, Math.round(width * pct)), 4); b.cornerRadius = 2; b.fills = [paint(color)]; f.appendChild(b); return f;
    }
    async function avatar(initials, size = 24, color = 'surface/selected') {
      const a = fixSize(AL('HORIZONTAL', 'Avatar', { align: 'CENTER', justify: 'CENTER', radius: size / 2, fill: color }), size, size);
      a.appendChild(await T(initials, size >= 40 ? 'Body strong' : 'Caption', 'text/secondary')); return a;
    }
    async function input(width, value, o = {}) {
      const f = fixSize(AL('HORIZONTAL', 'Input', { gap: 8, pad: [0, 10], align: 'CENTER', radius: 4, fill: 'surface/raised', stroke: o.focus ? 'accent/solid' : 'border/control' }), width, o.h || 32);
      if (o.icon) f.appendChild(ICON(o.icon, hx('text/tertiary'), 14));
      f.appendChild(await T(value, o.mono ? 'Mono small' : 'Small', o.placeholder ? 'text/tertiary' : 'text/primary'));
      if (o.trailing) { spacer(f); f.appendChild(o.trailing); }
      return f;
    }

    const I = {
      chevDown: '<path d="M6 9l6 6 6-6"/>', chevRight: '<path d="M9 6l6 6-6 6"/>', chevLeft: '<path d="M15 6l-6 6 6 6"/>',
      branch: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-12 5"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
      grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
      flask: '<path d="M9 3h6M10 3v6l-5 9.5A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-2.5L14 9V3"/>',
      bug: '<rect x="7.5" y="8" width="9" height="12" rx="4.5"/><path d="M4 13h3.5M16.5 13H20M5 7l3 2M19 7l-3 2M12 8v12"/>',
      puzzle: '<path d="M9 4h4v3a2 2 0 1 0 4 0V4h3v16H4V9h3a2 2 0 1 0 0-4H4"/>',
      gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
      screen: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9h18"/>', route: '<path d="M4 12h15M14 7l5 5-5 5"/>',
      clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>', bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
      code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
      alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>',
      clip: '<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7"/>',
      cursor: '<path d="M5 3l14 8.5-6 1.5-3 6z"/>', hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-2L8 14"/>',
      comment: '<path d="M4 5h16v11H9l-5 4z"/>', frame: '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>',
      folder: '<path d="M3 6.5h6l2 2h10V19H3z"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
      terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 10l3 2.5L7 15M12 15h5"/>',
      play: '<path d="M7 5l12 7-12 7z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
      stepOver: '<path d="M4 14a8 8 0 0 1 15-3M19 5v6h-6"/><circle cx="12" cy="18" r="1.5"/>', stepInto: '<path d="M12 4v11M7 10l5 5 5-5"/><circle cx="12" cy="20" r="1.2"/>',
      stepOut: '<path d="M12 15V4M7 9l5-5 5 5"/><circle cx="12" cy="20" r="1.2"/>', restart: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
      phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>', chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
      layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>', more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
      refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 13a8 8 0 0 0 14.5 4M5 3v4h4M19 21v-4h-4"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
      pr: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7M18 15.5V9a3 3 0 0 0-3-3h-4M13 4l-2 2 2 2"/>',
      doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>', spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
      upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>', logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
      card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
      shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', robot: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6"/>',
      keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>', spinner: '<path d="M12 3a9 9 0 1 0 9 9"/>', circle: '<circle cx="12" cy="12" r="7"/>'
    };

    // ════════════════════ PAGES (additive) ════════════════════
    const compPage = figma.root.children.find(p => p.name === 'Components');
    const scrPage = figma.root.children.find(p => p.name === 'Screens');
    if (!compPage || !scrPage) throw new Error('This file needs pages named "Components" and "Screens".');
    await setPage(compPage);
    const findSet = name => { const s = compPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === name); if (!s) throw new Error(`Component set "${name}" not found. Run flowcanvas-screens.js first.`); return s; };
    const tagSet = findSet('Tag'), btnSet = findSet('Button'), nodeSet = findSet('Flow node');
    const keyOf = (set, prefix) => { const k = Object.keys(set.componentPropertyDefinitions).find(k => k.split('#')[0] === prefix); if (!k) throw new Error(`Property "${prefix}" missing on ${set.name}`); return k; };
    const TAG_LABEL = keyOf(tagSet, 'Label'), BTN_LABEL = keyOf(btnSet, 'Label'), N_TITLE = keyOf(nodeSet, 'Title'), N_PATH = keyOf(nodeSet, 'Path');
    const variant = (set, name, fallback) => set.children.find(c => c.name === name) || set.children.find(c => c.name === fallback);
    const tag = (tone, label) => { const i = variant(tagSet, `Tone=${tone}`, 'Tone=Neutral').createInstance(); i.setProperties({ [TAG_LABEL]: label }); return i; };
    const button = (kind, label) => { const i = variant(btnSet, `Kind=${kind}`, 'Kind=Secondary').createInstance(); i.setProperties({ [BTN_LABEL]: label }); return i; };
    const flowNode = (state, title, path) => { const i = variant(nodeSet, `State=${state}`, 'State=Default').createInstance(); i.setProperties({ [N_TITLE]: title, [N_PATH]: path }); return i; };
    await setPage(scrPage);
    const NEW_PREFIXES = ['32 ·', '33 ·', '34 ·', '35 ·', '36 ·', '37 ·'];
    scrPage.children.slice().forEach(n => { if (NEW_PREFIXES.some(p => n.name.startsWith(p))) n.remove(); });
    // ════════════════════ SCREEN FRAMEWORK ════════════════════
    let SLOT = scrPage.children.filter(n => n.type === 'FRAME').length;
    function screen(name, centered) {
      const f = figma.createFrame(); f.name = name; f.resize(1440, 900);
      f.layoutMode = 'VERTICAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
      if (centered) { f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER'; }
      f.fills = [paint('surface/canvas')]; f.clipsContent = true;
      const i = SLOT++; f.x = (i % 4) * 1560; f.y = Math.floor(i / 4) * 1060; return f;
    }
    const markSvg = () => { const m = figma.createNodeFromSvg(`<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.75" y="1.75" width="9" height="9" rx="2" stroke="${hx('text/primary')}" stroke-width="1.5"/><rect x="7.25" y="7.25" width="9" height="9" rx="2" fill="${hx('text/primary')}"/></svg>`); m.name = 'Mark'; m.fills = []; return m; };

    async function topBar(root, o = {}) {
      const top = fixSize(AL('HORIZONTAL', 'Top bar', { gap: 12, pad: [0, 12], align: 'CENTER', fill: 'surface/panel' }), 1440, 40);
      put(root, top, 'FILL', 'FIXED'); side(top, 'b');
      top.appendChild(markSvg());
      const crumbs = AL('HORIZONTAL', 'Project', { gap: 6, align: 'CENTER' }); top.appendChild(crumbs);
      crumbs.appendChild(await T(o.project || 'acme-web', 'Small strong', 'text/primary')); crumbs.appendChild(ICON(I.chevDown, hx('text/tertiary'), 12));
      crumbs.appendChild(await T('/', 'Small', 'text/tertiary')); crumbs.appendChild(ICON(I.branch, hx('text/tertiary'), 14));
      crumbs.appendChild(await T(o.branch || 'main', 'Small', 'text/secondary')); crumbs.appendChild(await T(o.commit || 'a3f9c21', 'Mono small', 'text/tertiary'));
      spacer(top);
      if (o.title) top.appendChild(await T(o.title, 'Small strong', 'text/secondary'));
      else {
        const seg = AL('HORIZONTAL', 'View switch', { gap: 2, pad: 2, radius: 6, fill: 'surface/raised' }); top.appendChild(seg);
        for (const [label, idx] of [['Graph', 0], ['Sequence', 1], ['Code', 2]]) {
          const active = (o.view || 0) === idx;
          const s = AL('HORIZONTAL', label, { pad: [3, 10], radius: 4, fill: active ? 'surface/selected' : null }); seg.appendChild(s);
          s.appendChild(await T(label, 'Small strong', active ? 'text/primary' : 'text/secondary'));
        }
      }
      spacer(top);
      const search = fixSize(AL('HORIZONTAL', 'Search', { gap: 8, pad: [0, 8], align: 'CENTER', radius: 4, stroke: 'border/control' }), 200, 26); top.appendChild(search);
      search.appendChild(ICON(I.search, hx('text/tertiary'), 14)); search.appendChild(await T('Search', 'Small', 'text/tertiary')); spacer(search); search.appendChild(await kbd('⌘K'));
      const run = AL('HORIZONTAL', 'Dev server', { gap: 6, align: 'CENTER' }); top.appendChild(run);
      run.appendChild(dot(o.serverDot || 'state/added/solid')); run.appendChild(await T(o.server || 'localhost:3000', 'Mono small', 'text/secondary'));
      const share = button('Secondary', 'Share'); share.name = 'Share'; top.appendChild(share);
      top.appendChild(await avatar('AK'));
      return top;
    }
    function rail(body, active) {
      const r = fixSize(AL('VERTICAL', 'Rail', { gap: 4, pad: [8, 0], align: 'CENTER', fill: 'surface/panel' }), 44, 820);
      put(body, r, 'FIXED', 'FILL'); side(r, 'r');
      const items = [['Canvas', I.grid], ['Entry points', I.target], ['Files', I.file], ['Search', I.search], ['Source control', I.branch], ['Tests', I.flask], ['Debug', I.bug], ['Terminal', I.terminal], ['Plugins', I.puzzle]];
      items.forEach(([name, svg], i) => {
        const b = fixSize(AL('HORIZONTAL', name, { align: 'CENTER', justify: 'CENTER', radius: 6, fill: i === active ? 'surface/selected' : null }), 32, 32);
        b.appendChild(ICON(svg, i === active ? hx('text/primary') : hx('text/tertiary'), 18)); r.appendChild(b);
      });
      spacer(r);
      for (const [name, svg, idx] of [['Account', I.user, 20], ['Settings', I.gear, 21]]) {
        const b = fixSize(AL('HORIZONTAL', name, { align: 'CENTER', justify: 'CENTER', radius: 6, fill: active === idx ? 'surface/selected' : null }), 32, 32);
        b.appendChild(ICON(svg, active === idx ? hx('text/primary') : hx('text/tertiary'), 18)); r.appendChild(b);
      }
      return r;
    }
    async function reviewBar(root, o = {}) {
      const expanded = !!o.expanded;
      const rv = fixSize(AL('VERTICAL', 'Review bar', { fill: 'surface/panel' }), 1440, expanded ? 300 : 40); put(root, rv, 'FILL', 'FIXED'); side(rv, 't');
      const row = fixSize(AL('HORIZONTAL', 'Tabs', { gap: 4, pad: [0, 12], align: 'CENTER' }), 1440, 40); put(rv, row, 'FILL', 'FIXED');
      if (expanded) side(row, 'b');
      const tabs = o.tabs || [['Changed', '3', 'Modified'], ['Affected', '2', 'Affected'], ['Tests', '3/4', 'Modified'], ['Observed', '5', 'Neutral'], ['Unverified', '1', 'Neutral']];
      for (let i = 0; i < tabs.length; i++) {
        const [label, count, tone] = tabs[i];
        const t = AL('HORIZONTAL', 'Tab · ' + label, { gap: 6, pad: [4, 10], radius: 4, align: 'CENTER', fill: i === 0 ? 'surface/selected' : null }); row.appendChild(t);
        t.appendChild(await T(label, 'Small strong', i === 0 ? 'text/primary' : 'text/secondary')); t.appendChild(tag(tone, count));
      }
      spacer(row);
      row.appendChild(await T(o.summary || 'Session · 4 steps · 2 min ago', 'Caption', 'text/tertiary'));
      if (o.actions !== false) { row.appendChild(button('Ghost', 'Revert step')); row.appendChild(button('Secondary', 'Compare')); row.appendChild(button('Primary', 'Accept')); }
      if (expanded) {
        const list = AL('VERTICAL', 'Changed list', { pad: [6, 12] }); put(rv, list, 'FILL', 'FILL');
        const head = AL('HORIZONTAL', 'Header', { gap: 16, pad: [6, 12], align: 'CENTER' }); put(list, head, 'FILL');
        for (const [txt, w] of [['Node', 260], ['State', 120], ['Files', 340], ['Lines', 80]]) head.appendChild(await fixedT(txt, 'Caption', 'text/tertiary', w));
        spacer(head); head.appendChild(await T('Actions', 'Caption', 'text/tertiary'));
        const ROWS = [['rateLimit', 'Added', '+ added', 'middleware/rateLimit.ts, api/items/route.ts', '+38 −0'], ['llm.complete', 'Modified', '~ modified', 'worker/process.ts', '+1 −1'], ['POST /api/items', 'Modified', '~ modified', 'api/items/route.ts', '+3 −1']];
        for (let i = 0; i < ROWS.length; i++) {
          const [n, tone, tl, files, lines] = ROWS[i];
          const r = AL('HORIZONTAL', 'Row · ' + n, { gap: 16, pad: [8, 12], align: 'CENTER', radius: 4, fill: i === 1 ? 'surface/hover' : null }); put(list, r, 'FILL');
          r.appendChild(await fixedT(n, 'Mono small', 'text/primary', 260));
          const tw = AL('HORIZONTAL', 'State', {}); fixW(tw, 120); tw.appendChild(tag(tone, tl)); r.appendChild(tw);
          r.appendChild(await fixedT(files, 'Mono small', 'text/secondary', 340));
          r.appendChild(await fixedT(lines, 'Mono small', 'text/tertiary', 80));
          spacer(r);
          r.appendChild(await T('Show on canvas', 'Small', 'text/secondary')); r.appendChild(await T('Diff', 'Small', 'text/secondary')); r.appendChild(await T('Revert', 'Small', 'state/removed/text'));
        }
      }
      return rv;
    }
    async function shell(name, o = {}) {
      const root = screen(name);
      await topBar(root, o.top || {});
      const reviewH = o.review === false ? 0 : (o.reviewOpts && o.reviewOpts.expanded ? 300 : 40);
      const BH = 900 - 40 - reviewH;
      const body = fixSize(AL('HORIZONTAL', 'Body'), 1440, BH); put(root, body, 'FILL', 'FILL');
      rail(body, o.rail == null ? 1 : o.rail);
      let left = null;
      const LW = o.left === false ? 0 : (o.leftW || 248);
      if (o.left !== false) { left = fixSize(AL('VERTICAL', 'Left panel', { pad: [10, 8, 12, 8], fill: 'surface/panel' }), LW, BH); put(body, left, 'FIXED', 'FILL'); side(left, 'r'); }
      const RW = o.right === false ? 0 : (o.rightW || 360);
      let center;
      if (o.center === 'stack') { center = AL('VERTICAL', 'Main', { fill: 'surface/canvas' }); put(body, center, 'FILL', 'FILL'); }
      else { center = figma.createFrame(); center.name = 'Canvas'; center.fills = [paint('surface/canvas')]; center.clipsContent = true; put(body, center, 'FILL', 'FILL'); }
      let right = null;
      if (o.right !== false) { right = fixSize(AL('VERTICAL', 'Right panel', { fill: 'surface/panel' }), RW, BH); put(body, right, 'FIXED', 'FILL'); side(right, 'l'); }
      if (o.review !== false) await reviewBar(root, o.reviewOpts || {});
      return { root, body, left, center, right, CW: 1440 - 44 - LW - RW, CH: BH };
    }

    // canvas helpers
    const at = (cv, n, x, y) => { cv.appendChild(n); n.x = Math.round(x); n.y = Math.round(y); return n; };
    const relX = (cv, n) => n.absoluteTransform[0][2] - cv.absoluteTransform[0][2];
    const relY = (cv, n) => n.absoluteTransform[1][2] - cv.absoluteTransform[1][2];
    function grid(cv, W, H) {
      let gd = ''; for (let x = 8; x < W; x += 16) for (let y = 8; y < H; y += 16) gd += `M${x} ${y}h1v1h-1z`;
      const g = figma.createNodeFromSvg(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><path d="${gd}" fill="${hx('border/subtle')}"/></svg>`);
      g.name = 'Dot grid'; g.fills = []; at(cv, g, 0, 0); g.locked = true; return g;
    }
    function link(cv, pts, o = {}) {
      const color = o.color || hx('edge/default'), width = o.width || 1.25, pad = 6;
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad, w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
      const rel = pts.map(([x, y]) => [x - minX, y - minY]);
      const d = rel.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
      let head = '';
      if (o.arrow !== false) {
        const [x2, y2] = rel[rel.length - 1], [x1, y1] = rel[rel.length - 2];
        const a = Math.atan2(y2 - y1, x2 - x1), L = 6, Wd = 3.5, bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
        head = `<path d="M${x2} ${y2} L${bx + Wd * Math.sin(a)} ${by - Wd * Math.cos(a)} L${bx - Wd * Math.sin(a)} ${by + Wd * Math.cos(a)} Z" fill="${color}"/>`;
      }
      const dash = o.dash ? `stroke-dasharray="${o.dash}"` : '';
      const n = figma.createNodeFromSvg(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="${color}" stroke-width="${width}" ${dash} stroke-linecap="round" stroke-linejoin="round"/>${head}</svg>`);
      n.name = o.name || 'Edge'; n.fills = []; at(cv, n, minX, minY); return n;
    }
    function chain(cv, x, y, items, o = {}) {
      const nodes = []; let yy = y; const gap = o.gap || 18;
      for (const it of items) { const n = at(cv, flowNode(it[0], it[1], it[2]), x, yy); nodes.push(n); yy += n.height + gap; }
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1], cx = x + 108;
        const style = (o.edges && o.edges[i]) || {};
        link(cv, [[cx, a.y + a.height], [cx, b.y]], style);
      }
      return nodes;
    }
    function obsMarker(cv, x, y) {
      const n = figma.createNodeFromSvg(`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="6.25" fill="${hx('surface/canvas')}" stroke="${hx('edge/observed')}" stroke-width="1.25"/><path d="M4.3 7.2l1.8 1.8 3.6-3.8" stroke="${hx('edge/observed')}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      n.name = 'Observed marker'; n.fills = []; at(cv, n, x - 7, y - 7); return n;
    }
    function ring(cv, node, color = 'accent/solid') {
      const r = figma.createRectangle(); r.name = 'Selection'; r.resize(node.width + 6, node.height + 6); r.cornerRadius = 8; r.fills = [];
      r.strokes = [paint(color)]; r.strokeWeight = 1.5; at(cv, r, node.x - 3, node.y - 3); return r;
    }
    async function minimap(cv, x, y) {
      const mm = figma.createFrame(); mm.name = 'Minimap'; mm.resize(140, 84); mm.cornerRadius = 6; mm.fills = [paint('surface/panel')]; mm.strokes = [paint('border/subtle')]; mm.strokeWeight = 1;
      [[8, 10, 30, 40, 'preview/line', 0.3], [8, 56, 30, 18, 'preview/line', 0.3], [48, 10, 26, 5, 'border/strong', 1], [48, 19, 26, 5, 'state/added/solid', 1], [48, 28, 26, 5, 'border/strong', 1], [48, 37, 26, 5, 'border/strong', 1],
       [88, 34, 26, 5, 'border/strong', 1], [88, 43, 26, 5, 'border/strong', 1], [88, 52, 26, 5, 'state/modified/solid', 1], [88, 61, 26, 5, 'state/affected/solid', 1]]
        .forEach(([a, b, w, h, c, o]) => { const r = figma.createRectangle(); r.resize(w, h); r.cornerRadius = 1.5; r.fills = [paint(c, o)]; mm.appendChild(r); r.x = a; r.y = b; });
      const vp = figma.createRectangle(); vp.resize(124, 70); vp.cornerRadius = 3; vp.fills = []; vp.strokes = [paint('border/strong')]; vp.strokeWeight = 1; mm.appendChild(vp); vp.x = 8; vp.y = 7;
      return at(cv, mm, x, y);
    }
    async function toolbar(cv, CW, CH, o = {}) {
      const tb = AL('HORIZONTAL', 'Canvas toolbar', { gap: 2, pad: 4, radius: 8, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' });
      tb.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.4 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' }];
      const tools = o.tools || [[I.cursor, true], [I.hand], [I.comment], [I.frame]];
      for (const [svg, active] of tools) {
        const b = fixSize(AL('HORIZONTAL', 'Tool', { align: 'CENTER', justify: 'CENTER', radius: 4, fill: active ? 'surface/selected' : null }), 28, 28);
        b.appendChild(ICON(svg, active ? hx('text/primary') : hx('text/tertiary'), 16)); tb.appendChild(b);
      }
      if (o.label !== false) {
        const dv = figma.createRectangle(); dv.name = 'Divider'; dv.resize(1, 16); dv.fills = [paint('border/subtle')]; tb.appendChild(dv);
        const z = AL('HORIZONTAL', 'Zoom', { pad: [0, 8], align: 'CENTER' }); z.appendChild(await T(o.label || '100%', 'Small', 'text/secondary')); tb.appendChild(z);
      }
      at(cv, tb, 0, 0); tb.x = Math.round((CW - tb.width) / 2); tb.y = o.top ? 16 : CH - 16 - tb.height; return tb;
    }
    async function frameLabel(cv, x, y, name, route, extra) {
      const fl = AL('HORIZONTAL', 'Frame label', { gap: 8, align: 'CENTER' }); at(cv, fl, x, y);
      fl.appendChild(await T(name, 'Small', 'text/secondary')); if (route) fl.appendChild(await T(route, 'Mono small', 'text/tertiary')); if (extra) fl.appendChild(extra);
      return fl;
    }
    async function itemEditorFrame(cv, x, y, o = {}) {
      const f1 = AL('VERTICAL', 'Live frame · Item editor', { gap: 12, pad: 16, radius: 10, fill: 'preview/surface' });
      f1.resize(264, 100); f1.primaryAxisSizingMode = 'AUTO'; f1.counterAxisSizingMode = 'FIXED'; at(cv, f1, x, y);
      const fh = AL('HORIZONTAL', 'Header', { align: 'CENTER' }); put(f1, fh, 'FILL');
      fh.appendChild(await T('New item', 'Body strong', 'preview/ink')); spacer(fh);
      const dr = AL('HORIZONTAL', 'Status', { pad: [1, 6], radius: 4, fill: 'preview/line' }); dr.appendChild(await T('Draft', 'Caption', 'preview/muted')); fh.appendChild(dr);
      const field = async (label, value, muted, chevron, tall) => {
        const g = AL('VERTICAL', 'Field · ' + label, { gap: 4 }); put(f1, g, 'FILL');
        g.appendChild(await T(label, 'Caption', 'preview/muted'));
        const box = AL('HORIZONTAL', 'Input', { pad: tall ? [6, 8, 30, 8] : [6, 8], radius: 6, stroke: 'preview/line', fill: 'preview/surface', align: 'CENTER' }); put(g, box, 'FILL');
        box.appendChild(await T(value, 'Small', muted ? 'preview/muted' : 'preview/ink'));
        if (chevron) { spacer(box); box.appendChild(ICON(I.chevDown, hx('preview/muted'), 14)); }
      };
      await field('Name', 'Quarterly report'); await field('Category', 'Reports', false, true); await field('Notes', 'Optional', true, false, true);
      const cbRow = AL('HORIZONTAL', 'Checkbox', { gap: 8, align: 'CENTER' }); put(f1, cbRow, 'FILL');
      const cb = fixSize(AL('HORIZONTAL', 'Box', { align: 'CENTER', justify: 'CENTER', radius: 3, fill: 'preview/brand' }), 14, 14); cb.appendChild(ICON(I.check, '#FFFFFF', 10, 2)); cbRow.appendChild(cb);
      cbRow.appendChild(await T('Notify watchers', 'Small', 'preview/ink'));
      gapBox(f1, 8);
      const actions = AL('HORIZONTAL', 'Actions', { gap: 8, justify: 'MAX' }); put(f1, actions, 'FILL');
      const cancel = AL('HORIZONTAL', 'Cancel', { pad: [6, 12], radius: 6, stroke: 'preview/line' }); cancel.appendChild(await T('Cancel', 'Small strong', 'preview/ink')); actions.appendChild(cancel);
      const save = AL('HORIZONTAL', 'Save button', { pad: [6, 12], radius: 6, fill: 'preview/brand' });
      const st = await T('Save item', 'Small strong', 'preview/surface'); save.appendChild(st);
      if (o.selected) { save.strokes = [paint('accent/solid')]; save.strokeWeight = 2; save.strokeAlign = 'OUTSIDE'; }
      actions.appendChild(save);
      if (o.selected) {
        const sbx = relX(cv, save), sby = relY(cv, save);
        const srcTag = AL('HORIZONTAL', 'Source tag', { pad: [1, 6], radius: 3, fill: 'accent/solid' }); srcTag.appendChild(await T('SaveButton · ItemForm.tsx:84', 'Caption', 'text/on-accent'));
        at(cv, srcTag, 0, 0); srcTag.x = Math.round(sbx + save.width - srcTag.width); srcTag.y = Math.round(sby - srcTag.height - 6);
      }
      return { frame: f1, save };
    }
    async function itemsListFrame(cv, x, y, affected) {
      const f2 = AL('VERTICAL', 'Live frame · Items list', { radius: 10, fill: 'preview/surface', pad: [4, 0, 6, 0] });
      f2.resize(264, 100); f2.primaryAxisSizingMode = 'AUTO'; f2.counterAxisSizingMode = 'FIXED';
      if (affected) { f2.strokes = [paint('state/affected/solid')]; f2.strokeWeight = 1; f2.dashPattern = [4, 3]; f2.strokeAlign = 'OUTSIDE'; }
      at(cv, f2, x, y);
      const rows = [['Name', 'Status', true], ['Quarterly report', 'Processing…'], ['Onboarding guide', 'Ready'], ['Q3 metrics', 'Ready']];
      for (let i = 0; i < rows.length; i++) {
        const [a, b, head] = rows[i];
        const r = AL('HORIZONTAL', head ? 'Table header' : 'Row', { pad: [8, 14], align: 'CENTER' }); put(f2, r, 'FILL');
        if (i < rows.length - 1) side(r, 'b', 'preview/line');
        r.appendChild(await T(a, head ? 'Caption' : 'Small', head ? 'preview/muted' : 'preview/ink')); spacer(r);
        r.appendChild(await T(b, head ? 'Caption' : 'Small', head || b === 'Ready' ? 'preview/muted' : 'preview/ink'));
      }
      return f2;
    }

    // The main item flow, used by many screens
    async function workspaceFlow(cv, CW, CH, mode = 'after', opt = {}) {
      grid(cv, CW, CH);
      const ctx = AL('HORIZONTAL', 'Context', { gap: 6, align: 'CENTER' }); at(cv, ctx, 20, 16);
      ctx.appendChild(await T('Item editor', 'Small', 'text/secondary')); ctx.appendChild(ICON(I.chevRight, hx('text/tertiary'), 12));
      ctx.appendChild(await T('Save item', 'Small strong', 'text/primary'));
      ctx.appendChild(await T(mode === 'running' ? '   analysing 3 nodes…' : '   18 edges · 11 resolved · 4 convention · 2 observed · 1 unresolved', 'Caption', 'text/tertiary'));
      const lane = figma.createRectangle(); lane.name = 'Background lane'; lane.resize(232, 468); lane.cornerRadius = 8;
      lane.fills = [paint('surface/panel', 0.7)]; lane.strokes = [paint('border/subtle')]; lane.strokeWeight = 1; at(cv, lane, 548, 296);
      const ll = AL('HORIZONTAL', 'Lane label', { gap: 6, align: 'CENTER' }); at(cv, ll, 560, 306);
      ll.appendChild(ICON(I.clock, hx('text/tertiary'), 12)); ll.appendChild(await T('Background · process-items', 'Caption', 'text/tertiary'));
      const st = {
        after: { c1: ['Default', 'Added', 'Default', 'Default', 'Default'], c2: ['Default', 'Default', 'Modified', 'Affected', 'Default', 'Default'] },
        running: { c1: ['Default', 'Added', 'Default', 'Default', 'Default'], c2: ['Default', 'Default', 'Analysing', 'Analysing', 'Scope', 'Default'] },
        plain: { c1: ['Default', 'Default', 'Default', 'Default', 'Default'], c2: ['Default', 'Default', 'Default', 'Default', 'Default', 'Default'] },
        debug: { c1: ['Default', 'Default', 'Default', 'Default', 'Default'], c2: ['Default', 'Default', 'Selected', 'Default', 'Default', 'Default'] },
        tests: { c1: ['Default', 'Default', 'Default', 'Default', 'Default'], c2: ['Default', 'Default', 'Default', 'Failing', 'Default', 'Default'] }
      }[mode];
      const C1 = [['onSubmit', 'ui/ItemForm.tsx:84'], ['rateLimit', 'middleware/rateLimit.ts'], ['validateItem', 'lib/validate.ts:12'], ['POST /api/items', 'api/items/route.ts:9'], ['db.items.insert', 'lib/db.ts:41']];
      const C2 = [['queue.add', 'jobs/queue.ts:14'], ['processItem', 'worker/process.ts:10'], ['llm.complete', 'worker/process.ts:42'], ['parseResult', 'lib/parse.ts:7'], ['db.items.update', 'lib/db.ts:58'], ['notify', 'lib/notify.ts:19']];
      const Y1 = [96, 168, 240, 312, 384], Y2 = [336, 408, 480, 552, 624, 696], X1 = 316, X2 = 556;
      const n1 = C1.map((c, i) => at(cv, flowNode(st.c1[i], c[0], c[1]), X1, Y1[i]));
      const n2 = C2.map((c, i) => at(cv, flowNode(st.c2[i], c[0], c[1]), X2, Y2[i]));
      const NH = n1[0].height, c1x = X1 + 108, c2x = X2 + 108;
      const hot = mode === 'debug' ? hx('accent/solid') : null;
      for (let i = 0; i < 4; i++) link(cv, [[c1x, Y1[i] + NH], [c1x, Y1[i + 1]]], hot ? { color: hot, width: 1.5 } : {});
      for (let i = 0; i < 5; i++) {
        if (mode === 'debug' && i < 2) link(cv, [[c2x, Y2[i] + NH], [c2x, Y2[i + 1]]], { color: hot, width: 1.5 });
        else if (i === 1) link(cv, [[c2x, Y2[i] + NH], [c2x, Y2[i + 1]]], { color: hx('edge/observed'), name: 'Edge · observed' });
        else if (i === 4) link(cv, [[c2x, Y2[i] + NH], [c2x, Y2[i + 1]]], { dash: '1.5 4', name: 'Edge · suggested' });
        else link(cv, [[c2x, Y2[i] + NH], [c2x, Y2[i + 1]]]);
      }
      link(cv, [[X1 + 216, Y1[3] + NH / 2], [X1 + 228, Y1[3] + NH / 2], [X1 + 228, Y2[0] + NH / 2], [X2, Y2[0] + NH / 2]], { dash: '4 3', name: 'Edge · async hand-off', color: hot || hx('edge/default') });
      if (mode !== 'debug') obsMarker(cv, c2x, (Y2[1] + NH + Y2[2]) / 2);
      const sTop = Y1[4] + NH;
      link(cv, [[c1x, sTop], [c1x, sTop + 18]], { arrow: false, name: 'Edge · unresolved' });
      const stub = figma.createEllipse(); stub.name = 'Unresolved end'; stub.resize(10, 10); stub.fills = []; stub.strokes = [paint('edge/default')]; stub.strokeWeight = 1.25; at(cv, stub, c1x - 5, sTop + 18);
      const stT = await T('dispatch[type]()', 'Mono small', 'text/tertiary'); at(cv, stT, 0, sTop + 15); stT.x = Math.round(c1x - 12 - stT.width);
      if (mode === 'after') ring(cv, n2[2]);

      await frameLabel(cv, 20, 74, 'Item editor', '/items/new');
      const ed = await itemEditorFrame(cv, 20, 96, { selected: mode !== 'running' });
      const sbx = relX(cv, ed.save), sby = relY(cv, ed.save), mid = sby + ed.save.height / 2;
      link(cv, [[sbx + ed.save.width + 3, mid], [300, mid], [300, Y1[0] + NH / 2], [X1, Y1[0] + NH / 2]], { color: hx('accent/solid'), width: 1.5, name: 'Edge · selection' });
      const fb = ed.frame.y + ed.frame.height;
      await frameLabel(cv, 20, fb + 22, 'Items list', '/items', mode === 'after' ? tag('Affected', 'affected') : null);
      await itemsListFrame(cv, 20, fb + 46, mode === 'after');
      if (mode === 'running') {
        const prog = figma.createRectangle(); prog.name = 'Reload progress'; prog.resize(120, 2); prog.fills = [paint('accent/solid')]; at(cv, prog, 20, 96);
      }
      if (opt.minimap !== false) await minimap(cv, 20, CH - 16 - 84);
      return { n1, n2, NH, Y1, Y2, X1, X2 };
    }

    // Right panel pieces
    async function inspectorLLM(parent, o = {}) {
      const insp = AL('VERTICAL', 'Inspector', { gap: 12, pad: 16 }); put(parent, insp, 'FILL');
      insp.appendChild(await T('AI call · LLM', 'Caption', 'text/tertiary'));
      const ih = AL('HORIZONTAL', 'Title', { align: 'CENTER', gap: 8 }); put(insp, ih, 'FILL');
      ih.appendChild(await T('llm.complete', 'Heading', 'text/primary')); spacer(ih); ih.appendChild(o.running ? tag('Neutral', 'analysing…') : tag('Modified', '~ modified'));
      const ip = AL('HORIZONTAL', 'Source', { align: 'CENTER', gap: 6 }); put(insp, ip, 'FILL');
      ip.appendChild(await T('worker/process.ts:42', 'Mono small', 'accent/text')); spacer(ip);
      if (!o.running) { ip.appendChild(ICON(I.check, hx('edge/observed'), 12)); ip.appendChild(await T('observed 2 min ago', 'Caption', 'text/tertiary')); }
      const tabs = AL('HORIZONTAL', 'Tabs', { gap: 16 }); put(insp, tabs, 'FILL'); side(tabs, 'b');
      for (const [label, count, active] of [['Details', '', !o.tab], ['Runs', '12', o.tab === 'runs'], ['Changes', '1', o.tab === 'changes'], ['Calls', '']]) {
        const t = AL('VERTICAL', 'Tab · ' + label, { gap: 7 }); tabs.appendChild(t);
        const tr = AL('HORIZONTAL', 'Label', { gap: 4 }); t.appendChild(tr);
        tr.appendChild(await T(label, active ? 'Small strong' : 'Small', active ? 'text/primary' : 'text/secondary'));
        if (count) tr.appendChild(await T(count, 'Small', 'text/tertiary'));
        const u = figma.createRectangle(); u.name = 'Underline'; u.resize(10, 2); u.fills = active ? [paint('accent/solid')] : []; t.appendChild(u); u.layoutSizingHorizontal = 'FILL';
      }
      const ph = AL('HORIZONTAL', 'Section · Prompt', { align: 'CENTER' }); put(insp, ph, 'FILL');
      ph.appendChild(await T('Prompt', 'Caption', 'text/tertiary')); spacer(ph); ph.appendChild(await T('Edit', 'Caption', 'accent/text'));
      await codeBlock(insp, [['1', 'system: You are a careful assistant.'], ['2', 'task: {{task}}'], ['3', 'input: {{input}}'], ['4', 'context: {{context}}'], ['5', 'output: JSON matching {{schema}}'], ['−', 'rules: answer in under 200 words', 'removed'], ['+', 'rules: answer in under 80 words', 'added']]);
      const defs = AL('VERTICAL', 'Properties', { gap: 6 }); put(insp, defs, 'FILL');
      for (const [k, v, mono] of [['Model', 'model-name', true], ['Temperature', '0.2', true], ['Inputs', 'input, context'], ['Output', 'JSON · { result }', true], ['Last run', '1.84 s · 1,912 tokens']]) {
        const r = AL('HORIZONTAL', 'Property · ' + k, { gap: 12, align: 'CENTER' }); put(defs, r, 'FILL');
        r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 88)); r.appendChild(await T(v, mono ? 'Mono small' : 'Small', 'text/primary'));
      }
      const ia = AL('HORIZONTAL', 'Actions', { gap: 8, justify: 'MAX', pad: [4, 0, 0, 0] }); put(insp, ia, 'FILL');
      ia.appendChild(button('Ghost', 'Compare runs')); ia.appendChild(button('Secondary', 'Re-run on sample'));
      return insp;
    }
    async function codeBlock(parent, lines, o = {}) {
      const code = AL('VERTICAL', o.name || 'Code', { pad: [6, 0], radius: 6, fill: 'surface/canvas', stroke: 'border/subtle' }); put(parent, code, 'FILL');
      for (const [g, text, kind] of lines) {
        const r = AL('HORIZONTAL', 'Line ' + g, { gap: 10, pad: [1, 10], fill: kind ? `state/${kind}/tint` : null }); put(code, r, 'FILL');
        r.appendChild(await fixedT(g, 'Mono small', kind ? `state/${kind}/text` : 'text/tertiary', o.gutter || 12, 'RIGHT'));
        const tt = await T(text, 'Mono small', kind ? `state/${kind}/text` : 'text/secondary'); r.appendChild(tt);
        if (!kind) colorRange(tt, /\{\{[^}]+\}\}/, 'accent/text');
      }
      return code;
    }
    async function agentPanel(parent, mode = 'done') {
      const agent = AL('VERTICAL', 'Agent', { gap: 12, pad: 16 }); put(parent, agent, 'FILL', 'FILL'); side(agent, 't');
      const ah = AL('HORIZONTAL', 'Header', { align: 'CENTER', gap: 6 }); put(agent, ah, 'FILL');
      ah.appendChild(await T('Agent', 'Small strong', 'text/primary')); spacer(ah); ah.appendChild(dot('state/added/solid')); ah.appendChild(await T('Claude Code', 'Caption', 'text/secondary'));
      const m1 = AL('VERTICAL', 'Message · you', { gap: 4 }); put(agent, m1, 'FILL');
      m1.appendChild(await T('You', 'Caption', 'text/tertiary'));
      await wrapT(m1, 'Add a rate limit to item creation and keep LLM answers under 80 words.', 'Body', 'text/primary', 328);
      if (mode === 'done') {
        const m2 = AL('VERTICAL', 'Message · agent', { gap: 4 }); put(agent, m2, 'FILL');
        m2.appendChild(await T('Claude Code', 'Caption', 'text/tertiary'));
        await wrapT(m2, 'Done. 3 files changed and 2 flows may be affected. One related test needs a look.', 'Body', 'text/secondary', 328);
      }
      const steps = AL('VERTICAL', 'Steps', { radius: 6, stroke: 'border/subtle' }); put(agent, steps, 'FILL');
      const STEPS = mode === 'done'
        ? [['ok', 'Added rateLimit middleware', '4f2a1c', '14s'], ['ok', 'Applied it to POST /api/items', '9b07e3', '6s'], ['ok', 'Shortened answers in prompt', 'c21d88', '9s'], ['warn', '3 of 4 related tests pass', 'tests', '21s']]
        : [['ok', 'Added rateLimit middleware', '4f2a1c', '14s'], ['ok', 'Applied it to POST /api/items', '9b07e3', '6s'], ['run', 'Editing worker/process.ts', '', '0:07'], ['wait', 'Run related tests', '', '']];
      for (let i = 0; i < STEPS.length; i++) {
        const [s, label, id, dur] = STEPS[i];
        const r = AL('HORIZONTAL', 'Step ' + (i + 1), { gap: 8, pad: [7, 10], align: 'CENTER' }); put(steps, r, 'FILL');
        if (i < STEPS.length - 1) side(r, 'b');
        const ic = s === 'ok' ? ICON(I.check, hx('state/added/solid'), 14, 1.75) : s === 'warn' ? ICON(I.alert, hx('state/modified/solid'), 14) : s === 'run' ? ICON(I.spinner, hx('accent/solid'), 14, 1.75) : ICON(I.circle, hx('border/strong'), 14);
        r.appendChild(ic);
        r.appendChild(await T(label, 'Small', s === 'warn' ? 'state/modified/text' : s === 'wait' ? 'text/tertiary' : s === 'run' ? 'text/primary' : 'text/secondary')); spacer(r);
        if (id) r.appendChild(await T(id, 'Mono small', 'text/tertiary'));
        if (dur) r.appendChild(await fixedT(dur, 'Mono small', 'text/tertiary', 30, 'RIGHT'));
      }
      if (mode === 'running') {
        const ap = AL('VERTICAL', 'Approval', { gap: 10, pad: 12, radius: 6, fill: 'surface/raised', stroke: 'border/control' }); put(agent, ap, 'FILL');
        ap.appendChild(await T('Claude Code wants to run a command', 'Small strong', 'text/primary'));
        const cmd = AL('HORIZONTAL', 'Command', { pad: [6, 8], radius: 4, fill: 'surface/canvas' }); put(ap, cmd, 'FILL'); cmd.appendChild(await T('npm test -- api/items worker', 'Mono small', 'text/secondary'));
        const ab = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(ap, ab, 'FILL');
        ab.appendChild(button('Ghost', 'Deny')); ab.appendChild(button('Secondary', 'Always allow')); ab.appendChild(button('Primary', 'Allow once'));
      }
      spacer(agent);
      const comp = AL('VERTICAL', 'Composer', { gap: 10, pad: 10, radius: 6, fill: 'surface/raised', stroke: 'border/control' }); put(agent, comp, 'FILL');
      await wrapT(comp, mode === 'running' ? 'Agent is working… you can queue a follow-up.' : 'Ask for a change. Use @ to reference a node.', 'Small', 'text/tertiary', 306);
      const cr = AL('HORIZONTAL', 'Controls', { gap: 8, align: 'CENTER' }); put(comp, cr, 'FILL');
      cr.appendChild(ICON(I.clip, hx('text/tertiary'), 14)); cr.appendChild(await T(mode === 'running' ? 'Focused · 3 nodes' : 'Full project', 'Caption', 'text/secondary')); cr.appendChild(ICON(I.chevDown, hx('text/tertiary'), 12));
      spacer(cr); cr.appendChild(mode === 'running' ? button('Secondary', 'Stop') : button('Primary', 'Send'));
      return agent;
    }
    async function panelHeader(parent, title, right) {
      const h = AL('HORIZONTAL', 'Header', { pad: [2, 8, 8, 8], align: 'CENTER', gap: 8 }); put(parent, h, 'FILL');
      h.appendChild(await T(title, 'Small strong', 'text/primary')); spacer(h); if (right) h.appendChild(await T(right, 'Caption', 'text/tertiary'));
      return h;
    }
    async function listGroup(parent, title, count, items, width) {
      const head = AL('HORIZONTAL', 'Group · ' + title, { pad: [14, 8, 4, 8], align: 'CENTER' }); put(parent, head, 'FILL');
      head.appendChild(await T(title, 'Caption', 'text/tertiary')); spacer(head); if (count != null) head.appendChild(await T(String(count), 'Caption', 'text/tertiary'));
      for (const it of items) {
        const r = fixSize(AL('HORIZONTAL', 'Row · ' + it.label, { gap: 8, pad: [0, 8 + (it.indent || 0) * 14, 0, 8 + (it.indent || 0) * 14], align: 'CENTER', radius: 4, fill: it.selected ? 'surface/selected' : null }), width || 232, 28);
        r.paddingRight = 8; put(parent, r, 'FILL', 'FIXED');
        if (it.icon) r.appendChild(ICON(it.icon, it.iconColor || (it.selected ? hx('text/primary') : hx('text/tertiary')), 14));
        r.appendChild(await T(it.label, it.mono ? 'Mono small' : 'Small', it.selected ? 'text/primary' : (it.muted ? 'text/tertiary' : 'text/secondary')));
        if (it.suffix) r.appendChild(await T(it.suffix, 'Caption', 'text/tertiary'));
        spacer(r);
        if (it.meta) r.appendChild(await T(it.meta, it.metaMono ? 'Mono small' : 'Caption', it.metaColor || 'text/tertiary'));
        if (it.tag) r.appendChild(tag(it.tag[0], it.tag[1]));
        if (it.state) r.appendChild(dot(it.state));
      }
    }
    async function entryPoints(left) {
      await panelHeader(left, 'Entry points', '26');
      const fi = await input(232, 'Filter', { icon: I.search, placeholder: true, h: 28, trailing: await kbd('/') }); put(left, fi, 'FILL', 'FIXED');
      await listGroup(left, 'Screens', 4, [{ label: 'Item editor', icon: I.screen, selected: true }, { label: 'Items list', icon: I.screen, state: 'state/affected/solid' }, { label: 'Item detail', icon: I.screen }, { label: 'Settings', icon: I.screen }]);
      await listGroup(left, 'API routes', 9, [{ label: 'POST /api/items', icon: I.route, mono: true, state: 'state/modified/solid' }, { label: 'GET /api/items', icon: I.route, mono: true }, { label: 'GET /api/items/:id', icon: I.route, mono: true }, { label: 'PATCH /api/items/:id', icon: I.route, mono: true }]);
      await listGroup(left, 'Jobs', 2, [{ label: 'process-items', icon: I.clock, mono: true, suffix: 'queue', state: 'state/modified/solid' }, { label: 'daily-digest', icon: I.clock, mono: true, suffix: 'cron' }]);
      await listGroup(left, 'Events', 2, [{ label: 'item.created', icon: I.bolt, mono: true }, { label: 'item.processed', icon: I.bolt, mono: true }]);
    }
    function overlay(root, opacity = 0.6) {
      const o = figma.createRectangle(); o.name = 'Scrim'; o.resize(1440, 900); o.fills = [paint('surface/canvas', opacity)];
      root.appendChild(o); o.layoutPositioning = 'ABSOLUTE'; o.x = 0; o.y = 0; return o;
    }
    function floatIn(root, node, x, y) { root.appendChild(node); node.layoutPositioning = 'ABSOLUTE'; node.x = Math.round(x); node.y = Math.round(y); return node; }
    const shadow = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.45 }, offset: { x: 0, y: 12 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }];
    async function sectionTitle(parent, text, sub) {
      const s = AL('VERTICAL', 'Section · ' + text, { gap: 2, pad: [0, 0, 4, 0] }); put(parent, s, 'FILL');
      s.appendChild(await T(text, 'Heading', 'text/primary')); if (sub) s.appendChild(await T(sub, 'Small', 'text/tertiary'));
      return s;
    }
    async function settingRow(parent, label, desc, control) {
      const r = AL('HORIZONTAL', 'Setting · ' + label, { gap: 24, pad: [14, 0], align: 'CENTER' }); put(parent, r, 'FILL'); side(r, 'b');
      const tc = AL('VERTICAL', 'Text', { gap: 2 }); r.appendChild(tc);
      tc.appendChild(await T(label, 'Body strong', 'text/primary')); if (desc) { const d = await T(desc, 'Small', 'text/tertiary'); tc.appendChild(d); }
      spacer(r); if (control) r.appendChild(control); return r;
    }
    async function card(parent, name, o = {}) { const c = AL('VERTICAL', name, { gap: o.gap == null ? 12 : o.gap, pad: o.pad == null ? 16 : o.pad, radius: 8, fill: 'surface/panel', stroke: 'border/subtle' }); put(parent, c, 'FILL'); return c; }

    // ════════════════════ PATCH EXISTING SCREENS FOR CLOUD ════════════════════
    const PATCH = {
      'localhost:3000': 'Running · 4 cores', 'Open folder…': 'Upload folder…', 'Browse to a project on this machine': 'Upload a project from your computer',
      '~/code/acme-web': 'github.com/acme/web', '~/code/billing-api': 'github.com/acme/billing-api', '~/code/sensor-fw': 'github.com/acme/sensor-fw', '~/code/mobile-shell': 'github.com/acme/mobile-shell',
      '~/code/web': 'us-east · 4 cores', '~/code/item-log': 'us-east · 4 cores', '~/code/acme-web · 1,800 files': 'github.com/acme/web · 1,800 files · us-east'
    };
    const inInstance = n => { let p = n.parent; while (p) { if (p.type === 'INSTANCE') return true; p = p.parent; } return false; };
    let patched = 0;
    for (const t of scrPage.findAllWithCriteria({ types: ['TEXT'] })) {
      if (inInstance(t)) continue;
      const nv = PATCH[t.characters];
      if (nv !== undefined) { t.characters = nv; patched++; }
      if (t.characters === 'Location' && t.parent && t.parent.parent && /Options/.test(t.parent.parent.name || '')) { t.characters = 'Workspace'; patched++; }
    }

    // ════════════════════ CLOUD PIECES ════════════════════
    async function menuRow(parent, icon, label, o = {}) {
      const r = AL('HORIZONTAL', 'Item · ' + label, { gap: 8, pad: [6, 8], radius: 4, align: 'CENTER', fill: o.active ? 'surface/selected' : null }); put(parent, r, 'FILL');
      if (icon) r.appendChild(ICON(icon, o.active ? hx('text/primary') : hx('text/tertiary'), 14));
      r.appendChild(await T(label, o.mono ? 'Mono small' : 'Small', o.muted ? 'text/tertiary' : 'text/primary'));
      if (o.sub) r.appendChild(await T(o.sub, o.subMono ? 'Mono small' : 'Caption', 'text/tertiary'));
      spacer(r);
      if (o.key) r.appendChild(await kbd(o.key));
      if (o.check) r.appendChild(ICON(I.check, hx('text/primary'), 14));
      if (o.trailing) r.appendChild(o.trailing);
      return r;
    }
    function menuBox(name, width) { const m = AL('VERTICAL', name, { pad: 4, radius: 8, fill: 'surface/panel', stroke: 'border/control' }); m.effects = shadow; fixW(m, width); return m; }
    async function menuLabel(parent, text) { const h = AL('HORIZONTAL', 'Label', { pad: [6, 8, 4, 8] }); put(parent, h, 'FILL'); h.appendChild(await T(text, 'Caption', 'text/tertiary')); return h; }
    function menuDivider(parent) { const d = figma.createRectangle(); d.name = 'Divider'; d.resize(10, 1); d.fills = [paint('border/subtle')]; const w = AL('VERTICAL', 'Divider', { pad: [4, 0] }); put(parent, w, 'FILL'); w.appendChild(d); d.layoutSizingHorizontal = 'FILL'; return w; }

    const CLOUD_TOP = { server: 'Running · 4 cores' };
    function dim(cv, w, h, o = 0.72) { const r = figma.createRectangle(); r.name = 'Dim'; r.resize(w, h); r.fills = [paint('surface/canvas', o)]; at(cv, r, 0, 0); return r; }
    function centerCard(cv, w, h, name, width) { const c = AL('VERTICAL', name, { gap: 14, pad: 24, radius: 10, fill: 'surface/panel', stroke: 'border/subtle' }); c.effects = shadow; fixW(c, width); at(cv, c, 0, 0); return c; }
    const placeCenter = (c, w, h, dy = 0) => { c.x = Math.round((w - c.width) / 2); c.y = Math.round((h - c.height) / 2 + dy); };
    async function stepRows(parent, rows) {
      const st = AL('VERTICAL', 'Steps', { radius: 6, stroke: 'border/subtle' }); put(parent, st, 'FILL');
      for (let i = 0; i < rows.length; i++) {
        const [k, l, m] = rows[i];
        const r = AL('HORIZONTAL', 'Step · ' + l, { gap: 10, pad: [9, 12], align: 'CENTER' }); put(st, r, 'FILL'); if (i < rows.length - 1) side(r, 'b');
        r.appendChild(k === 'ok' ? ICON(I.check, hx('state/added/solid'), 14, 1.75) : k === 'run' ? ICON(I.spinner, hx('accent/solid'), 14, 1.75) : ICON(I.circle, hx('border/strong'), 14));
        r.appendChild(await T(l, 'Small', k === 'wait' ? 'text/tertiary' : 'text/primary')); spacer(r); if (m) r.appendChild(await T(m, 'Mono small', 'text/tertiary'));
      }
      return st;
    }

    // 32 · Workspace starting
    {
      const sh = await shell('32 · Workspace starting', { top: { server: 'Starting…', serverDot: 'accent/solid' }, reviewOpts: { tabs: [['Workspace', 'starting', 'Neutral']], summary: 'Restored from snapshot · 2 min ago', actions: false } });
      await entryPoints(sh.left);
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'plain'); dim(sh.center, sh.CW, sh.CH, 0.7);
      const c = centerCard(sh.center, sh.CW, sh.CH, 'Starting card', 420);
      const hd = AL('VERTICAL', 'Header', { gap: 4 }); put(c, hd, 'FILL'); hd.appendChild(await T('Starting acme-web', 'Heading', 'text/primary')); hd.appendChild(await T('Your last layout is shown behind. It becomes live as each part comes up.', 'Small', 'text/tertiary'));
      await stepRows(c, [['ok', 'Restoring snapshot', '2.1 GB · 3 s'], ['ok', 'Mounting backups and secrets', '1 s'], ['run', 'Installing dependencies', 'cache 92%'], ['wait', 'Starting dev server', 'npm run dev'], ['wait', 'Reconnecting canvas', '']]);
      put(c, meter(372, 0.55), 'FILL', 'FIXED');
      const ft = AL('HORIZONTAL', 'Footer', { align: 'CENTER' }); put(c, ft, 'FILL'); ft.appendChild(await T('Usually under 20 s', 'Caption', 'text/tertiary')); spacer(ft); ft.appendChild(await T('4 cores · us-east', 'Mono small', 'text/tertiary'));
      placeCenter(c, sh.CW, sh.CH, -40);
      const p = AL('VERTICAL', 'Agent', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL', 'FILL');
      p.appendChild(await T('Agent', 'Small strong', 'text/primary'));
      await wrapT(p, 'Claude Code reconnects when the workspace is running. Your last session and its checkpoints are kept.', 'Small', 'text/tertiary', 328);
    }

    // 33 · Workspace sleeping
    {
      const sh = await shell('33 · Workspace sleeping', { right: false, top: { server: 'Sleeping', serverDot: 'text/tertiary' }, reviewOpts: { tabs: [['Workspace', 'sleeping', 'Neutral']], summary: 'Last backup 2 min ago · checkpoint c21d88', actions: false } });
      await entryPoints(sh.left);
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); dim(sh.center, sh.CW, sh.CH, 0.78);
      const c = centerCard(sh.center, sh.CW, sh.CH, 'Sleeping card', 440);
      c.appendChild(ICON(I.clock, hx('text/secondary'), 20));
      c.appendChild(await T('This workspace went to sleep', 'Heading', 'text/primary'));
      await wrapT(c, 'It was idle for 10 minutes. Everything is saved: code, checkpoints, canvas layout and the agent session.', 'Small', 'text/secondary', 392);
      const facts = AL('VERTICAL', 'Facts', { gap: 6, pad: [10, 12], radius: 6, fill: 'surface/raised' }); put(c, facts, 'FILL');
      for (const [k, v] of [['Last backup', '2 min ago'], ['Last checkpoint', 'c21d88 · Shortened answers in prompt'], ['Resume time', 'about 5 s']]) {
        const r = AL('HORIZONTAL', 'Fact · ' + k, { gap: 12 }); put(facts, r, 'FILL'); r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 110)); r.appendChild(await T(v, 'Small', 'text/primary'));
      }
      const bb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(c, bb, 'FILL'); bb.appendChild(button('Ghost', 'Sleep settings')); bb.appendChild(button('Primary', 'Resume'));
      placeCenter(c, sh.CW, sh.CH, -40);
    }

    // 34 · Restore history
    {
      const sh = await shell('34 · Restore history', { top: CLOUD_TOP, reviewOpts: { tabs: [['History', '24', 'Neutral'], ['Snapshots', '6', 'Neutral']], summary: 'Backups kept 30 days on your plan', actions: false } });
      await entryPoints(sh.left);
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); await toolbar(sh.center, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Restore history', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL', 'FILL');
      const hd = AL('HORIZONTAL', 'Header', { align: 'CENTER' }); put(p, hd, 'FILL'); hd.appendChild(await T('Restore history', 'Heading', 'text/primary')); spacer(hd); hd.appendChild(ICON(I.x, hx('text/tertiary'), 14));
      const fl = AL('HORIZONTAL', 'Filters', { gap: 6 }); put(p, fl, 'FILL'); fl.appendChild(tag('Accent', 'All')); fl.appendChild(tag('Neutral', 'Checkpoints')); fl.appendChild(tag('Neutral', 'Autosaves')); fl.appendChild(tag('Neutral', 'Snapshots'));
      const list = AL('VERTICAL', 'Points', { gap: 0 }); put(p, list, 'FILL');
      const group = async t => { const g = AL('HORIZONTAL', 'Group', { pad: [8, 0, 4, 0] }); put(list, g, 'FILL'); g.appendChild(await T(t, 'Caption', 'text/tertiary')); };
      const point = async (kind, title, id, when, meta, sel) => {
        const r = AL('HORIZONTAL', 'Point · ' + title, { gap: 10, pad: [8, 10], radius: 6, align: 'CENTER', fill: sel ? 'surface/selected' : null }); put(list, r, 'FILL');
        r.appendChild(ICON(kind === 'cp' ? I.circle : kind === 'auto' ? I.clock : I.layers, sel ? hx('text/primary') : hx('text/tertiary'), 14));
        const tc = AL('VERTICAL', 'Text', { gap: 1 }); r.appendChild(tc); tc.appendChild(await T(title, 'Small', sel ? 'text/primary' : 'text/secondary'));
        const mr = AL('HORIZONTAL', 'Meta', { gap: 6 }); tc.appendChild(mr); if (id) mr.appendChild(await T(id, 'Mono small', 'text/tertiary')); mr.appendChild(await T(meta, 'Caption', 'text/tertiary'));
        spacer(r); r.appendChild(await T(when, 'Caption', 'text/tertiary'));
      };
      await group('Today');
      await point('cp', 'Shortened answers in prompt', 'c21d88', '2 min', '1 file');
      await point('auto', 'Autosave', '', '4 min', '2 files');
      await point('cp', 'Applied it to POST /api/items', '9b07e3', '6 min', '1 file', true);
      await point('cp', 'Added rateLimit middleware', '4f2a1c', '7 min', '2 files');
      await group('Yesterday');
      await point('snap', 'Snapshot on sleep', '', '19:40', '2.1 GB');
      await point('snap', 'Scheduled snapshot', '', '12:00', '2.1 GB');
      const sel = await card(p, 'Selected point', { gap: 10, pad: 14 });
      sel.appendChild(await T('9b07e3 · compared with now', 'Small strong', 'text/primary'));
      await codeBlock(sel, [['9', 'export async function POST(req) {'], ['+', '  await rateLimit(req, { perMinute: 20 })', 'added'], ['11', '  const item = await validateItem(req)']], { gutter: 14 });
      const ab = AL('HORIZONTAL', 'Actions', { gap: 6, justify: 'MAX' }); put(sel, ab, 'FILL'); ab.appendChild(button('Ghost', 'Restore a file…')); ab.appendChild(button('Secondary', 'Restore to here')); ab.appendChild(button('Primary', 'Open as copy'));
      await wrapT(p, 'Restoring never overwrites silently: “Open as copy” creates a new workspace beside this one.', 'Caption', 'text/tertiary', 328);
    }

    // 35 · Usage limit reached
    {
      const sh = await shell('35 · Usage limit reached', { right: false, top: { server: 'Paused', serverDot: 'state/modified/solid' }, reviewOpts: { tabs: [['Workspace', 'paused', 'Modified']], summary: 'Free plan · resets 1 Nov', actions: false } });
      await entryPoints(sh.left);
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'plain'); dim(sh.center, sh.CW, sh.CH, 0.78);
      const c = centerCard(sh.center, sh.CW, sh.CH, 'Limit card', 460);
      c.appendChild(await T('You’ve used this month’s free hours', 'Heading', 'text/primary'));
      await wrapT(c, 'Your work is saved. The workspace is paused until you upgrade or your hours reset. You can still read code and flows.', 'Small', 'text/secondary', 412);
      const u = AL('VERTICAL', 'Usage', { gap: 6 }); put(c, u, 'FILL');
      const ur = AL('HORIZONTAL', 'Label', {}); put(u, ur, 'FILL'); ur.appendChild(await T('Workspace hours', 'Small', 'text/secondary')); spacer(ur); ur.appendChild(await T('40 / 40 h', 'Mono small', 'text/primary'));
      put(u, meter(412, 1, 'state/modified/solid'), 'FILL', 'FIXED');
      const plans = AL('HORIZONTAL', 'Plans', { gap: 10 }); put(c, plans, 'FILL');
      for (const [n, pr, d, on] of [['Free', '$0', '40 h · 2 cores · 7-day history', false], ['Individual', 'usage-based', 'more hours · 4–8 cores · 30-day history', true]]) {
        const k = AL('VERTICAL', 'Plan · ' + n, { gap: 4, pad: 12, radius: 8, fill: on ? 'surface/selected' : 'surface/raised', stroke: on ? 'border/strong' : 'border/subtle' }); put(plans, k, 'FILL');
        const kr = AL('HORIZONTAL', 'Row', {}); put(k, kr, 'FILL'); kr.appendChild(await T(n, 'Small strong', 'text/primary')); spacer(kr); kr.appendChild(await T(pr, 'Caption', 'text/secondary'));
        await wrapT(k, d, 'Caption', 'text/tertiary', 180);
      }
      const bb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(c, bb, 'FILL'); bb.appendChild(button('Ghost', 'Remind me at reset')); bb.appendChild(button('Primary', 'Upgrade'));
      placeCenter(c, sh.CW, sh.CH, -30);
    }

    // 36 · Project secrets
    {
      const sh = await shell('36 · Project secrets', { center: 'stack', right: false, review: false, rail: 21, top: { title: 'Project settings', server: 'Running · 4 cores' } });
      await panelHeader(sh.left, 'acme-web');
      await listGroup(sh.left, 'Project', null, [{ label: 'General', icon: I.folder }, { label: 'Secrets', icon: I.lock, selected: true }, { label: 'Workspace', icon: I.chip }, { label: 'Run scripts', icon: I.terminal }, { label: 'Plugins', icon: I.puzzle }]);
      const m = sh.center; m.paddingLeft = 64; m.paddingTop = 40; m.paddingRight = 64;
      const col = AL('VERTICAL', 'Content', { gap: 20 }); fixW(col, 820); m.appendChild(col);
      await sectionTitle(col, 'Secrets', 'Environment variables for this project. Values are write-only once saved.');
      const note = AL('HORIZONTAL', 'Note', { gap: 10, pad: [12, 14], radius: 8, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' }); put(col, note, 'FILL');
      note.appendChild(ICON(I.shield, hx('text/secondary'), 16));
      await wrapT(note, 'Stored in an encrypted vault and injected into the workspace at runtime. Never indexed, never shown to the agent, never sent to a model.', 'Small', 'text/secondary', 740);
      const tb = AL('VERTICAL', 'Table', { radius: 8, stroke: 'border/subtle' }); put(col, tb, 'FILL');
      const th = AL('HORIZONTAL', 'Header', { gap: 16, pad: [8, 14], align: 'CENTER' }); put(tb, th, 'FILL'); side(th, 'b');
      for (const [l, w] of [['Name', 220], ['Value', 180], ['Used by', 160], ['Updated', 120]]) th.appendChild(await fixedT(l, 'Caption', 'text/tertiary', w));
      const ROWS = [['DATABASE_URL', 'dev server, tests', 'Armaan · 3 days'], ['REDIS_URL', 'worker', 'Armaan · 3 days'], ['STRIPE_SECRET_KEY', 'dev server', 'Maya · 1 week'], ['RESEND_API_KEY', 'worker', 'Maya · 1 week'], ['ANTHROPIC_API_KEY', 'agent sign-in', 'Armaan · today']];
      for (let i = 0; i < ROWS.length; i++) {
        const [n, used, upd] = ROWS[i];
        const r = AL('HORIZONTAL', 'Secret · ' + n, { gap: 16, pad: [10, 14], align: 'CENTER' }); put(tb, r, 'FILL'); if (i < ROWS.length - 1) side(r, 'b');
        r.appendChild(await fixedT(n, 'Mono small', 'text/primary', 220)); r.appendChild(await fixedT('••••••••••••', 'Mono small', 'text/tertiary', 180));
        r.appendChild(await fixedT(used, 'Small', 'text/secondary', 160)); r.appendChild(await fixedT(upd, 'Small', 'text/tertiary', 120)); spacer(r);
        r.appendChild(await T('Rotate', 'Small', 'text/secondary')); r.appendChild(await T('Delete', 'Small', 'state/removed/text'));
      }
      const add = await card(col, 'Add secret', { gap: 10, pad: 16 });
      add.appendChild(await T('Add a secret', 'Small strong', 'text/primary'));
      const ar = AL('HORIZONTAL', 'Fields', { gap: 10, align: 'CENTER' }); put(add, ar, 'FILL');
      ar.appendChild(await input(220, 'NAME', { mono: true, placeholder: true })); ar.appendChild(await input(300, 'Value', { placeholder: true, trailing: ICON(I.eye, hx('text/tertiary'), 14) }));
      ar.appendChild(await input(150, 'All environments', { trailing: ICON(I.chevDown, hx('text/tertiary'), 12) })); spacer(ar); ar.appendChild(button('Primary', 'Add'));
    }

    // 37 · Where to run
    {
      const sh = await shell('37 · Where to run', { top: CLOUD_TOP, reviewOpts: {} });
      await entryPoints(sh.left); await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); await toolbar(sh.center, sh.CW, sh.CH);
      await inspectorLLM(sh.right); await agentPanel(sh.right, 'done');
      const chipPop = menuBox('Workspace popover', 300);
      await menuLabel(chipPop, 'Workspace');
      for (const [k, v] of [['Status', 'Running'], ['Machine', '4 cores · 8 GB'], ['Region', 'us-east'], ['Last backup', '2 min ago'], ['This month', '31 h of 120 h']]) {
        const r = AL('HORIZONTAL', 'Row · ' + k, { gap: 8, pad: [5, 8] }); put(chipPop, r, 'FILL'); r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 90)); r.appendChild(await T(v, 'Small', 'text/primary'));
      }
      menuDivider(chipPop);
      await menuRow(chipPop, I.clock, 'Sleep now'); await menuRow(chipPop, I.layers, 'Restore history…'); await menuRow(chipPop, I.chip, 'Change where it runs…', { active: true });
      floatIn(sh.root, chipPop, 1440 - 300 - 150, 44);
      overlay(sh.root, 0.5);
      const d = AL('VERTICAL', 'Dialog · Where to run', { gap: 16, pad: 24, radius: 10, fill: 'surface/panel', stroke: 'border/subtle' }); d.effects = shadow; fixW(d, 640);
      floatIn(sh.root, d, 400, 200);
      d.appendChild(await T('Where should acme-web run?', 'Heading', 'text/primary'));
      const cards = AL('HORIZONTAL', 'Options', { gap: 12 }); put(d, cards, 'FILL');
      const opt = async (name, on, rows, footer) => {
        const k = AL('VERTICAL', 'Option · ' + name, { gap: 10, pad: 16, radius: 8, fill: on ? 'surface/selected' : 'surface/raised', stroke: on ? 'accent/solid' : 'border/subtle' }); put(cards, k, 'FILL');
        const kr = AL('HORIZONTAL', 'Title', { gap: 8, align: 'CENTER' }); put(k, kr, 'FILL'); kr.appendChild(ICON(name.startsWith('Cloud') ? I.globe : I.terminal, hx('text/secondary'), 16)); kr.appendChild(await T(name, 'Small strong', 'text/primary')); spacer(kr); if (on) kr.appendChild(tag('Accent', 'current'));
        for (const r of rows) await wrapT(k, r, 'Small', 'text/secondary', 250);
        if (footer) k.appendChild(footer);
      };
      await opt('Cloud workspace', true, ['Runs on our servers. Nothing to install.', 'Autosave, backups and sleep included.'], await input(250, '4 cores · 8 GB · us-east', { h: 28, trailing: ICON(I.chevDown, hx('text/tertiary'), 12) }));
      await opt('Local runner', false, ['Runs on your computer through a small app.', 'Needed for iOS simulators, hardware and GPUs.'], button('Secondary', 'Install runner'));
      const mv = AL('VERTICAL', 'Move', { gap: 6 }); put(d, mv, 'FILL');
      mv.appendChild(await T('Moving keeps code, checkpoints and the canvas layout. It goes through git:', 'Caption', 'text/tertiary'));
      await stepRows(mv, [['wait', 'Commit current checkpoint', ''], ['wait', 'Clone on the new location', ''], ['wait', 'Reconnect canvas', '']]);
      const bb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(d, bb, 'FILL'); bb.appendChild(button('Ghost', 'Cancel')); bb.appendChild(button('Primary', 'Keep in cloud'));
    }

    figma.viewport.scrollAndZoomIntoView(scrPage.children.filter(n => NEW_PREFIXES.some(p => n.name.startsWith(p))));
    const msg = `Done: added screens 32–37 (workspace starting, sleeping, restore history, usage limit, secrets, where to run); patched ${patched} labels in existing screens for cloud workspaces.`;
    log(msg);
    if (!IN_SCRIPTER) figma.closePlugin(msg);
  } catch (e) {
    const msg = 'Flowcanvas script failed: ' + (e && e.message ? e.message : e) + (e && e.stack ? '\n' + e.stack.split('\n').slice(0, 3).join('\n') : '');
    log(msg);
    if (!IN_SCRIPTER) figma.closePlugin(msg);
  }
})();
