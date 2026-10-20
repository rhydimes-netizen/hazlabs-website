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
import { initMosaic } from './mosaic';
import { initStrip } from './strip';
import { initPill } from './pill';
import { initLoader } from './loader';
import { initDocket } from './docket';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Tells the fallback timer in <head> that this script took over.
(window as Window & { __hzMotion?: boolean }).__hzMotion = true;

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
initPill(reduced);
initDocket(reduced);
const loaderDone = initLoader(reduced);

// Headlines are split into lines, so wait for the web fonts (briefly) to get
// the real line breaks before splitting. The hero intro waits for the loader.
const fontsOrTimeout = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
fontsOrTimeout.then(async () => {
  // The mosaic pins its section, so it is set up before the triggers below it.
  const { openMenu } = initMosaic(reduced);
  initStrip(reduced, openMenu);
  initReveals(reduced);
  await loaderDone;
  initHero(reduced);
  // The intro has hidden its pieces by now; the hero can be shown.
  document.documentElement.classList.remove('motion-pending');

  // Late content (catalogue filters, the accordion) changes section heights.
  // Only a real change re-measures: a refresh briefly unpins the mosaic,
  // which would otherwise report a resize of its own and loop.
  const main = document.getElementById('main')!;
  let lastH = main.offsetHeight;
  let pending = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      if (Math.abs(main.offsetHeight - lastH) < 2) return;
      ScrollTrigger.refresh();
      lastH = main.offsetHeight;
    });
  }).observe(main);
});
