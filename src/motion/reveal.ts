import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

// Plays once when the element nears the viewport, then hands its transform back
// to CSS so hover effects keep working.
function onEnter(trigger: Element, vars: gsap.TweenVars, targets: gsap.TweenTarget = trigger) {
  gsap.from(targets, {
    duration: 0.9,
    ease: 'power3.out',
    clearProps: 'transform,opacity,visibility',
    ...vars,
    scrollTrigger: { trigger, start: 'top 88%', once: true },
  });
}

export function initReveals(reduced: boolean) {
  if (reduced) return;
  // The index section animates its own heading as it assembles.
  const sections = $$('main > section:not(.hero):not(#index)');

  for (const section of sections) {
    const oval = section.querySelector('.hl-oval');
    if (oval) onEnter(oval, { scale: 0.85, autoAlpha: 0, duration: 0.7, transformOrigin: '0% 50%' });

    const statement = section.querySelector<HTMLElement>('h2.hl-statement');
    if (statement && section.id !== 'about') {
      // Headline lines rise out of a mask, one after another.
      const split = SplitText.create(statement, { type: 'lines', mask: 'lines', linesClass: 'hz-line' });
      gsap.from(split.lines, {
        yPercent: 105,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: statement, start: 'top 88%', once: true },
      });
    }

    for (const p of $$('p.muted, p.side, .stack > p', section)) {
      if (p.closest('.ticket')) continue;
      onEnter(p, { y: 24, autoAlpha: 0, delay: 0.15 });
    }
  }

  // About: the statement fills in word by word as it scrolls through the screen.
  const about = document.querySelector<HTMLElement>('#about h2.hl-statement');
  if (about) {
    const words = SplitText.create(about, { type: 'words', wordsClass: 'hz-word' }).words;
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: about, start: 'top 85%', end: 'bottom 40%', scrub: true },
      },
    );
  }

  // Cards arrive as blocks: each wipes up out of its own cell, one after another.
  const block = (card: Element, i = 0) =>
    onEnter(card, {
      clipPath: 'inset(100% 0 0 0)',
      y: 32,
      duration: 0.8,
      delay: i * 0.08,
      ease: 'power4.out',
      clearProps: 'clipPath,transform',
    });
  const decks = ['#about .lines', '#eng-tickets', '#contact .ticket'];
  for (const sel of decks) {
    const found = $$(sel);
    const cards = found.length === 1 ? (Array.from(found[0].children) as HTMLElement[]) : found;
    cards.forEach(block);
  }
  block(document.querySelector('#consulting article')!);
  block(document.querySelector('#photos .drive')!);

  // Masked panel: the waste-stream board opens from a smaller window as it scrolls in.
  const streams = document.querySelector('.streams');
  if (streams) {
    gsap.fromTo(
      streams,
      { clipPath: 'inset(14% 10% 14% 10% round 20px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 20px)',
        ease: 'none',
        scrollTrigger: { trigger: streams, start: 'top 95%', end: 'top 45%', scrub: true },
      },
    );
  }

  // Lists and grids cascade in.
  const cascades = [
    '#eng-acc',
    '#svc-list',
    '#streams',
    '#partners',
    '#depts',
    '#rows',
    '#regs',
    '#topics',
    '#customers .clients',
  ];
  for (const sel of cascades) {
    const list = document.querySelector(sel);
    if (!list || !list.children.length) continue;
    onEnter(list, { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.04 }, list.children);
  }

  // The catalogue's frame opens up from a smaller rounded window as it arrives,
  // then lets go of the clip so its shadow and the docket's show in full.
  const frame = document.querySelector('.cat-frame');
  if (frame) {
    // Explicit end value: GSAP can't tween an inset() towards "none".
    gsap.fromTo(frame, { clipPath: 'inset(8% 10% 8% 10% round 20px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 20px)',
      duration: 1.1,
      ease: 'power3.inOut',
      clearProps: 'clipPath',
      scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
    });
  }

  // The catalogue's ink header bar draws across.
  for (const line of $$('.cat-head')) {
    gsap.from(line, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power3.inOut',
      clearProps: 'clipPath',
      scrollTrigger: { trigger: line, start: 'top 92%', once: true },
    });
  }

  ScrollTrigger.refresh();
}
