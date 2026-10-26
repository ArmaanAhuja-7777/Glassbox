# Decisions log

Answers to open questions raised during the project, with dates. Check here before asking a question that may already be settled. Engineering decisions with options and consequences go in `docs/adr/`; this log records product and project decisions made by the project owner.

## 26 Oct 2026: answers to the kick-off questions

### A1. Colours: muted palette is final

The muted palette is correct and final. The Graphite doc was outdated on colour only (now updated). Until the Figma variables can be read directly, use these values (dark theme):

| Group | Tokens |
| --- | --- |
| Surfaces | canvas #0B0C0E, panel #111317, raised #181B20, hover #1E2228, selected #252A31, inverse #E6E8EB |
| Borders | subtle #2C323A, control #383F49, strong #4A525E |
| Text | primary #EDEFF2, secondary #A3AAB5, tertiary #6B7380, on-accent #0B0C0E |
| Accent (steel blue, selection and focus only) | solid #7487AD, hover #8496BB, tint #182031, ring #34405A, text #A9B7D3 |
| States (solid / tint / text) | added #6E9C82 / #18221D / #9FC2AD · modified #B39B6B / #24211A / #D2BE93 · removed #B07473 / #261B1B / #CFA09F · affected #8C83B0 / #1F1D29 / #B5AED3 · outside selection #A97A96 / #251C22 / #C9A3BA |
| Edges | observed #A3AAB5, default #6B7380 |
| App preview (inside live frames) | surface #FFFFFF, ink #1F2328, muted #6E7781, line #E5E7EB, brand #1F2328 |

- Primary button: inverse background (#E6E8EB) with dark text (#0B0C0E). Never a blue button.
- Type: Inter (UI) and JetBrains Mono (code). Display 24/32 600, Title 20/28 600, Heading 15/22 600, Body 13/20 400, Body strong 13/20 500, Small 12/16 400, Small strong 12/16 500, Caption 11/14 500, Mono 12/18, Mono small 11/16.
- Radii 4 / 6 / 8 / 10. 4 px spacing grid. Sentence-case labels, no ALL CAPS.
- Light theme is not defined in the muted palette yet: to be proposed in phase 1a for approval.

### A2. Design brief

Graphite (as corrected) and the Figma screens override the design brief on visual values. The brief stays the reference for behaviour.

### A3. Tokens and Figma

Build `tools/figma-tokens` to read a Figma variables JSON export. Until then, use a hand-written seed JSON with the A1 values, recorded in a temporary ADR.

- Figma file: https://www.figma.com/design/aV9vPto305pKFPlvWQOBX8
- Generator scripts (`flowcanvas-screens.js`, `flowcanvas-prompting-screens.js`, `flowcanvas-cloud-screens.js`): their `HEX` maps and layout values are an exact fallback reference.

### A4. Cloud-first copy

Rewrite any local-first copy to cloud-first wording everywhere:

- Keys live in the encrypted secrets vault (not the OS keychain).
- "Local analysis only" becomes a "Self-hosted models only" option.
- "Open folder" becomes "Upload folder" / "Clone from URL".

### A5. Layout

The Figma file is the layout reference: a 40 px top bar (project, branch, Graph / Sequence / Code switch, search, workspace status, share, avatar) and a 40 px review bar. Where the prototype screenshots in `docs/reference/screens/` differ, follow Figma, and list the differences for the owner at phase 2.

### A6. Hosting

- Code: GitHub, https://github.com/ArmaanAhuja-7777/Glassbox
- Web app: Cloudflare Pages, with per-PR previews
- Control-plane stub: Fly.io
- Prefer free tiers for now.
- The owner sets up each account and connection themselves; Claude teaches how.

### A7. Naming

- The product name is not final (shortlist: Throughline, Cutaway).
- Use the working name **Flowcanvas** and the `@flowcanvas/*` package scope, so a rename later is mechanical.
- Never use "Glassbox" in code or package names (trademark conflict). The folder and repository name don't matter.

### A8. Test-repo licences

Private forks in the owner's org, pinned to exact commits. They are used only inside workspaces and never redistributed until licences are checked (Rallly and Documenso are AGPL).

### A9. Phase count and scope

- The build plan's 96 phases (81 numbered + 15 lettered) are authoritative.
- Keep following the build plan as written. Don't change scope based on the feasibility (research) report unless the owner says so.

### Working mode (same date)

Teaching mode: the owner types code, config, tests and CI by default; Claude teaches in chat, plans and reviews, and does a step itself when asked. See section 4a of `CLAUDE.md`.

## 26 Oct 2026: branch protection (phase 1, step 10)

The free GitHub plan can't protect branches on private repositories. Decision: **option 3**. CI runs on every PR, and we merge only when it's green and never push to `main` directly. Upgrade to GitHub Pro later. Tracked in `docs/upgrade-later.md` (item 1), which lists every deferred upgrade with its trigger.
