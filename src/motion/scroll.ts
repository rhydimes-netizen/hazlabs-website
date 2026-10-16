import type Lenis from 'lenis';

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis) => (lenis = l);

// Freeze page scrolling while an overlay (the docket explainer) is open.
export function lockScroll(on: boolean) {
  document.documentElement.style.overflow = on ? 'hidden' : '';
  if (on) lenis?.stop();
  else lenis?.start();
}

// The header is only sticky above 900px, so anchors offset by its height there.
export function headerOffset() {
  const header = document.querySelector<HTMLElement>('header.top');
  return header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight + 8 : 0;
}

export function scrollToTarget(target: HTMLElement | number, immediate = false) {
  const top =
    typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY - headerOffset();
  if (lenis) lenis.scrollTo(top, { immediate });
  else window.scrollTo({ top });
}
