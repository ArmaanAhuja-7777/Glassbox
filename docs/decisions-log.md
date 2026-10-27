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

## 26 Oct 2026: repository made public; Actions still blocked (phase 1, step 10)

GitHub Actions wouldn't run: on the private repository every run ended in `startup_failure`, even a one-line workflow. The owner made the repository **public**. Runs then *started*, but every job failed with GitHub's annotation "The job was not started because your account is locked due to a billing issue". The lock is account-wide, so visibility doesn't affect it.

Decision: **resolve the billing lock later and continue building now.** Until then:
- CI checks run locally: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
- Steps 11 and 12 use paths that don't need GitHub Actions (Cloudflare Pages' own Git integration for PR previews; Fly.io deploys from the owner's machine).
- Phase 1 can't be fully accepted until the workflow runs green on GitHub.

The repository stays public for now; making it private again is a separate choice. While public, no secrets, personal or account details go into it, and forks of AGPL test repos stay out of it (decision A8). Tracked in `docs/upgrade-later.md` (items 8 and 9).

## 27 Oct 2026: light theme approved (phase 1a, step 2)

The owner approved the proposed Graphite light theme: same 40 colour roles as dark, all WCAG AA pairs passing (enforced by tests), and a **near-black primary button with off-white text** in light (the inverse of dark's off-white button). Values: `packages/tokens/source/color.light.tokens.json` and the Graphite doc's "Light theme" section.

## 27 Oct 2026: caption colour, `text/muted` (phase 1a, step 4)

axe-core in Storybook found that captions in `text/tertiary` fail WCAG AA (4.08:1 dark, 3.26:1 light; text needs 4.5:1). The owner chose **option B**: a new token **`text/muted`** (dark `#818995`, light `#666E7A`, ≥ 4.5:1 on canvas, panel, raised and hover) for captions, section labels and metadata. `text/tertiary` is **non-text only** from now on (icons, edges, placeholders, disabled marks). Metadata on selected rows uses `text/secondary`. Enforced by the token contrast tests.

## 27 Oct 2026: Input and Toggle details (phase 1a, step 6)

Engineering decisions, made within the design rules:
- **Input radius 6 px**, following Graphite ("6 nodes and inputs"), which ranks above the Figma screens (they draw 4 px).
- **Placeholders use `text/muted`** (4.9:1 dark, 5.2:1 light). Placeholders are text, so `text/tertiary` (3.6 / 3.35) would fail AA. This tightens the 27 Oct caption decision: `text/tertiary` is never used for any text.
- **Toggle off knob uses `text/secondary`** (Figma: tertiary), so the knob that shows the state has ≥ 3:1 against its track (6.2 dark, 4.9 light; tertiary would be 3.0 / 2.75).

Input border: owner chose **option A** (keep `border/control`, 1.6:1). Every input has a visible label and the focus state passes. Logged for an accessibility review before public beta (`docs/upgrade-later.md` item 15).
