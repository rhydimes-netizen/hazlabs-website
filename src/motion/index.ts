import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './motion.css';
import { setLenis, scrollToTarget } from './scroll';
import { initHero } from './hero';
import { initReveals } from './reveal';
import { initButtons } from './buttons';
import { initRail } from './rail';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth scrolling (Lenis) drives ScrollTrigger from GSAP's ticker so both
// stay on the same frame. Skipped entirely for reduced motion.
if (!reduced) {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  setLenis(lenis);
}

// In-page links go through Lenis so they glide instead of jumping.
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.classList.contains('sr') || e.defaultPrevented) return;
  const id = a.getAttribute('href')!.slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
  history.pushState(null, '', '#' + id);
});

initButtons();
initRail(reduced);

// Headlines are split into lines, so wait for the web fonts (briefly) to get
// the real line breaks before splitting.
const fontsOrTimeout = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
fontsOrTimeout.then(() => {
  initHero(reduced);
  initReveals(reduced);
  // The intro has hidden its pieces by now; the hero can be shown.
  document.documentElement.classList.remove('motion-pending');

  // Late content (catalogue filters, the accordion) changes section heights.
  let pending = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => ScrollTrigger.refresh());
  }).observe(document.getElementById('main')!);
});
