import { afterEach, describe, expect, it } from 'vitest';
import { preventReactAriaStyleInjection, REACT_ARIA_PRESSABLE_STYLE_ID } from './react-aria-csp';

afterEach(() => {
  document.getElementById(REACT_ARIA_PRESSABLE_STYLE_ID)?.remove();
});

describe('preventReactAriaStyleInjection', () => {
  it('adds the marker element React Aria looks for', () => {
    preventReactAriaStyleInjection();
    expect(document.getElementById(REACT_ARIA_PRESSABLE_STYLE_ID)?.tagName).toBe('META');
  });

  it('adds it only once', () => {
    preventReactAriaStyleInjection();
    preventReactAriaStyleInjection();
    expect(document.querySelectorAll(`#${REACT_ARIA_PRESSABLE_STYLE_ID}`)).toHaveLength(1);
  });
});
