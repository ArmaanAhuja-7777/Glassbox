# 0008 — Headless accessible primitives: React Aria Components

- Status: accepted
- Date: 27 Oct 2026
- Phase: 1a (step 8)

## Context

Menus and tooltips (and later dialogs, popovers, comboboxes, tree views) need focus management, keyboard interaction, type-ahead, Escape and outside-click handling, positioning, and screen-reader wiring. Building these by hand is slow and error-prone, so we want a well-tested **headless** library (behaviour and accessibility, no styling) and style it with Graphite tokens.

Hard constraint: our Content-Security-Policy (`style-src 'self'`, `script-src 'self'`) blocks injected `<style>` elements and inline scripts.

## Options considered (tested, not just read)

Each candidate rendered a menu and a tooltip in a production Vite build, served with our exact CSP header and driven by Playwright (27 Oct 2026):

| | React Aria Components 1.22.1 | Radix (dropdown 2.2.1, tooltip 1.4.1) | Base UI 1.9.0 |
| --- | --- | --- | --- |
| Menu keyboard, Escape, focus return | ✅ | ✅ | ✅ |
| Tooltip on hover and keyboard focus | ✅ | focus only in our run | ✅ |
| Tooltip linked to trigger (`aria-describedby`) | ✅ | ✅ | ❌ (popup `role="presentation"`, no link) |
| CSP | 1 `<style>` on load (`[data-react-aria-pressable] { touch-action … }`): pre-emptable | 1 `<style>` on menu open (`react-remove-scroll`): scroll lock **breaks** without nonce plumbing | 0 |
| Bundle, menu + tooltip (gzip, over React) | ~+46 kB | ~+27 kB | ~+44 kB |
| Licence, maintenance | Apache-2.0, Adobe, active | MIT, active | MIT, active |

## Decision

**React Aria Components**, pinned in the catalog.
- Its accessibility is the most complete.
- Its single CSP issue has a supported escape hatch: React Aria skips injecting its style when an element with id `react-aria-pressable-style` exists.
- We ship the same rule in `packages/ui/src/styles/global.css`, and `preventReactAriaStyleInjection()` (`packages/ui/src/react-aria-csp.ts`) adds the marker before the first render, in the web app's `main.tsx` and in Storybook's `preview.ts`.
- Verified: 0 CSP violations, 0 injected `<style>` tags, and the touch rule still applies.

## Consequences

- Our components wrap React Aria (`Menu`, `MenuItem`, `MenuSection`, `MenuSeparator`, `MenuButton`, `Tooltip`). Product code imports from `@flowcanvas/ui`, never from `react-aria-components` directly.
- **Triggers:** React Aria needs its own pressable or focusable trigger. `MenuButton` is React Aria's `Button` with our Button styles; `Tooltip` wraps its child in `Focusable`, so our `Button` works as a tooltip trigger.
- **Tree-shaking keeps cost proportional:** importing `@flowcanvas/ui` without using a menu or tooltip added 0.26 kB to the web bundle.
- **Testing:** use `@testing-library/user-event`. React Aria calls `onAction(key, …)`, restores focus one frame after closing (use `waitFor`), and ignores hover until a real pointer interaction has happened (click once before hovering in tests).
- **axe notes:**
  - `label-content-name-mismatch` flags menu items with a keyboard shortcut. React Aria exposes the shortcut through `aria-describedby`, so the accessible name equals the visible label (WCAG 2.5.3 satisfied); treat as a known false positive for `[role=menuitem]` containing `kbd`.
  - `color-contrast` can flag popovers mid fade-in; check after animations finish.
- If a new React Aria version injects other styles or scripts, the CSP test in phase 1a step 10 must catch it.
