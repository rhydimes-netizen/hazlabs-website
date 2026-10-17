import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Hero: the statement cell wipes open on the grid, its lines rise, and the
// brand blocks slide in from the edge and snap into their cells. Scrolling
// away, the blocks drift on at their own pace.
export function initHero(reduced: boolean) {
  const hero = document.querySelector<HTMLElement>('section.hero');
  if (!hero || reduced) return;

  const cell = hero.querySelector<HTMLElement>('.hero-cell');
  const h1 = hero.querySelector('h1');
  const code = hero.querySelector('.hero-code');
  const lead = hero.querySelector('.lead');
  const ctas = lead?.nextElementSibling;
  const blocks = hero.querySelectorAll<HTMLElement>('.hb');
  if (!cell || !h1) return;

  const split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'hz-line' });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(cell, { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
    .from(code, { autoAlpha: 0, y: 8, duration: 0.5 }, 0.5)
    .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.09 }, 0.55)
    .from([lead, ctas], { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.9)
    // Blocks come in from the right edge, one cell-step at a time, and stop dead on the grid.
    .from(blocks, { xPercent: 260, duration: 1, stagger: 0.12, ease: 'expo.out' }, 0.35);

  gsap
    .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to(blocks, { y: (i) => [140, 80, 200, 110][i % 4], ease: 'none' }, 0)
    .to(cell, { y: -40, ease: 'none' }, 0);
}
