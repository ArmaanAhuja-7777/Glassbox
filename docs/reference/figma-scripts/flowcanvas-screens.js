// Flowcanvas · Graphite (muted) · full screen set
// Paste into Scripter and run inside the Flowcanvas file.
// Rebuilds the "Components" and "Screens" pages. Safe to re-run.

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

    // ════════════════════ PAGES ════════════════════
    const compPage = figma.root.children.find(p => p.name === 'Components');
    const scrPage = figma.root.children.find(p => p.name === 'Screens');
    if (!compPage || !scrPage) throw new Error('This file needs pages named "Components" and "Screens".');
    await setPage(scrPage); scrPage.children.slice().forEach(n => n.remove());
    await setPage(compPage); compPage.children.slice().forEach(n => n.remove());

    // ════════════════════ COMPONENTS ════════════════════
    const frameSet = (set, gap) => {
      set.layoutMode = 'VERTICAL'; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'; set.itemSpacing = gap;
      set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 20;
      set.fills = [paint('surface/canvas')]; set.strokes = [paint('border/subtle')]; set.strokeWeight = 1; set.cornerRadius = 8;
    };
    const TONES = {
      Added: ['state/added/tint', 'state/added/text', '+ added'], Modified: ['state/modified/tint', 'state/modified/text', '~ modified'],
      Removed: ['state/removed/tint', 'state/removed/text', '− removed'], Affected: ['state/affected/tint', 'state/affected/text', 'affected'],
      Scope: ['state/scope/tint', 'state/scope/text', 'outside selection'], Neutral: ['surface/hover', 'text/secondary', 'label'], Accent: ['accent/tint', 'accent/text', 'label']
    };
    const tagComps = [];
    for (const [tone, [bg, fg, label]] of Object.entries(TONES)) {
      const c = figma.createComponent(); c.name = `Tone=${tone}`;
      c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
      c.paddingLeft = c.paddingRight = 6; c.paddingTop = c.paddingBottom = 1; c.cornerRadius = 4; c.fills = [paint(bg)];
      const t = await T(label, 'Caption', fg); t.name = 'Label'; c.appendChild(t); tagComps.push(c);
    }
    const tagSet = figma.combineAsVariants(tagComps, compPage); tagSet.name = 'Tag'; frameSet(tagSet, 10); tagSet.x = 0; tagSet.y = 0;
    const TAG_LABEL = tagSet.addComponentProperty('Label', 'TEXT', 'label');
    for (const v of tagSet.children) v.findOne(n => n.type === 'TEXT').componentPropertyReferences = { characters: TAG_LABEL };
    tagSet.description = 'State tag: muted tint background with readable text of the same hue.';
    const tag = (tone, label) => { const i = tagSet.children.find(c => c.name === `Tone=${tone}`).createInstance(); i.setProperties({ [TAG_LABEL]: label }); return i; };

    const KINDS = [['Primary', 'surface/inverse', 'text/on-accent', null], ['Secondary', 'surface/raised', 'text/primary', 'border/control'], ['Ghost', null, 'text/secondary', null], ['Danger', 'state/removed/tint', 'state/removed/text', null]];
    const btnComps = [];
    for (const [k, bg, fg, st] of KINDS) {
      const c = figma.createComponent(); c.name = `Kind=${k}`;
      c.layoutMode = 'HORIZONTAL'; c.resize(64, 28); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
      c.counterAxisAlignItems = 'CENTER'; c.paddingLeft = c.paddingRight = 10; c.cornerRadius = 4; c.fills = bg ? [paint(bg)] : [];
      if (st) { c.strokes = [paint(st)]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; }
      const t = await T('Button', 'Small strong', fg); t.name = 'Label'; c.appendChild(t); btnComps.push(c);
    }
    const btnSet = figma.combineAsVariants(btnComps, compPage); btnSet.name = 'Button'; frameSet(btnSet, 10); btnSet.x = 220; btnSet.y = 0;
    const BTN_LABEL = btnSet.addComponentProperty('Label', 'TEXT', 'Button');
    for (const v of btnSet.children) v.findOne(n => n.type === 'TEXT').componentPropertyReferences = { characters: BTN_LABEL };
    btnSet.description = '28 px. Primary is off-white on dark — one per view.';
    const button = (kind, label) => { const i = btnSet.children.find(c => c.name === `Kind=${kind}`).createInstance(); i.setProperties({ [BTN_LABEL]: label }); return i; };

    const STATES = [
      ['Default', null, null, null], ['Selected', null, null, null], ['Added', 'Added', 'state/added/solid', '+ added'], ['Modified', 'Modified', 'state/modified/solid', '~ modified'],
      ['Removed', 'Removed', 'state/removed/solid', '− removed'], ['Affected', 'Affected', 'state/affected/solid', 'affected'], ['Scope', 'Scope', 'state/scope/solid', 'outside selection'],
      ['Failing', 'Removed', 'state/removed/solid', 'failing'], ['Analysing', 'Neutral', null, 'analysing…']
    ];
    const nodeComps = [];
    for (const [s, tone, solid, label] of STATES) {
      const c = figma.createComponent(); c.name = `State=${s}`;
      c.layoutMode = 'HORIZONTAL'; c.resize(216, 54); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
      c.paddingLeft = 12; c.paddingRight = 10; c.paddingTop = c.paddingBottom = 9; c.itemSpacing = 10; c.cornerRadius = 6;
      c.counterAxisAlignItems = 'MIN'; c.fills = [paint('surface/raised')]; c.strokeAlign = 'INSIDE';
      if (s === 'Selected') {
        c.strokes = [paint('accent/solid')]; c.strokeWeight = 1.5;
        c.effects = [{ type: 'DROP_SHADOW', color: Object.assign(rgb(hx('accent/tint')), { a: 1 }), offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false }];
      } else if (s === 'Affected' || s === 'Scope') { c.strokes = [paint(solid)]; c.strokeWeight = 1; c.dashPattern = [4, 3]; }
      else if (solid) { c.strokes = [paint(solid, 0.5)]; c.strokeWeight = 1; }
      else { c.strokes = [paint('border/subtle')]; c.strokeWeight = 1; }
      const ico = figma.createFrame(); ico.name = 'Type icon'; ico.fills = []; ico.layoutMode = 'VERTICAL'; ico.resize(16, 20);
      ico.primaryAxisSizingMode = 'FIXED'; ico.counterAxisSizingMode = 'FIXED'; ico.primaryAxisAlignItems = 'CENTER';
      ico.appendChild(ICON(I.code, hx('text/tertiary'), 16)); c.appendChild(ico);
      const col = AL('VERTICAL', 'Text'); c.appendChild(col); col.layoutSizingHorizontal = 'FILL';
      const titleRow = AL('HORIZONTAL', 'Title row', { gap: 6, align: 'CENTER' }); col.appendChild(titleRow); titleRow.layoutSizingHorizontal = 'FILL';
      const title = await T('Node title', 'Body strong', 'text/primary'); title.name = 'Title'; titleRow.appendChild(title); title.textAutoResize = 'HEIGHT'; title.layoutSizingHorizontal = 'FILL';
      if (s === 'Removed') title.textDecoration = 'STRIKETHROUGH';
      if (tone) { const tg = tag(tone, label); tg.name = 'State tag'; titleRow.appendChild(tg); }
      const path = await T('src/file.ts:42', 'Mono small', 'text/tertiary'); path.name = 'Path'; col.appendChild(path); path.textAutoResize = 'HEIGHT'; path.layoutSizingHorizontal = 'FILL';
      if (solid && s !== 'Affected' && s !== 'Scope') {
        const bar = figma.createRectangle(); bar.name = 'State bar'; bar.resize(2, 38); bar.cornerRadius = 1; bar.fills = [paint(solid)];
        c.appendChild(bar); bar.layoutPositioning = 'ABSOLUTE'; bar.x = 0; bar.y = 8; bar.constraints = { horizontal: 'MIN', vertical: 'STRETCH' };
      }
      if (s === 'Removed' || s === 'Analysing') { title.opacity = 0.55; path.opacity = 0.55; ico.opacity = 0.55; }
      nodeComps.push(c);
    }
    const nodeSet = figma.combineAsVariants(nodeComps, compPage); nodeSet.name = 'Flow node'; frameSet(nodeSet, 16); nodeSet.x = 420; nodeSet.y = 0;
    const N_TITLE = nodeSet.addComponentProperty('Title', 'TEXT', 'Node title');
    const N_PATH = nodeSet.addComponentProperty('Path', 'TEXT', 'src/file.ts:42');
    for (const v of nodeSet.children) {
      v.findOne(n => n.name === 'Title').componentPropertyReferences = { characters: N_TITLE };
      v.findOne(n => n.name === 'Path').componentPropertyReferences = { characters: N_PATH };
    }
    nodeSet.description = 'Flow step. Neutral at rest; steel-blue outline when selected; muted state bar, border and tag when changed; dashed when possibly affected or outside the selection.';
    const flowNode = (state, title, path) => { const i = nodeSet.children.find(c => c.name === `State=${state}`).createInstance(); i.setProperties({ [N_TITLE]: title, [N_PATH]: path }); return i; };

    // ════════════════════ SCREEN FRAMEWORK ════════════════════
    await setPage(scrPage);
    let SLOT = 0;
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

    // ════════════════════ SCREENS ════════════════════

    // 01 · Start
    async function launcherCard(parent) {
      const cardF = AL('VERTICAL', 'Launcher', { radius: 10, fill: 'surface/panel', stroke: 'border/subtle' });
      cardF.resize(600, 100); cardF.primaryAxisSizingMode = 'AUTO'; cardF.counterAxisSizingMode = 'FIXED'; parent.appendChild(cardF);
      const hd = AL('VERTICAL', 'Header', { gap: 6, pad: [24, 24, 16, 24] }); put(cardF, hd, 'FILL');
      const hr = AL('HORIZONTAL', 'Brand', { gap: 10, align: 'CENTER' }); hd.appendChild(hr); hr.appendChild(markSvg()); hr.appendChild(await T('Flowcanvas', 'Heading', 'text/primary'));
      await wrapT(hd, 'Open a project to see it run, trace how it works, and change it with an agent.', 'Small', 'text/secondary', 552);
      const acts = AL('VERTICAL', 'Actions', { gap: 2, pad: [0, 12, 12, 12] }); put(cardF, acts, 'FILL');
      const ACTS = [[I.folder, 'Open folder…', 'Browse to a project on this machine', '⌘O'], [I.branch, 'Clone repository…', 'GitHub, GitLab or Bitbucket URL', '⇧⌘C'], [I.plus, 'New project…', 'Describe it, or start from a template', '⌘N']];
      for (let i = 0; i < ACTS.length; i++) {
        const [svg, title, desc, key] = ACTS[i];
        const r = AL('HORIZONTAL', 'Action · ' + title, { gap: 12, pad: [8, 12], radius: 6, align: 'CENTER', fill: i === 0 ? 'surface/hover' : null }); put(acts, r, 'FILL');
        r.appendChild(ICON(svg, i === 0 ? hx('text/primary') : hx('text/secondary'), 16));
        const tc = AL('VERTICAL', 'Text', { gap: 1 }); r.appendChild(tc); tc.appendChild(await T(title, 'Body strong', 'text/primary')); tc.appendChild(await T(desc, 'Small', 'text/tertiary'));
        spacer(r); r.appendChild(await kbd(key));
      }
      const rh = AL('HORIZONTAL', 'Recent header', { pad: [14, 24, 6, 24], align: 'CENTER' }); put(cardF, rh, 'FILL'); side(rh, 't');
      rh.appendChild(await T('Recent', 'Caption', 'text/tertiary')); spacer(rh); rh.appendChild(await T('Clear', 'Caption', 'text/tertiary'));
      const rl = AL('VERTICAL', 'Recent', { gap: 2, pad: [0, 12, 12, 12] }); put(cardF, rl, 'FILL');
      const REC = [['acme-web', '~/code/acme-web', 'Next.js', 'Full', '2m ago'], ['billing-api', '~/code/billing-api', 'FastAPI', 'Structural', 'Yesterday'], ['sensor-fw', '~/code/sensor-fw', 'ESP-IDF', 'Basic', 'Mon'], ['mobile-shell', '~/code/mobile-shell', 'React Native', 'Structural', 'Oct 12']];
      for (const [name, path, stack, level, when] of REC) {
        const r = AL('HORIZONTAL', 'Recent · ' + name, { gap: 16, pad: [8, 12], radius: 6, align: 'CENTER' }); put(rl, r, 'FILL');
        const tc = AL('VERTICAL', 'Text', { gap: 1 }); r.appendChild(tc); tc.appendChild(await T(name, 'Body strong', 'text/primary')); tc.appendChild(await T(path, 'Mono small', 'text/tertiary'));
        spacer(r); r.appendChild(await T(stack, 'Small', 'text/secondary')); r.appendChild(await fixedT(level, 'Small', 'text/tertiary', 72)); r.appendChild(await fixedT(when, 'Small', 'text/tertiary', 64, 'RIGHT'));
      }
      const ft = AL('HORIZONTAL', 'Footer', { gap: 6, pad: [12, 24], align: 'CENTER' }); put(cardF, ft, 'FILL'); side(ft, 't');
      ft.appendChild(dot('state/added/solid')); ft.appendChild(await T('Claude Code and Codex connected', 'Caption', 'text/tertiary')); spacer(ft); ft.appendChild(await T('v0.9.0', 'Mono small', 'text/tertiary'));
      return cardF;
    }
    { const s = screen('01 · Start', true); await launcherCard(s); }

    // 02 · Clone repository
    {
      const s = screen('02 · Clone repository', true);
      const bg = await launcherCard(s); bg.opacity = 0.35;
      overlay(s, 0.55);
      const m = AL('VERTICAL', 'Dialog · Clone', { gap: 16, pad: 24, radius: 10, fill: 'surface/panel', stroke: 'border/subtle' }); m.effects = shadow;
      fixW(m, 520); floatIn(s, m, 460, 250);
      m.appendChild(await T('Clone repository', 'Heading', 'text/primary'));
      const f1 = AL('VERTICAL', 'URL', { gap: 6 }); put(m, f1, 'FILL'); f1.appendChild(await T('Repository URL', 'Caption', 'text/secondary'));
      put(f1, await input(472, 'https://github.com/acme/web.git', { mono: true, focus: true }), 'FILL', 'FIXED');
      const row = AL('HORIZONTAL', 'Options', { gap: 12 }); put(m, row, 'FILL');
      const b1 = AL('VERTICAL', 'Branch', { gap: 6 }); put(row, b1, 'FILL'); b1.appendChild(await T('Branch', 'Caption', 'text/secondary')); put(b1, await input(200, 'main', { mono: true, trailing: ICON(I.chevDown, hx('text/tertiary'), 14) }), 'FILL', 'FIXED');
      const b2 = AL('VERTICAL', 'Location', { gap: 6 }); put(row, b2, 'FILL'); b2.appendChild(await T('Location', 'Caption', 'text/secondary')); put(b2, await input(200, '~/code/web', { mono: true, trailing: ICON(I.folder, hx('text/tertiary'), 14) }), 'FILL', 'FIXED');
      const pr = AL('VERTICAL', 'Progress', { gap: 6 }); put(m, pr, 'FILL');
      const pt = AL('HORIZONTAL', 'Label', {}); put(pr, pt, 'FILL'); pt.appendChild(await T('Receiving objects', 'Small', 'text/secondary')); spacer(pt); pt.appendChild(await T('1,284 / 2,010', 'Mono small', 'text/tertiary'));
      const mt = meter(472, 0.64, 'text/secondary'); put(pr, mt, 'FILL', 'FIXED');
      const bb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(m, bb, 'FILL'); bb.appendChild(button('Ghost', 'Cancel')); bb.appendChild(button('Primary', 'Clone and open'));
    }

    // 03 · Project setup
    {
      const s = screen('03 · Project setup', true);
      const c = AL('VERTICAL', 'Setup', { gap: 20, pad: 28, radius: 10, fill: 'surface/panel', stroke: 'border/subtle' }); fixW(c, 640); s.appendChild(c);
      const h = AL('VERTICAL', 'Header', { gap: 4 }); put(c, h, 'FILL'); h.appendChild(await T('Setting up acme-web', 'Title', 'text/primary')); h.appendChild(await T('~/code/acme-web · 1,800 files', 'Mono small', 'text/tertiary'));
      const det = await card(c, 'Detection', { gap: 10 });
      const dr = AL('HORIZONTAL', 'Row', { align: 'CENTER', gap: 8 }); put(det, dr, 'FILL');
      dr.appendChild(await T('This looks like a', 'Body', 'text/secondary')); dr.appendChild(await T('web app', 'Body strong', 'text/primary')); spacer(dr);
      dr.appendChild(await input(160, 'Web app', { trailing: ICON(I.chevDown, hx('text/tertiary'), 14), h: 28 }));
      const chips = AL('HORIZONTAL', 'Detected', { gap: 6 }); put(det, chips, 'FILL');
      for (const t of ['Next.js', 'TypeScript', 'Prisma', 'BullMQ', 'Vitest', 'Playwright']) chips.appendChild(tag('Neutral', t));
      const lv = await card(c, 'Support level', { gap: 10 });
      lv.appendChild(await T('Expected support', 'Caption', 'text/tertiary'));
      const seg = AL('HORIZONTAL', 'Levels', { gap: 4 }); put(lv, seg, 'FILL');
      for (const [n, d, on] of [['Basic', 'Editor and call graph', false], ['Structural', 'Typed flows and diffs', false], ['Full', 'Live preview and runtime evidence', true]]) {
        const sItem = AL('VERTICAL', 'Level · ' + n, { gap: 2, pad: [10, 12], radius: 6, fill: on ? 'surface/selected' : 'surface/raised', stroke: on ? 'border/strong' : 'border/subtle' }); put(seg, sItem, 'FILL');
        sItem.appendChild(await T(n, 'Small strong', on ? 'text/primary' : 'text/secondary')); sItem.appendChild(await T(d, 'Caption', 'text/tertiary'));
      }
      const st = AL('VERTICAL', 'Indexing', { gap: 0, radius: 8, stroke: 'border/subtle' }); put(c, st, 'FILL');
      const STEPS = [['ok', 'Parsing files', '1,800 / 1,800'], ['ok', 'Resolving types', '14,212 symbols'], ['ok', 'Finding entry points', '26 found'], ['run', 'Running framework connectors', '8 / 12'], ['wait', 'Starting dev server', 'npm run dev']];
      for (let i = 0; i < STEPS.length; i++) {
        const [k, l, m] = STEPS[i];
        const r = AL('HORIZONTAL', 'Step · ' + l, { gap: 10, pad: [10, 14], align: 'CENTER' }); put(st, r, 'FILL'); if (i < STEPS.length - 1) side(r, 'b');
        r.appendChild(k === 'ok' ? ICON(I.check, hx('state/added/solid'), 14, 1.75) : k === 'run' ? ICON(I.spinner, hx('accent/solid'), 14, 1.75) : ICON(I.circle, hx('border/strong'), 14));
        r.appendChild(await T(l, 'Small', k === 'wait' ? 'text/tertiary' : 'text/primary')); spacer(r); r.appendChild(await T(m, 'Mono small', 'text/tertiary'));
      }
      const ft = AL('HORIZONTAL', 'Footer', { gap: 8, align: 'CENTER' }); put(c, ft, 'FILL');
      ft.appendChild(await T('Usually under a minute for a project this size.', 'Small', 'text/tertiary')); spacer(ft); ft.appendChild(button('Ghost', 'Run in background')); ft.appendChild(button('Primary', 'Open when ready'));
    }

    // 04 · Gaps report
    {
      const sh = await shell('04 · Setup checks', { reviewOpts: { tabs: [['Checks', '3', 'Modified'], ['Entry points', '26', 'Neutral']], summary: 'First index · 48 s', actions: false } });
      await entryPoints(sh.left);
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'plain'); await toolbar(sh.center, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Setup checks', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL');
      p.appendChild(await T('Setup checks', 'Heading', 'text/primary'));
      await wrapT(p, 'A few things stop the full picture. Each one can be fixed now or later.', 'Small', 'text/tertiary', 328);
      const CH = [
        ['state/removed/solid', 'Preview needs DATABASE_URL', 'Live frames can’t load data without it. The value stays on this machine and is never indexed.', 'secret'],
        ['state/modified/solid', '3 routes not linked to handlers', 'Calls built from strings in lib/api.ts. Shown as unresolved edges.', 'Show routes'],
        ['state/modified/solid', 'No tests cover worker/', 'Runtime evidence will be missing for the background lane.', 'Ask agent to add tests']
      ];
      for (const [c, t, d, act] of CH) {
        const k = await card(p, 'Check · ' + t, { gap: 8, pad: 14 });
        const r = AL('HORIZONTAL', 'Title', { gap: 8, align: 'CENTER' }); put(k, r, 'FILL'); r.appendChild(dot(c)); r.appendChild(await T(t, 'Small strong', 'text/primary'));
        await wrapT(k, d, 'Small', 'text/tertiary', 298);
        if (act === 'secret') { put(k, await input(298, '••••••••••••••••', { mono: true, trailing: ICON(I.lock, hx('text/tertiary'), 14) }), 'FILL', 'FIXED'); const b = AL('HORIZONTAL', 'Buttons', { justify: 'MAX' }); put(k, b, 'FILL'); b.appendChild(button('Secondary', 'Save and reload')); }
        else { const b = AL('HORIZONTAL', 'Buttons', { justify: 'MAX' }); put(k, b, 'FILL'); b.appendChild(button('Ghost', act)); }
      }
    }

    // 05 · New project
    {
      const s = screen('05 · New project', true);
      const c = AL('VERTICAL', 'New project', { gap: 20, pad: 28, radius: 10, fill: 'surface/panel', stroke: 'border/subtle' }); fixW(c, 760); s.appendChild(c);
      c.appendChild(await T('New project', 'Title', 'text/primary'));
      const tabs = AL('HORIZONTAL', 'Tabs', { gap: 16 }); put(c, tabs, 'FILL'); side(tabs, 'b');
      for (const [l, a] of [['Describe it', true], ['Templates', false], ['Import', false]]) {
        const t = AL('VERTICAL', 'Tab · ' + l, { gap: 7 }); tabs.appendChild(t); t.appendChild(await T(l, a ? 'Small strong' : 'Small', a ? 'text/primary' : 'text/secondary'));
        const u = figma.createRectangle(); u.resize(10, 2); u.fills = a ? [paint('accent/solid')] : []; t.appendChild(u); u.layoutSizingHorizontal = 'FILL';
      }
      const ta = AL('VERTICAL', 'Prompt', { gap: 10, pad: 14, radius: 6, fill: 'surface/raised', stroke: 'accent/solid' }); put(c, ta, 'FILL');
      await wrapT(ta, 'An internal tool where the team logs items, a background worker summarises each one with an LLM, and watchers get an email when it’s ready.', 'Body', 'text/primary', 676);
      gapBox(ta, 16);
      const tr = AL('HORIZONTAL', 'Footer', { gap: 8, align: 'CENTER' }); put(ta, tr, 'FILL'); tr.appendChild(await T('148 / 2000', 'Mono small', 'text/tertiary')); spacer(tr); tr.appendChild(ICON(I.clip, hx('text/tertiary'), 14));
      const opts = AL('HORIZONTAL', 'Options', { gap: 12 }); put(c, opts, 'FILL');
      for (const [l, v] of [['Stack', 'Next.js · Postgres · BullMQ'], ['Agent', 'Claude Code'], ['Location', '~/code/item-log']]) {
        const g = AL('VERTICAL', l, { gap: 6 }); put(opts, g, 'FILL'); g.appendChild(await T(l, 'Caption', 'text/secondary')); put(g, await input(200, v, { mono: l === 'Location', trailing: ICON(I.chevDown, hx('text/tertiary'), 14) }), 'FILL', 'FIXED');
      }
      c.appendChild(await T('Or start from a template', 'Caption', 'text/tertiary'));
      const gridT = AL('HORIZONTAL', 'Templates', { gap: 10 }); put(c, gridT, 'FILL'); gridT.layoutWrap = 'WRAP'; gridT.counterAxisSpacing = 10;
      for (const [ic, t, d] of [[I.screen, 'Web app', 'Next.js, Postgres'], [I.route, 'API service', 'FastAPI or Express'], [I.terminal, 'CLI tool', 'Go or Node'], [I.phone, 'Mobile app', 'React Native'], [I.chip, 'Firmware', 'ESP-IDF or Zephyr'], [I.file, 'Empty', 'Just a folder']]) {
        const k = fixSize(AL('VERTICAL', 'Template · ' + t, { gap: 6, pad: 14, radius: 8, fill: 'surface/raised', stroke: 'border/subtle' }), 222, 96);
        gridT.appendChild(k); k.appendChild(ICON(ic, hx('text/secondary'), 16)); k.appendChild(await T(t, 'Small strong', 'text/primary')); k.appendChild(await T(d, 'Caption', 'text/tertiary'));
      }
      const ft = AL('HORIZONTAL', 'Footer', { gap: 8, justify: 'MAX' }); put(c, ft, 'FILL'); ft.appendChild(button('Ghost', 'Cancel')); ft.appendChild(button('Primary', 'Create project'));
    }

    // 06 · Workspace · after agent session
    {
      const sh = await shell('06 · Workspace · after session');
      await entryPoints(sh.left); await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); await toolbar(sh.center, sh.CW, sh.CH);
      await inspectorLLM(sh.right); await agentPanel(sh.right, 'done');
    }

    // 07 · Workspace · agent running
    {
      const sh = await shell('07 · Workspace · agent running', { reviewOpts: { tabs: [['Changed', '2', 'Modified'], ['Affected', '…', 'Neutral'], ['Tests', '–', 'Neutral'], ['Observed', '3', 'Neutral'], ['Unverified', '…', 'Neutral']], summary: 'Agent working · step 3 of 4', actions: false } });
      await entryPoints(sh.left); await workspaceFlow(sh.center, sh.CW, sh.CH, 'running'); await toolbar(sh.center, sh.CW, sh.CH);
      const toast = AL('HORIZONTAL', 'Toast · outside selection', { gap: 10, pad: [8, 12], radius: 6, align: 'CENTER', fill: 'surface/raised', stroke: 'state/scope/solid' }); toast.effects = shadow;
      toast.appendChild(dot('state/scope/solid')); toast.appendChild(await T('Agent edited lib/db.ts, outside your selection', 'Small', 'text/primary')); toast.appendChild(await T('View', 'Small strong', 'state/scope/text'));
      at(sh.center, toast, 0, 0); toast.x = Math.round((sh.CW - toast.width) / 2); toast.y = 48;
      await inspectorLLM(sh.right, { running: true }); await agentPanel(sh.right, 'running');
    }

    // 08 · Sequence view
    {
      const sh = await shell('08 · Sequence view', { center: 'stack', top: { view: 1 } });
      await entryPoints(sh.left);
      const m = sh.center; m.paddingTop = 16; m.paddingLeft = 20; m.paddingRight = 20; m.itemSpacing = 0;
      const hd = AL('HORIZONTAL', 'Header', { gap: 8, align: 'CENTER', pad: [0, 0, 16, 0] }); put(m, hd, 'FILL');
      hd.appendChild(await T('Save item', 'Small strong', 'text/primary')); hd.appendChild(await T('1.92 s end to end · run 12 · 2 min ago', 'Caption', 'text/tertiary')); spacer(hd);
      hd.appendChild(await T('Run', 'Caption', 'text/tertiary')); hd.appendChild(await input(130, 'run 12 · observed', { h: 26, trailing: ICON(I.chevDown, hx('text/tertiary'), 12) }));
      const LW = 230, TW = sh.CW - 40 - LW, TOTAL = 1920;
      const axis = AL('HORIZONTAL', 'Axis', { align: 'CENTER' }); put(m, axis, 'FILL'); side(axis, 'b');
      axis.appendChild(await fixedT('Step', 'Caption', 'text/tertiary', LW));
      const ticks = figma.createFrame(); ticks.name = 'Ticks'; ticks.fills = []; ticks.resize(TW, 24); axis.appendChild(ticks);
      for (const [ms, lab] of [[0, '0'], [500, '500 ms'], [1000, '1.0 s'], [1500, '1.5 s']]) { const t = await T(lab, 'Mono small', 'text/tertiary'); ticks.appendChild(t); t.x = Math.round(ms / TOTAL * TW); t.y = 4; }
      const rowsMain = [['onSubmit', 0, 4], ['rateLimit', 4, 2, 'Added'], ['validateItem', 6, 8], ['POST /api/items', 14, 96], ['db.items.insert', 40, 38], ['response 202', 110, 2]];
      const rowsBg = [['queue.add', 112, 6], ['processItem', 130, 1700], ['llm.complete', 160, 1520, 'Modified', true], ['parseResult', 1690, 30, 'Affected'], ['db.items.update', 1725, 42], ['notify', 1770, 140, null, false, true]];
      const seqRow = async (name, start, dur, tone, selected, suggested, indent) => {
        const r = AL('HORIZONTAL', 'Row · ' + name, { align: 'CENTER', fill: selected ? 'accent/tint' : null }); put(m, r, 'FILL'); side(r, 'b');
        const lab = AL('HORIZONTAL', 'Label', { gap: 6, pad: [0, 8, 0, indent ? 14 : 0], align: 'CENTER' }); fixW(lab, LW); r.appendChild(lab);
        lab.appendChild(await T(name, 'Mono small', selected ? 'text/primary' : 'text/secondary'));
        if (tone) lab.appendChild(tag(tone, tone === 'Added' ? '+' : tone === 'Modified' ? '~' : 'affected'));
        const track = figma.createFrame(); track.name = 'Track'; track.fills = []; track.resize(TW, 30); r.appendChild(track);
        const bar = figma.createRectangle(); bar.name = 'Span'; bar.resize(Math.max(3, Math.round(dur / TOTAL * TW)), 10); bar.cornerRadius = 2;
        const solid = tone === 'Added' ? 'state/added/solid' : tone === 'Modified' ? 'state/modified/solid' : tone === 'Affected' ? 'state/affected/solid' : 'border/strong';
        bar.fills = suggested ? [] : [paint(solid, tone ? 0.75 : 1)];
        if (suggested) { bar.strokes = [paint('border/strong')]; bar.dashPattern = [3, 2]; bar.strokeWeight = 1; }
        track.appendChild(bar); bar.x = Math.round(start / TOTAL * TW); bar.y = 10;
        const d = await T(dur >= 1000 ? (dur / 1000).toFixed(2) + ' s' : dur + ' ms', 'Mono small', 'text/tertiary'); track.appendChild(d);
        d.x = Math.min(TW - 60, bar.x + bar.width + 6); d.y = 7;
      };
      for (const r of rowsMain) await seqRow(r[0], r[1], r[2], r[3]);
      const bh = AL('HORIZONTAL', 'Background header', { gap: 6, pad: [12, 0, 6, 0], align: 'CENTER' }); put(m, bh, 'FILL');
      bh.appendChild(ICON(I.clock, hx('text/tertiary'), 12)); bh.appendChild(await T('Background · process-items · starts 2 ms after the response', 'Caption', 'text/tertiary'));
      for (const r of rowsBg) await seqRow(r[0], r[1], r[2], r[3], r[4], r[5], true);
      const lg = AL('HORIZONTAL', 'Legend', { gap: 16, pad: [16, 0, 0, 0], align: 'CENTER' }); put(m, lg, 'FILL');
      for (const [c, l, dash] of [['border/strong', 'observed span'], [null, 'order from code, no timing', true], ['state/modified/solid', 'changed in this session']]) {
        const it = AL('HORIZONTAL', 'Legend · ' + l, { gap: 6, align: 'CENTER' }); lg.appendChild(it);
        const sw = figma.createRectangle(); sw.resize(16, 6); sw.cornerRadius = 2; sw.fills = c ? [paint(c)] : []; if (dash) { sw.strokes = [paint('border/strong')]; sw.dashPattern = [3, 2]; } it.appendChild(sw);
        it.appendChild(await T(l, 'Caption', 'text/tertiary'));
      }
      await inspectorLLM(sh.right, { tab: 'runs' }); await agentPanel(sh.right, 'done');
    }

    // 09 · Before / after
    {
      const sh = await shell('09 · Before and after', { center: 'stack', left: false });
      const m = sh.center;
      const strip = AL('HORIZONTAL', 'Changed strip', { gap: 8, pad: [10, 16], align: 'CENTER', fill: 'surface/panel' }); put(m, strip, 'FILL'); side(strip, 'b');
      strip.appendChild(await T('Changed', 'Caption', 'text/tertiary'));
      for (const [tone, l] of [['Added', 'rateLimit'], ['Modified', 'llm.complete'], ['Modified', 'POST /api/items'], ['Affected', 'parseResult'], ['Affected', 'Items list']]) strip.appendChild(tag(tone, l));
      spacer(strip); strip.appendChild(button('Ghost', 'Swap sides')); strip.appendChild(button('Secondary', 'Exit compare'));
      const split = AL('HORIZONTAL', 'Split', {}); put(m, split, 'FILL', 'FILL');
      const half = (sh.CW - 1) / 2, HH = sh.CH - 49;
      for (const [label, sub, before] of [['Before', 'a3f9c21 · main', true], ['After', '6 steps · not committed', false]]) {
        const cv = figma.createFrame(); cv.name = 'Canvas · ' + label; cv.fills = [paint('surface/canvas')]; cv.clipsContent = true; put(split, cv, 'FILL', 'FILL');
        if (before) side(cv, 'r');
        grid(cv, Math.round(half), HH);
        const hl = AL('HORIZONTAL', 'Label', { gap: 8, align: 'CENTER' }); at(cv, hl, 20, 16); hl.appendChild(await T(label, 'Small strong', 'text/primary')); hl.appendChild(await T(sub, 'Mono small', 'text/tertiary'));
        const c1 = before ? [['Default', 'onSubmit', 'ui/ItemForm.tsx:84'], ['Default', 'validateItem', 'lib/validate.ts:12'], ['Default', 'POST /api/items', 'api/items/route.ts:9'], ['Default', 'db.items.insert', 'lib/db.ts:41']]
          : [['Default', 'onSubmit', 'ui/ItemForm.tsx:84'], ['Added', 'rateLimit', 'middleware/rateLimit.ts'], ['Default', 'validateItem', 'lib/validate.ts:12'], ['Modified', 'POST /api/items', 'api/items/route.ts:9'], ['Default', 'db.items.insert', 'lib/db.ts:41']];
        const c2 = before ? [['Default', 'processItem', 'worker/process.ts:10'], ['Default', 'llm.complete', 'worker/process.ts:42'], ['Default', 'parseResult', 'lib/parse.ts:7'], ['Default', 'notify', 'lib/notify.ts:19']]
          : [['Default', 'processItem', 'worker/process.ts:10'], ['Modified', 'llm.complete', 'worker/process.ts:42'], ['Affected', 'parseResult', 'lib/parse.ts:7'], ['Default', 'notify', 'lib/notify.ts:19']];
        chain(cv, 24, 56, c1);
        const n2 = chain(cv, 24 + 216 + 20, 128, c2);
        if (!before) ring(cv, n2[1]);
      }
      const p = AL('VERTICAL', 'Diff', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL');
      p.appendChild(await T('llm.complete · worker/process.ts', 'Small strong', 'text/primary'));
      p.appendChild(await T('1 line changed · prompt rules', 'Caption', 'text/tertiary'));
      await codeBlock(p, [['40', 'const res = await llm.complete({'], ['41', '  model: cfg.model,'], ['42', '  prompt: render(PROMPT, item),'], ['−', '  maxWords: 200,', 'removed'], ['+', '  maxWords: 80,', 'added'], ['44', '});']], { gutter: 16 });
      const ef = AL('VERTICAL', 'Effect', { gap: 8 }); put(p, ef, 'FILL');
      ef.appendChild(await T('Behaviour change', 'Caption', 'text/tertiary'));
      await wrapT(ef, 'Answers are cut to 80 words. parseResult expects a "summary" field that can now be truncated mid-sentence.', 'Small', 'text/secondary', 328);
      const ia = AL('HORIZONTAL', 'Actions', { gap: 8, justify: 'MAX' }); put(p, ia, 'FILL'); ia.appendChild(button('Ghost', 'Revert this')); ia.appendChild(button('Secondary', 'Open in editor'));
    }

    // 10 · Review panel expanded
    {
      const sh = await shell('10 · Review · expanded', { reviewOpts: { expanded: true } });
      await entryPoints(sh.left); await workspaceFlow(sh.center, sh.CW, sh.CH, 'after', { minimap: false });
      await inspectorLLM(sh.right);
    }

    // 11 · Code editor
    {
      const sh = await shell('11 · Code editor', { center: 'stack', right: false, rail: 2, top: { view: 2 } });
      await panelHeader(sh.left, 'Files', 'acme-web');
      await listGroup(sh.left, 'Project', null, [
        { label: 'api', icon: I.folder }, { label: 'items', icon: I.folder, indent: 1 }, { label: 'route.ts', icon: I.file, indent: 2, mono: true, tag: ['Modified', 'M'] },
        { label: 'lib', icon: I.folder }, { label: 'db.ts', icon: I.file, indent: 1, mono: true }, { label: 'parse.ts', icon: I.file, indent: 1, mono: true, state: 'state/affected/solid' },
        { label: 'middleware', icon: I.folder }, { label: 'rateLimit.ts', icon: I.file, indent: 1, mono: true, tag: ['Added', 'A'] },
        { label: 'worker', icon: I.folder }, { label: 'process.ts', icon: I.file, indent: 1, mono: true, selected: true, tag: ['Modified', 'M'] },
        { label: 'ui', icon: I.folder }, { label: 'ItemForm.tsx', icon: I.file, indent: 1, mono: true }, { label: 'package.json', icon: I.file, mono: true, muted: true }]);
      const m = sh.center;
      const tabs = AL('HORIZONTAL', 'Editor tabs', { fill: 'surface/panel' }); put(m, tabs, 'FILL'); side(tabs, 'b');
      for (const [n, a, tone] of [['process.ts', true, 'Modified'], ['rateLimit.ts', false, 'Added'], ['route.ts', false, 'Modified']]) {
        const t = AL('HORIZONTAL', 'Tab · ' + n, { gap: 6, pad: [10, 14], align: 'CENTER', fill: a ? 'surface/canvas' : null }); tabs.appendChild(t); side(t, 'r');
        t.appendChild(await T(n, 'Mono small', a ? 'text/primary' : 'text/secondary')); t.appendChild(dot(tone === 'Added' ? 'state/added/solid' : 'state/modified/solid', 5));
      }
      const bc = AL('HORIZONTAL', 'Breadcrumb', { gap: 6, pad: [8, 20], align: 'CENTER' }); put(m, bc, 'FILL');
      for (const [i, p] of ['worker', 'process.ts', 'processItem', 'llm.complete'].entries()) { if (i) bc.appendChild(ICON(I.chevRight, hx('text/tertiary'), 10)); bc.appendChild(await T(p, 'Mono small', i === 3 ? 'text/primary' : 'text/tertiary')); }
      spacer(bc); bc.appendChild(tag('Accent', 'flow · Save item'));
      const ed = AL('VERTICAL', 'Editor', { pad: [4, 0] }); put(m, ed, 'FILL', 'FILL');
      const LINES = [
        ['34', "import { llm } from '../lib/llm'"], ['35', "import { parseResult } from '../lib/parse'"], ['36', ''],
        ['37', 'export async function processItem(job: Job<Item>) {'], ['38', '  const item = job.data'], ['39', '  // summarise the item for watchers'],
        ['40', '  const res = await llm.complete({'], ['41', '    model: cfg.model,'], ['42', '    prompt: render(PROMPT, item),'], ['43', '    maxWords: 80,', 'modified'],
        ['44', '  })'], ['45', '  const out = parseResult(res.text)'], ['46', '  await db.items.update(item.id, out)'], ['47', "  await notify(item.watchers, 'item.processed')"], ['48', '}']
      ];
      for (const [n, text, kind] of LINES) {
        const r = AL('HORIZONTAL', 'Line ' + n, { gap: 0, align: 'CENTER', fill: kind ? 'state/modified/tint' : (n === '40' ? 'surface/panel' : null) }); put(ed, r, 'FILL');
        const gm = figma.createRectangle(); gm.resize(2, 20); gm.fills = kind ? [paint('state/modified/solid')] : []; r.appendChild(gm);
        r.appendChild(await fixedT(n, 'Mono', kind ? 'state/modified/text' : 'text/tertiary', 44, 'RIGHT'));
        gapBox(r, 1).resize(20, 1);
        const t = await T(text || ' ', 'Mono', 'text/primary'); r.appendChild(t);
        colorRange(t, /\b(import|from|export|async|function|const|await|return)\b/, 'accent/text');
        colorRange(t, /'[^']*'/, 'state/added/text');
        colorRange(t, /\/\/.*$/, 'text/tertiary');
        colorRange(t, /\b\d+\b/, 'state/modified/text');
        if (n === '40') { spacer(r); const ch = tag('Accent', '↳ node llm.complete'); r.appendChild(ch); gapBox(r, 1).resize(16, 1); }
      }
      spacer(ed);
      const sb = AL('HORIZONTAL', 'Status bar', { gap: 16, pad: [6, 16], align: 'CENTER', fill: 'surface/panel' }); put(m, sb, 'FILL'); side(sb, 't');
      for (const t of ['Ln 43, Col 17', 'Spaces: 2', 'UTF-8', 'TypeScript']) sb.appendChild(await T(t, 'Caption', 'text/tertiary'));
      spacer(sb); sb.appendChild(await T('0 errors · 1 warning', 'Caption', 'text/tertiary'));
    }

    // 12 · Terminal & run manager
    {
      const sh = await shell('12 · Terminal and run', { center: 'stack', rail: 7 });
      await entryPoints(sh.left);
      const cv = figma.createFrame(); cv.name = 'Canvas'; cv.fills = [paint('surface/canvas')]; cv.clipsContent = true; put(sh.center, cv, 'FILL', 'FILL');
      await workspaceFlow(cv, sh.CW, sh.CH, 'plain', { minimap: false });
      const dock = fixSize(AL('VERTICAL', 'Dock', { fill: 'surface/panel' }), sh.CW, 280); put(sh.center, dock, 'FILL', 'FIXED'); side(dock, 't');
      const dt = AL('HORIZONTAL', 'Dock tabs', { gap: 16, pad: [0, 16], align: 'MAX' }); put(dock, dt, 'FILL'); side(dt, 'b');
      for (const [l, a] of [['Terminal', true], ['Run', false], ['Logs', false], ['Problems', false]]) {
        const t = AL('VERTICAL', 'Tab · ' + l, { gap: 7, pad: [9, 0, 0, 0] }); dt.appendChild(t); t.appendChild(await T(l, a ? 'Small strong' : 'Small', a ? 'text/primary' : 'text/secondary'));
        const u = figma.createRectangle(); u.resize(10, 2); u.fills = a ? [paint('accent/solid')] : []; t.appendChild(u); u.layoutSizingHorizontal = 'FILL';
      }
      const dc = AL('HORIZONTAL', 'Dock content', {}); put(dock, dc, 'FILL', 'FILL');
      const procs = AL('VERTICAL', 'Processes', { gap: 6, pad: 10 }); fixW(procs, 240); put(dc, procs, 'FIXED', 'FILL'); side(procs, 'r');
      for (const [n, cmd, st, meta] of [['web', 'npm run dev', 'state/added/solid', ':3000 · 2h'], ['worker', 'npm run worker', 'state/added/solid', '3 jobs'], ['tests', 'vitest --watch', 'state/modified/solid', '1 failing'], ['db', 'docker compose up db', 'text/tertiary', 'stopped']]) {
        const p = AL('VERTICAL', 'Process · ' + n, { gap: 2, pad: [8, 10], radius: 6, fill: n === 'web' ? 'surface/selected' : null }); put(procs, p, 'FILL');
        const r = AL('HORIZONTAL', 'Row', { gap: 6, align: 'CENTER' }); put(p, r, 'FILL'); r.appendChild(dot(st)); r.appendChild(await T(n, 'Small strong', 'text/primary')); spacer(r); r.appendChild(await T(meta, 'Caption', 'text/tertiary'));
        p.appendChild(await T(cmd, 'Mono small', 'text/tertiary'));
      }
      const term = AL('VERTICAL', 'Terminal', { gap: 2, pad: [10, 16] }); put(dc, term, 'FILL', 'FILL');
      const OUT = [['~/code/acme-web $ npm run dev', 'text/primary'], ['> next dev -p 3000', 'text/tertiary'], ['  ▲ ready on http://localhost:3000', 'text/secondary'], ['  ✓ compiled /items/new in 412 ms', 'state/added/text'],
        ['POST /api/items 202 in 96 ms', 'text/secondary'], ['POST /api/items 429 in 3 ms   rateLimit: 21/20 per min', 'state/modified/text'], ['  ✓ compiled middleware in 88 ms', 'state/added/text'], ['~/code/acme-web $ ', 'text/primary']];
      for (const [l, c] of OUT) term.appendChild(await T(l, 'Mono small', c));
    }

    // 13 · Source control
    {
      const sh = await shell('13 · Source control', { center: 'stack', right: false, rail: 4, leftW: 300 });
      await panelHeader(sh.left, 'Source control', 'main');
      const cm = AL('VERTICAL', 'Commit', { gap: 8, pad: [4, 8, 8, 8] }); put(sh.left, cm, 'FILL');
      const msgBox = AL('VERTICAL', 'Message', { pad: 10, radius: 4, fill: 'surface/raised', stroke: 'border/control' }); put(cm, msgBox, 'FILL');
      await wrapT(msgBox, 'Rate-limit item creation; shorten LLM summaries to 80 words', 'Small', 'text/primary', 244);
      const cb = AL('HORIZONTAL', 'Buttons', { gap: 8 }); put(cm, cb, 'FILL'); const b1 = button('Primary', 'Commit 3 files'); put(cb, b1, 'FILL'); cb.appendChild(button('Secondary', 'Push'));
      await listGroup(sh.left, 'Changes', 3, [
        { label: 'middleware/rateLimit.ts', icon: I.file, mono: true, tag: ['Added', 'A'], meta: '+34', metaMono: true },
        { label: 'api/items/route.ts', icon: I.file, mono: true, tag: ['Modified', 'M'], meta: '+3 −1', metaMono: true },
        { label: 'worker/process.ts', icon: I.file, mono: true, tag: ['Modified', 'M'], meta: '+1 −1', metaMono: true, selected: true }], 284);
      await listGroup(sh.left, 'Checkpoints · this session', 4, [
        { label: 'Added rateLimit middleware', icon: I.circle, meta: '4f2a1c', metaMono: true }, { label: 'Applied it to POST /api/items', icon: I.circle, meta: '9b07e3', metaMono: true },
        { label: 'Shortened answers in prompt', icon: I.circle, meta: 'c21d88', metaMono: true, selected: true }, { label: 'Ran related tests', icon: I.circle, meta: 'tests', metaMono: true }], 284);
      const m = sh.center;
      const tl = AL('HORIZONTAL', 'Timeline', { gap: 0, pad: [14, 24], align: 'CENTER', fill: 'surface/panel' }); put(m, tl, 'FILL'); side(tl, 'b');
      const PTS = [['a3f9c21', 'main'], ['4f2a1c', 'step 1'], ['9b07e3', 'step 2'], ['c21d88', 'step 3'], ['now', 'working tree']];
      for (let i = 0; i < PTS.length; i++) {
        const p = AL('VERTICAL', 'Point · ' + PTS[i][0], { gap: 4, align: 'CENTER' }); tl.appendChild(p);
        const d = dot(i === 3 ? 'accent/solid' : 'border/strong', 10); p.appendChild(d);
        p.appendChild(await T(PTS[i][0], 'Mono small', i === 3 ? 'text/primary' : 'text/tertiary')); p.appendChild(await T(PTS[i][1], 'Caption', 'text/tertiary'));
        if (i < PTS.length - 1) { const ln = figma.createRectangle(); ln.resize(140, 1); ln.fills = [paint('border/control')]; tl.appendChild(ln); }
      }
      const dh = AL('HORIZONTAL', 'Diff header', { gap: 8, pad: [10, 20], align: 'CENTER' }); put(m, dh, 'FILL'); side(dh, 'b');
      dh.appendChild(await T('worker/process.ts', 'Mono small', 'text/primary')); dh.appendChild(tag('Modified', '+1 −1')); spacer(dh);
      dh.appendChild(await T('Unified', 'Caption', 'text/secondary')); dh.appendChild(await T('Split', 'Caption', 'text/tertiary'));
      const dv = AL('VERTICAL', 'Diff', { pad: [8, 20] }); put(m, dv, 'FILL', 'FILL');
      await codeBlock(dv, [['38', '  const item = job.data'], ['39', '  // summarise the item for watchers'], ['40', '  const res = await llm.complete({'], ['41', '    model: cfg.model,'], ['42', '    prompt: render(PROMPT, item),'], ['−', '    maxWords: 200,', 'removed'], ['+', '    maxWords: 80,', 'added'], ['44', '  })'], ['45', '  const out = parseResult(res.text)']], { gutter: 18 });
      gapBox(dv, 16);
      const af = AL('HORIZONTAL', 'Affects', { gap: 8, align: 'CENTER' }); put(dv, af, 'FILL'); af.appendChild(await T('Affects', 'Caption', 'text/tertiary')); af.appendChild(tag('Affected', 'parseResult')); af.appendChild(tag('Affected', 'Items list'));
    }

    // 14 · Debugger
    {
      const sh = await shell('14 · Debugger', { rail: 6, reviewOpts: { tabs: [['Paused', '1', 'Accent'], ['Breakpoints', '2', 'Neutral']], summary: 'Debugging worker · node --inspect', actions: false } });
      await entryPoints(sh.left);
      const f = await workspaceFlow(sh.center, sh.CW, sh.CH, 'debug');
      const pz = tag('Accent', 'paused'); at(sh.center, pz, f.X2 + 216 - 60, f.Y2[2] - 22);
      const db = AL('HORIZONTAL', 'Debug toolbar', { gap: 2, pad: 4, radius: 8, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' }); db.effects = shadow;
      for (const [svg, l] of [[I.play, 'Continue'], [I.stepOver, 'Step over'], [I.stepInto, 'Step into'], [I.stepOut, 'Step out'], [I.restart, 'Restart'], [I.stop, 'Stop']]) {
        const b = fixSize(AL('HORIZONTAL', l, { align: 'CENTER', justify: 'CENTER', radius: 4 }), 28, 28); b.appendChild(ICON(svg, l === 'Stop' ? hx('state/removed/solid') : hx('text/secondary'), 16)); db.appendChild(b);
      }
      at(sh.center, db, 0, 44); db.x = Math.round((sh.CW - db.width) / 2);
      await toolbar(sh.center, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Debug panel', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL', 'FILL');
      p.appendChild(await T('Paused on breakpoint', 'Caption', 'text/tertiary'));
      p.appendChild(await T('llm.complete', 'Heading', 'text/primary')); p.appendChild(await T('worker/process.ts:42', 'Mono small', 'accent/text'));
      p.appendChild(await T('Variables', 'Caption', 'text/tertiary'));
      const vars = AL('VERTICAL', 'Variables', { radius: 6, stroke: 'border/subtle', pad: [4, 0] }); put(p, vars, 'FILL');
      for (const [k, v, ind] of [['▾ item', 'Item', 0], ['id', '"itm_8f3k2"', 1], ['name', '"Quarterly report"', 1], ['watchers', 'Array(2)', 1], ['▾ cfg', 'Config', 0], ['model', '"model-name"', 1], ['maxWords', '80', 1], ['res', 'undefined', 0]]) {
        const r = AL('HORIZONTAL', 'Var · ' + k, { gap: 8, pad: [3, 10, 3, 10 + ind * 14] }); put(vars, r, 'FILL');
        r.appendChild(await T(k, 'Mono small', 'text/secondary')); spacer(r); r.appendChild(await T(v, 'Mono small', v.startsWith('"') ? 'state/added/text' : /^\d+$/.test(v) ? 'state/modified/text' : 'text/tertiary'));
      }
      p.appendChild(await T('Call stack', 'Caption', 'text/tertiary'));
      const cs = AL('VERTICAL', 'Call stack', { radius: 6, stroke: 'border/subtle', pad: [4, 0] }); put(p, cs, 'FILL');
      for (const [fn, loc, a] of [['processItem', 'worker/process.ts:42', true], ['Worker.run', 'bullmq/worker.js:410'], ['processTicksAndRejections', 'node:internal']]) {
        const r = AL('HORIZONTAL', 'Frame · ' + fn, { gap: 8, pad: [5, 10], fill: a ? 'surface/selected' : null }); put(cs, r, 'FILL');
        r.appendChild(await T(fn, 'Mono small', a ? 'text/primary' : 'text/secondary')); spacer(r); r.appendChild(await T(loc, 'Mono small', 'text/tertiary'));
      }
      p.appendChild(await T('Breakpoints', 'Caption', 'text/tertiary'));
      for (const [l, on] of [['worker/process.ts:42', true], ['lib/parse.ts:7', false]]) {
        const r = AL('HORIZONTAL', 'Breakpoint', { gap: 8, align: 'CENTER' }); put(p, r, 'FILL'); r.appendChild(dot(on ? 'state/removed/solid' : 'border/strong', 8)); r.appendChild(await T(l, 'Mono small', on ? 'text/secondary' : 'text/tertiary'));
      }
    }

    // 15 · Tests
    {
      const sh = await shell('15 · Tests', { rail: 5, reviewOpts: { tabs: [['Tests', '3/4', 'Modified'], ['Coverage', '71%', 'Neutral']], summary: 'vitest · 1.8 s', actions: false } });
      await panelHeader(sh.left, 'Tests', '4 related');
      const filt = AL('HORIZONTAL', 'Filter', { gap: 6, pad: [0, 8, 6, 8] }); put(sh.left, filt, 'FILL');
      filt.appendChild(tag('Accent', 'Related to this change')); filt.appendChild(tag('Neutral', 'All 48'));
      await listGroup(sh.left, 'api/items.test.ts', 2, [{ label: 'creates an item', icon: I.check, iconColor: hx('state/added/solid'), meta: '42 ms', metaMono: true }, { label: 'rate-limits after 20/min', icon: I.check, iconColor: hx('state/added/solid'), meta: '61 ms', metaMono: true }]);
      await listGroup(sh.left, 'worker/process.test.ts', 2, [{ label: 'summarises an item', icon: I.check, iconColor: hx('state/added/solid'), meta: '220 ms', metaMono: true }, { label: 'keeps full summary sentence', icon: I.x, iconColor: hx('state/removed/solid'), meta: '188 ms', metaMono: true, selected: true }]);
      const btn = AL('HORIZONTAL', 'Run', { pad: [12, 8] }); put(sh.left, btn, 'FILL'); put(btn, button('Secondary', 'Run related tests'), 'FILL');
      await workspaceFlow(sh.center, sh.CW, sh.CH, 'tests'); await toolbar(sh.center, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Failure', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL', 'FILL');
      const ph = AL('HORIZONTAL', 'Header', { gap: 8, align: 'CENTER' }); put(p, ph, 'FILL'); ph.appendChild(ICON(I.x, hx('state/removed/solid'), 14)); ph.appendChild(await T('keeps full summary sentence', 'Small strong', 'text/primary'));
      p.appendChild(await T('worker/process.test.ts:31 · failed at parseResult', 'Mono small', 'text/tertiary'));
      await codeBlock(p, [['', 'Expected: summary ends with "."'], ['', 'Received: "…watchers will be notified when the"']], { gutter: 0 });
      p.appendChild(await T('Trace', 'Caption', 'text/tertiary'));
      const tr = AL('VERTICAL', 'Trace', { radius: 6, stroke: 'border/subtle', pad: [4, 0] }); put(p, tr, 'FILL');
      for (const [fn, ms, bad] of [['processItem', '188 ms'], ['llm.complete', '160 ms'], ['parseResult', '2 ms', true]]) {
        const r = AL('HORIZONTAL', 'Span · ' + fn, { gap: 8, pad: [5, 10] }); put(tr, r, 'FILL'); r.appendChild(await T(fn, 'Mono small', bad ? 'state/removed/text' : 'text/secondary')); spacer(r); r.appendChild(await T(ms, 'Mono small', 'text/tertiary'));
      }
      await wrapT(p, 'Likely cause: the new 80-word limit truncates mid-sentence, and parseResult assumes a complete sentence.', 'Small', 'text/secondary', 328);
      const ia = AL('HORIZONTAL', 'Actions', { gap: 8, justify: 'MAX' }); put(p, ia, 'FILL'); ia.appendChild(button('Ghost', 'Open test')); ia.appendChild(button('Secondary', 'Ask agent to fix'));
    }

    // 16 · Command palette
    {
      const sh = await shell('16 · Command palette');
      await entryPoints(sh.left); await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); await toolbar(sh.center, sh.CW, sh.CH);
      await inspectorLLM(sh.right); await agentPanel(sh.right, 'done');
      overlay(sh.root, 0.6);
      const pal = AL('VERTICAL', 'Command palette', { radius: 10, fill: 'surface/panel', stroke: 'border/control' }); pal.effects = shadow; fixW(pal, 640); floatIn(sh.root, pal, 400, 120);
      const ir = AL('HORIZONTAL', 'Input', { gap: 10, pad: [14, 16], align: 'CENTER' }); put(pal, ir, 'FILL'); side(ir, 'b');
      ir.appendChild(ICON(I.search, hx('text/tertiary'), 16)); ir.appendChild(await T('save', 'Body', 'text/primary'));
      const caret = figma.createRectangle(); caret.resize(1, 16); caret.fills = [paint('text/primary')]; ir.appendChild(caret); spacer(ir); ir.appendChild(await kbd('esc'));
      const res = AL('VERTICAL', 'Results', { pad: [6, 8, 8, 8] }); put(pal, res, 'FILL');
      const grp = async (title, rows) => {
        const gl = AL('HORIZONTAL', 'Group · ' + title, { pad: [6, 10, 4, 10] }); put(res, gl, 'FILL'); gl.appendChild(await T(title, 'Caption', 'text/tertiary'));
        for (const [ic, l, d, k, a] of rows) {
          const r = AL('HORIZONTAL', 'Result · ' + l, { gap: 10, pad: [8, 10], radius: 6, align: 'CENTER', fill: a ? 'surface/selected' : null }); put(res, r, 'FILL');
          r.appendChild(ICON(ic, a ? hx('text/primary') : hx('text/tertiary'), 14)); r.appendChild(await T(l, 'Small', 'text/primary')); r.appendChild(await T(d, 'Mono small', 'text/tertiary')); spacer(r); if (k) r.appendChild(await kbd(k));
        }
        gapBox(res, 6);
      };
      await grp('Nodes', [[I.code, 'Save item', 'flow · Item editor', '↵', true], [I.code, 'db.items.insert', 'lib/db.ts:41']]);
      await grp('Commands', [[I.layers, 'Save view', 'canvas', '⌘S'], [I.refresh, 'Re-run last session', 'agent']]);
      await grp('Files', [[I.file, 'ItemForm.tsx', 'ui/'], [I.file, 'saveItem.test.ts', 'api/']]);
      const ft = AL('HORIZONTAL', 'Footer', { gap: 14, pad: [8, 16], align: 'CENTER' }); put(pal, ft, 'FILL'); side(ft, 't');
      for (const [k, l] of [['↑↓', 'navigate'], ['↵', 'open'], ['@', 'nodes'], ['>', 'commands']]) { const it = AL('HORIZONTAL', 'Hint', { gap: 6, align: 'CENTER' }); ft.appendChild(it); it.appendChild(await kbd(k)); it.appendChild(await T(l, 'Caption', 'text/tertiary')); }
    }

    // Settings / profile nav
    async function settingsNav(left, active) {
      await panelHeader(left, 'Settings');
      await listGroup(left, 'You', null, [{ label: 'Account', icon: I.user, selected: active === 'Account' }, { label: 'Notifications', icon: I.bell }, { label: 'Appearance', icon: I.sun }]);
      await listGroup(left, 'Workspace', null, [{ label: 'Agents', icon: I.robot, selected: active === 'Agents' }, { label: 'AI labels', icon: I.spark }, { label: 'Privacy and runtime', icon: I.shield, selected: active === 'Privacy' }, { label: 'Editor and keys', icon: I.keyboard }, { label: 'Project', icon: I.folder }]);
      await listGroup(left, 'Team', null, [{ label: 'Members', icon: I.user }, { label: 'Plan and billing', icon: I.card, selected: active === 'Billing' }]);
    }

    // 17 · Settings · privacy
    {
      const sh = await shell('17 · Settings · privacy', { center: 'stack', right: false, review: false, rail: 21, top: { title: 'Settings' } });
      await settingsNav(sh.left, 'Privacy');
      const m = sh.center; m.paddingLeft = 64; m.paddingTop = 40; m.paddingRight = 64; m.itemSpacing = 8;
      const col = AL('VERTICAL', 'Content', { gap: 0 }); fixW(col, 720); m.appendChild(col);
      await sectionTitle(col, 'Privacy and runtime', 'What leaves this machine, and what the product may observe while your code runs.');
      gapBox(col, 12);
      await settingRow(col, 'Local analysis only', 'Index and flows are built on this machine. Code is never uploaded.', await toggle(true));
      await settingRow(col, 'AI labels', 'Send short code excerpts to your model provider to name and summarise nodes.', await toggle(true));
      await settingRow(col, 'Model provider', 'Used for labels and summaries, not for the agent.', await input(220, 'Anthropic · own key', { trailing: ICON(I.chevDown, hx('text/tertiary'), 14) }));
      await settingRow(col, 'Trace the dev server', 'Record real calls while you click through live frames.', await toggle(true));
      await settingRow(col, 'Capture payloads', 'Store request bodies and prompts from traces. Secrets and personal data are masked.', await toggle(false));
      await settingRow(col, 'Masking rules', 'Fields matched here are always replaced with ••••.', await input(220, 'email, phone, *token*, *key*', { mono: true }));
      await settingRow(col, 'Usage telemetry', 'Anonymous counts only, never code or paths.', await toggle(false));
      gapBox(col, 24);
      const fb = AL('HORIZONTAL', 'Footer', { gap: 8, justify: 'MAX' }); put(col, fb, 'FILL'); fb.appendChild(button('Ghost', 'Reset to defaults')); fb.appendChild(button('Primary', 'Save'));
    }

    // 18 · Profile / account
    {
      const sh = await shell('18 · Account and profile', { center: 'stack', right: false, review: false, rail: 20, top: { title: 'Account' } });
      await settingsNav(sh.left, 'Account');
      const m = sh.center; m.paddingLeft = 64; m.paddingTop = 40; m.paddingRight = 64; m.itemSpacing = 24;
      const col = AL('VERTICAL', 'Content', { gap: 24 }); fixW(col, 760); m.appendChild(col);
      const hdr = AL('HORIZONTAL', 'Profile header', { gap: 16, align: 'CENTER' }); put(col, hdr, 'FILL');
      hdr.appendChild(await avatar('AK', 56, 'surface/selected'));
      const nm = AL('VERTICAL', 'Name', { gap: 2 }); hdr.appendChild(nm); nm.appendChild(await T('Armaan K.', 'Title', 'text/primary')); nm.appendChild(await T('armaan@acme.dev · Owner of Acme', 'Small', 'text/tertiary'));
      spacer(hdr); hdr.appendChild(button('Secondary', 'Change photo'));
      const prof = await card(col, 'Profile', { gap: 0, pad: [4, 16] });
      for (const [k, v, mono] of [['Display name', 'Armaan K.'], ['Email', 'armaan@acme.dev'], ['Username', 'armaan', true], ['Time zone', 'Asia/Kolkata (UTC+5:30)']]) {
        const r = AL('HORIZONTAL', 'Field · ' + k, { gap: 16, pad: [12, 0], align: 'CENTER' }); put(prof, r, 'FILL'); side(r, 'b');
        r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 160)); r.appendChild(await T(v, mono ? 'Mono small' : 'Small', 'text/primary')); spacer(r); r.appendChild(await T('Edit', 'Small', 'text/secondary'));
      }
      const two = AL('HORIZONTAL', 'Row', { gap: 16 }); put(col, two, 'FILL');
      const plan = AL('VERTICAL', 'Plan', { gap: 12, pad: 16, radius: 8, fill: 'surface/panel', stroke: 'border/subtle' }); put(two, plan, 'FILL');
      const ph = AL('HORIZONTAL', 'Header', { align: 'CENTER' }); put(plan, ph, 'FILL'); ph.appendChild(await T('Plan', 'Caption', 'text/tertiary')); spacer(ph); ph.appendChild(tag('Neutral', 'Team'));
      plan.appendChild(await T('Team · 6 seats', 'Heading', 'text/primary'));
      for (const [l, v, pct] of [['Agent sessions this month', '184 / 500', 0.37], ['Traced runs stored', '2.1 / 10 GB', 0.21], ['Seats used', '5 / 6', 0.83]]) {
        const u = AL('VERTICAL', 'Usage · ' + l, { gap: 6 }); put(plan, u, 'FILL');
        const ur = AL('HORIZONTAL', 'Label', {}); put(u, ur, 'FILL'); ur.appendChild(await T(l, 'Small', 'text/secondary')); spacer(ur); ur.appendChild(await T(v, 'Mono small', 'text/tertiary'));
        put(u, meter(300, pct), 'FILL', 'FIXED');
      }
      const pb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(plan, pb, 'FILL'); pb.appendChild(button('Ghost', 'Invoices')); pb.appendChild(button('Secondary', 'Manage plan'));
      const ag = AL('VERTICAL', 'Connected agents', { gap: 0, pad: [12, 16], radius: 8, fill: 'surface/panel', stroke: 'border/subtle' }); put(two, ag, 'FILL');
      ag.appendChild(await T('Connected agents', 'Caption', 'text/tertiary')); gapBox(ag, 6);
      for (const [n, d, on] of [['Claude Code', 'via Agent Client Protocol · v2', true], ['Codex', 'via adapter', true], ['Gemini CLI', 'not connected', false]]) {
        const r = AL('HORIZONTAL', 'Agent · ' + n, { gap: 10, pad: [10, 0], align: 'CENTER' }); put(ag, r, 'FILL'); side(r, 'b');
        r.appendChild(ICON(I.robot, on ? hx('text/secondary') : hx('text/tertiary'), 16));
        const tc = AL('VERTICAL', 'Text', { gap: 1 }); r.appendChild(tc); tc.appendChild(await T(n, 'Small strong', on ? 'text/primary' : 'text/secondary')); tc.appendChild(await T(d, 'Caption', 'text/tertiary'));
        spacer(r); r.appendChild(on ? await T('Connected', 'Caption', 'state/added/text') : button('Secondary', 'Connect'));
      }
      const keys = await card(col, 'API keys', { gap: 0, pad: [12, 16] });
      const kh = AL('HORIZONTAL', 'Header', { pad: [0, 0, 8, 0], align: 'CENTER' }); put(keys, kh, 'FILL'); kh.appendChild(await T('Model keys', 'Caption', 'text/tertiary')); spacer(kh); kh.appendChild(button('Ghost', 'Add key'));
      for (const [p, k, u] of [['Anthropic', 'sk-ant-••••••••3f2a', 'used 2 min ago'], ['OpenAI', 'sk-••••••••91bc', 'used 3 days ago']]) {
        const r = AL('HORIZONTAL', 'Key · ' + p, { gap: 16, pad: [10, 0], align: 'CENTER' }); put(keys, r, 'FILL'); side(r, 't');
        r.appendChild(await fixedT(p, 'Small strong', 'text/primary', 140)); r.appendChild(await T(k, 'Mono small', 'text/secondary')); spacer(r); r.appendChild(await T(u, 'Caption', 'text/tertiary')); r.appendChild(await T('Revoke', 'Small', 'state/removed/text'));
      }
      const dz = AL('HORIZONTAL', 'Sign out', { gap: 12, align: 'CENTER' }); put(col, dz, 'FILL');
      dz.appendChild(await T('Signed in on 2 devices', 'Small', 'text/tertiary')); spacer(dz); dz.appendChild(button('Ghost', 'Sign out everywhere')); dz.appendChild(button('Danger', 'Delete account'));
    }

    // 19 · Share and comments
    {
      const sh = await shell('19 · Share and comments');
      await entryPoints(sh.left);
      const f = await workspaceFlow(sh.center, sh.CW, sh.CH, 'after'); await toolbar(sh.center, sh.CW, sh.CH, { tools: [[I.cursor], [I.hand], [I.comment, true], [I.frame]] });
      const pin = async (x, y, init, active) => { const p = await avatar(init, 22, active ? 'accent/solid' : 'surface/selected'); p.topLeftRadius = 11; p.topRightRadius = 11; p.bottomRightRadius = 11; p.bottomLeftRadius = 2; if (active) p.children[0].fills = [paint('text/on-accent')]; return at(sh.center, p, x, y); };
      await pin(f.X2 + 216 - 8, f.Y2[3] - 14, 'MR', true); await pin(f.X1 + 216 - 8, f.Y1[1] - 14, 'AK');
      const p = AL('VERTICAL', 'Comments', { gap: 14, pad: 16 }); put(sh.right, p, 'FILL', 'FILL');
      const ph = AL('HORIZONTAL', 'Header', { align: 'CENTER' }); put(p, ph, 'FILL'); ph.appendChild(await T('Comments', 'Small strong', 'text/primary')); spacer(ph); ph.appendChild(await T('2 open', 'Caption', 'text/tertiary'));
      const th = await card(p, 'Thread · parseResult', { gap: 10, pad: 14 });
      const anchor = AL('HORIZONTAL', 'Anchor', { gap: 6, align: 'CENTER' }); put(th, anchor, 'FILL'); anchor.appendChild(await T('on', 'Caption', 'text/tertiary')); anchor.appendChild(tag('Affected', 'parseResult'));
      for (const [who, init, when, msg] of [['Maya R.', 'MR', '10 min', 'If answers can be cut at 80 words, this can return half a sentence. Should we trim to the last full stop?'], ['Armaan K.', 'AK', '4 min', 'Good catch — asking the agent to handle it and add a test.']]) {
        const c = AL('VERTICAL', 'Comment · ' + who, { gap: 6 }); put(th, c, 'FILL');
        const hr = AL('HORIZONTAL', 'Author', { gap: 8, align: 'CENTER' }); put(c, hr, 'FILL'); hr.appendChild(await avatar(init, 20)); hr.appendChild(await T(who, 'Small strong', 'text/primary')); hr.appendChild(await T(when, 'Caption', 'text/tertiary'));
        await wrapT(c, msg, 'Small', 'text/secondary', 298);
      }
      put(th, await input(298, 'Reply…', { placeholder: true, h: 30 }), 'FILL', 'FIXED');
      const tb = AL('HORIZONTAL', 'Buttons', { gap: 8, justify: 'MAX' }); put(th, tb, 'FILL'); tb.appendChild(button('Ghost', 'Resolve'));
      const share = AL('VERTICAL', 'Share popover', { gap: 12, pad: 16, radius: 8, fill: 'surface/panel', stroke: 'border/control' }); share.effects = shadow; fixW(share, 340);
      floatIn(sh.root, share, 1440 - 340 - 52, 46);
      share.appendChild(await T('Share this view', 'Small strong', 'text/primary'));
      const sr = AL('HORIZONTAL', 'Invite', { gap: 8 }); put(share, sr, 'FILL'); put(sr, await input(220, 'name@acme.dev', { placeholder: true, h: 28 }), 'FILL', 'FIXED'); sr.appendChild(button('Primary', 'Invite'));
      for (const [n, r] of [['Maya R.', 'Can comment'], ['Dev team', 'Can view']]) { const r2 = AL('HORIZONTAL', 'Member · ' + n, { gap: 8, align: 'CENTER' }); put(share, r2, 'FILL'); r2.appendChild(await avatar(n.slice(0, 2).toUpperCase(), 20)); r2.appendChild(await T(n, 'Small', 'text/primary')); spacer(r2); r2.appendChild(await T(r + ' ▾', 'Caption', 'text/tertiary')); }
      const lk = AL('HORIZONTAL', 'Link', { gap: 8, pad: [10, 0, 0, 0], align: 'CENTER' }); put(share, lk, 'FILL'); side(lk, 't');
      lk.appendChild(ICON(I.link, hx('text/tertiary'), 14)); lk.appendChild(await T('Anyone at Acme with the link', 'Caption', 'text/secondary')); spacer(lk); lk.appendChild(await T('Copy link', 'Caption', 'accent/text'));
    }

    // 20 · Pull request report (web)
    {
      const s = screen('20 · Pull request report');
      const top = fixSize(AL('HORIZONTAL', 'Header bar', { gap: 10, pad: [0, 24], align: 'CENTER', fill: 'surface/panel' }), 1440, 48); put(s, top, 'FILL', 'FIXED'); side(top, 'b');
      top.appendChild(markSvg()); top.appendChild(await T('Flowcanvas', 'Small strong', 'text/primary')); top.appendChild(await T('/', 'Small', 'text/tertiary')); top.appendChild(await T('acme/web', 'Small', 'text/secondary'));
      spacer(top); top.appendChild(button('Secondary', 'Open in Flowcanvas'));
      const page = AL('VERTICAL', 'Page', { gap: 20, pad: [32, 0], align: 'CENTER' }); put(s, page, 'FILL', 'FILL');
      const col = AL('VERTICAL', 'Column', { gap: 20 }); fixW(col, 960); page.appendChild(col);
      const h = AL('VERTICAL', 'Title', { gap: 6 }); put(col, h, 'FILL');
      const hr = AL('HORIZONTAL', 'Meta', { gap: 8, align: 'CENTER' }); put(h, hr, 'FILL'); hr.appendChild(ICON(I.pr, hx('text/secondary'), 16)); hr.appendChild(await T('#128', 'Mono small', 'text/tertiary')); hr.appendChild(tag('Neutral', 'open')); hr.appendChild(await T('agent/rate-limit → main', 'Mono small', 'text/tertiary'));
      h.appendChild(await T('Rate-limit item creation; shorten LLM summaries', 'Display', 'text/primary'));
      const chk = AL('HORIZONTAL', 'Check', { gap: 10, pad: [12, 14], radius: 8, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' }); put(col, chk, 'FILL');
      chk.appendChild(ICON(I.alert, hx('state/modified/solid'), 16)); chk.appendChild(await T('Behaviour review: 3 changes, 2 possibly affected flows, 1 failing test', 'Small', 'text/primary')); spacer(chk); chk.appendChild(await T('generated 4 min ago', 'Caption', 'text/tertiary'));
      const flows = AL('HORIZONTAL', 'Changed flows', { gap: 16 }); put(col, flows, 'FILL');
      for (const [title, items] of [['Save item', [['Default', 'onSubmit', 'ui/ItemForm.tsx:84'], ['Added', 'rateLimit', 'middleware/rateLimit.ts'], ['Modified', 'POST /api/items', 'api/items/route.ts:9']]], ['process-items', [['Default', 'processItem', 'worker/process.ts:10'], ['Modified', 'llm.complete', 'worker/process.ts:42'], ['Affected', 'parseResult', 'lib/parse.ts:7']]]]) {
        const c = AL('VERTICAL', 'Flow · ' + title, { radius: 8, fill: 'surface/panel', stroke: 'border/subtle' }); put(flows, c, 'FILL');
        const ch = AL('HORIZONTAL', 'Header', { pad: [10, 14], align: 'CENTER' }); put(c, ch, 'FILL'); side(ch, 'b'); ch.appendChild(await T(title, 'Small strong', 'text/primary')); spacer(ch); ch.appendChild(await T('View flow', 'Caption', 'accent/text'));
        const cv = figma.createFrame(); cv.name = 'Mini canvas'; cv.fills = [paint('surface/canvas')]; cv.resize(472, 236); put(c, cv, 'FILL', 'FIXED'); cv.clipsContent = true;
        chain(cv, 128, 16, items);
      }
      const scr = await card(col, 'Affected screens', { gap: 12 });
      scr.appendChild(await T('Affected screens', 'Caption', 'text/tertiary'));
      const pair = AL('HORIZONTAL', 'Pair', { gap: 16, align: 'CENTER' }); put(scr, pair, 'FILL');
      for (const [l, txt] of [['Before', 'Item summary is shown in full, up to 200 words.'], ['After', 'Item summary capped at 80 words; may end mid-sentence.']]) {
        const th = AL('VERTICAL', 'Thumb · ' + l, { gap: 6 }); put(pair, th, 'FILL');
        th.appendChild(await T(l + ' · Items list', 'Caption', 'text/tertiary'));
        const pv = AL('VERTICAL', 'Preview', { gap: 6, pad: 14, radius: 6, fill: 'preview/surface' }); put(th, pv, 'FILL');
        pv.appendChild(await T('Quarterly report', 'Small strong', 'preview/ink')); await wrapT(pv, txt, 'Small', 'preview/muted', 410);
        if (l === 'After') { pv.strokes = [paint('state/affected/solid')]; pv.dashPattern = [4, 3]; pv.strokeWeight = 1; }
      }
      const tests = await card(col, 'Tests', { gap: 0, pad: [8, 16] });
      for (const [ok, n, ms] of [[true, 'creates an item', '42 ms'], [true, 'rate-limits after 20/min', '61 ms'], [true, 'summarises an item', '220 ms'], [false, 'keeps full summary sentence', '188 ms']]) {
        const r = AL('HORIZONTAL', 'Test · ' + n, { gap: 10, pad: [8, 0], align: 'CENTER' }); put(tests, r, 'FILL'); side(r, 'b');
        r.appendChild(ok ? ICON(I.check, hx('state/added/solid'), 14, 1.75) : ICON(I.x, hx('state/removed/solid'), 14)); r.appendChild(await T(n, 'Small', ok ? 'text/secondary' : 'text/primary')); spacer(r); r.appendChild(await T(ms, 'Mono small', 'text/tertiary'));
      }
    }

    // 21 · Session report
    {
      const s = screen('21 · Session report');
      const top = fixSize(AL('HORIZONTAL', 'Header bar', { gap: 10, pad: [0, 24], align: 'CENTER', fill: 'surface/panel' }), 1440, 48); put(s, top, 'FILL', 'FIXED'); side(top, 'b');
      top.appendChild(markSvg()); top.appendChild(await T('Session report', 'Small strong', 'text/primary')); spacer(top); top.appendChild(button('Ghost', 'Export Markdown')); top.appendChild(button('Secondary', 'Share link'));
      const page = AL('VERTICAL', 'Page', { pad: [40, 0], align: 'CENTER' }); put(s, page, 'FILL', 'FILL');
      const col = AL('VERTICAL', 'Document', { gap: 24 }); fixW(col, 720); page.appendChild(col);
      const h = AL('VERTICAL', 'Title', { gap: 6 }); put(col, h, 'FILL'); h.appendChild(await T('Rate limit and shorter summaries', 'Display', 'text/primary'));
      h.appendChild(await T('acme-web · Claude Code · 21 Oct 2026, 14:02 · 4 steps · 52 s', 'Small', 'text/tertiary'));
      const req = AL('VERTICAL', 'Request', { gap: 6, pad: [0, 0, 0, 14] }); put(col, req, 'FILL'); side(req, 'l', 'border/strong');
      await wrapT(req, '“Add a rate limit to item creation and keep LLM answers under 80 words.”', 'Body', 'text/secondary', 680);
      const sumT = AL('HORIZONTAL', 'Summary', { gap: 12 }); put(col, sumT, 'FILL');
      for (const [n, l] of [['3', 'changed'], ['2', 'possibly affected'], ['3 / 4', 'tests passing'], ['1', 'unverified']]) {
        const k = AL('VERTICAL', 'Stat · ' + l, { gap: 2, pad: 14, radius: 8, fill: 'surface/panel', stroke: 'border/subtle' }); put(sumT, k, 'FILL');
        k.appendChild(await T(n, 'Title', 'text/primary')); k.appendChild(await T(l, 'Small', 'text/tertiary'));
      }
      await sectionTitle(col, 'Steps');
      const st = AL('VERTICAL', 'Steps', { radius: 8, stroke: 'border/subtle' }); put(col, st, 'FILL');
      for (const [i, l, id, files] of [[1, 'Added rateLimit middleware', '4f2a1c', 'middleware/rateLimit.ts'], [2, 'Applied it to POST /api/items', '9b07e3', 'api/items/route.ts'], [3, 'Shortened answers in prompt', 'c21d88', 'worker/process.ts'], [4, 'Ran 4 related tests, 3 passed', 'tests', '—']]) {
        const r = AL('HORIZONTAL', 'Step ' + i, { gap: 16, pad: [10, 14], align: 'CENTER' }); put(st, r, 'FILL'); if (i < 4) side(r, 'b');
        r.appendChild(await fixedT(String(i), 'Mono small', 'text/tertiary', 14)); r.appendChild(await fixedT(l, 'Small', 'text/primary', 300)); r.appendChild(await T(files, 'Mono small', 'text/tertiary')); spacer(r); r.appendChild(await T(id, 'Mono small', 'text/tertiary'));
      }
      await sectionTitle(col, 'Unverified');
      const un = AL('HORIZONTAL', 'Unverified', { gap: 10, pad: 14, radius: 8, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' }); put(col, un, 'FILL');
      un.appendChild(dot('text/tertiary')); un.appendChild(await T('notify → email provider: no trace or test reaches this call', 'Small', 'text/secondary')); spacer(un); un.appendChild(button('Ghost', 'Add a test'));
    }

    // Non-web helpers
    async function nonWebShell(name, project, groups, server) {
      const sh = await shell(name, { top: { project, server: server || 'not running', serverDot: server ? 'state/added/solid' : 'text/tertiary' }, reviewOpts: { tabs: [['Changed', '0', 'Neutral'], ['Observed', '4', 'Neutral'], ['Unverified', '3', 'Neutral']], summary: 'No agent session yet', actions: false } });
      await panelHeader(sh.left, 'Entry points', String(groups.reduce((a, g) => a + g[1].length, 0)));
      for (const [t, items] of groups) await listGroup(sh.left, t, items.length, items);
      grid(sh.center, sh.CW, sh.CH);
      return sh;
    }
    async function supportBanner(cv, text, x = 20, y = 16) {
      const b = AL('HORIZONTAL', 'Support banner', { gap: 8, pad: [6, 10], radius: 6, align: 'CENTER', fill: 'surface/panel', stroke: 'border/subtle' });
      b.appendChild(ICON(I.layers, hx('text/tertiary'), 14)); b.appendChild(await T(text, 'Caption', 'text/secondary')); return at(cv, b, x, y);
    }

    // 22 · CLI project
    {
      const sh = await nonWebShell('22 · CLI project', 'acme-cli', [['Commands', [{ label: 'acme sync', icon: I.terminal, mono: true, selected: true }, { label: 'acme init', icon: I.terminal, mono: true }, { label: 'acme login', icon: I.terminal, mono: true }]], ['Flags', [{ label: '--dry-run', icon: I.minus, mono: true }, { label: '--since <date>', icon: I.minus, mono: true }]]]);
      const cv = sh.center;
      await supportBanner(cv, 'Full support · Go · terminal recordings as frames');
      await frameLabel(cv, 20, 56, 'Recording', 'acme sync --dry-run');
      const tf = AL('VERTICAL', 'Terminal frame', { gap: 2, pad: 14, radius: 10, fill: 'surface/raised', stroke: 'border/subtle' }); fixW(tf, 300); at(cv, tf, 20, 78);
      for (const [l, c] of [['$ acme sync --dry-run', 'text/primary'], ['→ reading config ~/.acme.toml', 'text/tertiary'], ['→ fetching 42 records since 2026-10-01', 'text/secondary'], ['→ diffing against local cache', 'text/secondary'], ['  12 to update · 3 to create', 'text/secondary'], ['✓ dry run complete in 1.2 s', 'state/added/text']]) tf.appendChild(await T(l, 'Mono small', c));
      const n = chain(cv, 360, 78, [['Selected', 'cmd.Sync', 'cmd/sync.go:21'], ['Default', 'config.Load', 'internal/config.go:40'], ['Default', 'api.FetchSince', 'internal/api/client.go:88'], ['Default', 'cache.Diff', 'internal/cache/diff.go:15'], ['Default', 'printPlan', 'cmd/output.go:9']]);
      link(cv, [[320, 110], [340, 110], [340, n[0].y + 27], [360, n[0].y + 27]], { color: hx('accent/solid'), width: 1.5 });
      await minimap(cv, 20, sh.CH - 100); await toolbar(cv, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Inspector', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL');
      p.appendChild(await T('Command', 'Caption', 'text/tertiary')); p.appendChild(await T('acme sync', 'Heading', 'text/primary')); p.appendChild(await T('cmd/sync.go:21', 'Mono small', 'accent/text'));
      for (const [k, v] of [['Flags', '--dry-run, --since'], ['Reads', '~/.acme.toml'], ['Calls', 'GET /v1/records'], ['Exit codes', '0 ok · 2 conflict']]) { const r = AL('HORIZONTAL', 'Property · ' + k, { gap: 12 }); put(p, r, 'FILL'); r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 88)); r.appendChild(await T(v, 'Mono small', 'text/primary')); }
      await agentPanel(sh.right, 'done');
    }

    // 23 · Mobile project
    {
      const sh = await nonWebShell('23 · Mobile project', 'mobile-shell', [['Screens', [{ label: 'Inbox', icon: I.phone, selected: true }, { label: 'Item', icon: I.phone }, { label: 'Settings', icon: I.phone }]], ['Notifications', [{ label: 'item.ready', icon: I.bell, mono: true }]]], 'iPhone 15 · sim');
      const cv = sh.center;
      await supportBanner(cv, 'Structural support · React Native · simulator frames');
      await frameLabel(cv, 20, 56, 'Inbox', 'Simulator · iPhone 15');
      const ph = AL('VERTICAL', 'Phone frame', { gap: 10, pad: [40, 16, 24, 16], radius: 36, fill: 'preview/surface', stroke: 'border/strong' }); ph.strokeWeight = 6; fixSize(ph, 270, 560); at(cv, ph, 20, 80);
      ph.appendChild(await T('Inbox', 'Title', 'preview/ink'));
      for (const [t, sub, sel] of [['Quarterly report', 'Summary ready · 2m', true], ['Onboarding guide', 'Processing…'], ['Q3 metrics', 'Summary ready · 1h']]) {
        const r = AL('VERTICAL', 'Row', { gap: 2, pad: [10, 12], radius: 10, fill: 'preview/line', fillOpacity: 0.5 }); put(ph, r, 'FILL');
        r.appendChild(await T(t, 'Small strong', 'preview/ink')); r.appendChild(await T(sub, 'Caption', 'preview/muted'));
        if (sel) { r.strokes = [paint('accent/solid')]; r.strokeWeight = 2; r.strokeAlign = 'OUTSIDE'; }
      }
      const n = chain(cv, 330, 80, [['Selected', 'onPress', 'src/screens/Inbox.tsx:52'], ['Default', 'navigation.push', 'src/nav/stack.ts:18'], ['Default', 'useItem', 'src/hooks/useItem.ts:9'], ['Default', 'GET /api/items/:id', 'remote · acme-web'], ['Default', 'ItemScreen', 'src/screens/Item.tsx:12']]);
      link(cv, [[290, 190], [310, 190], [310, n[0].y + 27], [330, n[0].y + 27]], { color: hx('accent/solid'), width: 1.5 });
      await minimap(cv, 20, sh.CH - 100); await toolbar(cv, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Inspector', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL');
      p.appendChild(await T('UI element', 'Caption', 'text/tertiary')); p.appendChild(await T('InboxRow', 'Heading', 'text/primary')); p.appendChild(await T('src/screens/Inbox.tsx:52', 'Mono small', 'accent/text'));
      for (const [k, v] of [['Props', 'item, onPress'], ['State read', 'items[], filter'], ['Handler', 'onPress → navigation.push'], ['Platform', 'iOS · Android']]) { const r = AL('HORIZONTAL', 'Property · ' + k, { gap: 12 }); put(p, r, 'FILL'); r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 88)); r.appendChild(await T(v, 'Mono small', 'text/primary')); }
      await agentPanel(sh.right, 'done');
    }

    // 24 · Firmware project
    {
      const sh = await nonWebShell('24 · Firmware project', 'sensor-fw', [['Interrupts', [{ label: 'GPIO_ISR (button)', icon: I.bolt, mono: true }, { label: 'TIMER0_ISR', icon: I.bolt, mono: true, selected: true }]], ['Tasks', [{ label: 'sensor_task', icon: I.clock, mono: true }, { label: 'mqtt_task', icon: I.clock, mono: true }]], ['Peripherals', [{ label: 'I2C0 · BME280', icon: I.chip, mono: true }, { label: 'WiFi', icon: I.globe, mono: true }]]], 'QEMU · esp32');
      const cv = sh.center;
      await supportBanner(cv, 'Structural support · ESP-IDF · simulator, no hardware connected');
      await frameLabel(cv, 20, 56, 'Simulator', 'QEMU esp32 · 240 MHz');
      const sim = AL('VERTICAL', 'Simulator', { gap: 12, pad: 14, radius: 10, fill: 'surface/raised', stroke: 'border/subtle' }); fixW(sim, 300); at(cv, sim, 20, 78);
      const board = fixSize(AL('HORIZONTAL', 'Board', { gap: 10, pad: 12, radius: 6, fill: 'surface/canvas', stroke: 'border/control', align: 'CENTER' }), 272, 110); put(sim, board, 'FILL', 'FIXED');
      const chipF = fixSize(AL('VERTICAL', 'MCU', { align: 'CENTER', justify: 'CENTER', radius: 4, fill: 'surface/selected' }), 70, 70); board.appendChild(chipF); chipF.appendChild(await T('ESP32', 'Mono small', 'text/secondary'));
      const pins = AL('VERTICAL', 'Pins', { gap: 4 }); board.appendChild(pins);
      for (const [pn, st, c] of [['GPIO2  LED', 'high', 'state/added/solid'], ['GPIO0  BTN', 'low', 'text/tertiary'], ['SDA/SCL  I2C', 'active', 'state/modified/solid']]) { const r = AL('HORIZONTAL', 'Pin', { gap: 6, align: 'CENTER' }); pins.appendChild(r); r.appendChild(dot(c)); r.appendChild(await T(pn, 'Mono small', 'text/secondary')); r.appendChild(await T(st, 'Mono small', 'text/tertiary')); }
      sim.appendChild(await T('Serial · 115200', 'Caption', 'text/tertiary'));
      const ser = AL('VERTICAL', 'Serial monitor', { gap: 2, pad: 10, radius: 6, fill: 'surface/canvas' }); put(sim, ser, 'FILL');
      for (const l of ['I (1203) sensor: t=23.4C h=41%', 'I (2203) sensor: t=23.5C h=41%', 'I (2210) mqtt: publish acme/s1 ok', 'W (3203) sensor: i2c retry 1']) ser.appendChild(await T(l, 'Mono small', l.startsWith('W') ? 'state/modified/text' : 'text/secondary'));
      const n = chain(cv, 360, 78, [['Selected', 'TIMER0_ISR', 'main/timer.c:31'], ['Default', 'xQueueSendFromISR', 'freertos · queue'], ['Default', 'sensor_task', 'main/sensor.c:58'], ['Default', 'bme280_read', 'components/bme280.c:120'], ['Default', 'mqtt_publish', 'main/net.c:77']], { edges: [{ dash: '4 3' }, {}, {}, { dash: '1.5 4' }] });
      link(cv, [[320, 150], [340, 150], [340, n[0].y + 27], [360, n[0].y + 27]], { color: hx('accent/solid'), width: 1.5 });
      await minimap(cv, 20, sh.CH - 100); await toolbar(cv, sh.CW, sh.CH);
      const p = AL('VERTICAL', 'Inspector', { gap: 12, pad: 16 }); put(sh.right, p, 'FILL');
      p.appendChild(await T('Interrupt', 'Caption', 'text/tertiary')); p.appendChild(await T('TIMER0_ISR', 'Heading', 'text/primary')); p.appendChild(await T('main/timer.c:31', 'Mono small', 'accent/text'));
      for (const [k, v] of [['Trigger', 'timer0 · every 1000 ms'], ['Priority', '3'], ['Hands off to', 'sensor_task via queue'], ['Max duration', '18 µs observed']]) { const r = AL('HORIZONTAL', 'Property · ' + k, { gap: 12 }); put(p, r, 'FILL'); r.appendChild(await fixedT(k, 'Small', 'text/tertiary', 96)); r.appendChild(await T(v, 'Mono small', 'text/primary')); }
      await agentPanel(sh.right, 'done');
    }

    figma.viewport.scrollAndZoomIntoView(scrPage.children);
    const msg = `Done: muted palette applied, components rebuilt, ${SLOT} screens created.`;
    log(msg);
    if (!IN_SCRIPTER) figma.closePlugin(msg);
  } catch (e) {
    const msg = 'Flowcanvas script failed: ' + (e && e.message ? e.message : e) + (e && e.stack ? '\n' + e.stack.split('\n').slice(0, 3).join('\n') : '');
    log(msg);
    if (!IN_SCRIPTER) figma.closePlugin(msg);
  }
})();
