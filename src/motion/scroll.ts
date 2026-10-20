import type Lenis from 'lenis';

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis) => (lenis = l);

// Freeze page scrolling while an overlay (the docket explainer) is open.
export function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? 'hidden' : '';
  if (on) lenis?.stop();
  else lenis?.start();
}

// The fixed header is compact whenever the page is scrolled, so anything that
// lands below it (anchors, pins, the strip's section check) clears its compact
// height, read from the --hdr-c token.
export function compactHeader() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-c')) || 0;
}
export function headerOffset() {
  const header = document.querySelector<HTMLElement>('header.top');
  return header && getComputedStyle(header).position === 'fixed' ? compactHeader() + 8 : 0;
}

export function scrollToTarget(target: HTMLElement | number, immediate = false) {
  // The hero goes to the very top, where the header is full size again.
  const top =
    typeof target === 'number'
      ? target
      : target.id === 'top'
        ? 0
        : target.getBoundingClientRect().top + scrollY - headerOffset();
  if (lenis) lenis.scrollTo(top, { immediate });
  else window.scrollTo({ top });
}
