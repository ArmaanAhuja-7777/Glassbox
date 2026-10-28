/**
 * React Aria injects a small <style id="react-aria-pressable-style"> on first use. Our
 * Content-Security-Policy (style-src 'self') blocks injected <style> elements, so the browser
 * refuses it and logs a violation. React Aria skips the injection when an element with that id
 * already exists, and `global.css` carries the same rule, so we add that marker before rendering.
 */
export const REACT_ARIA_PRESSABLE_STYLE_ID = 'react-aria-pressable-style';

/** Call once, before the first React render (app entry and Storybook preview). */
export function preventReactAriaStyleInjection(doc: Document = document): void {
  if (doc.getElementById(REACT_ARIA_PRESSABLE_STYLE_ID) !== null) {
    return;
  }
  const marker = doc.createElement('meta');
  marker.id = REACT_ARIA_PRESSABLE_STYLE_ID;
  doc.head.append(marker);
}
