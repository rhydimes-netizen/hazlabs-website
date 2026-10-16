import { gsap } from 'gsap';
import { lockScroll } from './scroll';

const SEEN = 'hz-loader-seen';

// The docket explainer. On the first visit of a session it doubles as the
// loading screen: a welcome, then a sample docket that fills itself in step by
// step while the page loads. Once the page is ready the visitor enters with the
// button (or Enter / Escape), and the ticket flies into the pill's Docket
// button. "How the docket works" in the docket replays it on demand.
export function initLoader(reduced: boolean): Promise<void> {
  const root = document.documentElement;
  const loader = document.getElementById('hz-loader');
  if (!loader) return Promise.resolve();

  const $ = <T extends Element = HTMLElement>(sel: string) => loader.querySelector<T>(sel)!;
  const ticket = $('.ld-ticket');
  const copy = $('.ld-copy');
  const steps = Array.from(loader.querySelectorAll<HTMLElement>('.ld-steps li'));
  const rows = Array.from(loader.querySelectorAll<HTMLElement>('.ld-rows li'));
  const inputs = Array.from(loader.querySelectorAll<HTMLElement>('.ld-input'));
  const count = $('#ld-count');
  const fill = $('.ld-tear-fill');
  const send = $('.ld-send');
  const status = $('#ld-status');
  const button = $<HTMLButtonElement>('#ld-enter');

  const setStep = (n: number) => steps.forEach((s, i) => s.classList.toggle('is-on', i < n));
  const setCount = (n: number) => (count.textContent = String(n).padStart(2, '0'));
  const setButton = (label: string, arrow: boolean) => {
    button.textContent = label;
    if (arrow) {
      const a = document.createElement('span');
      a.className = 'arrow';
      a.setAttribute('aria-hidden', 'true');
      a.textContent = '→';
      button.append(' ', a);
    }
  };

  // The sequence resets itself at time 0, so restart() replays it cleanly.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.call(() => {
    setStep(0);
    setCount(0);
    inputs.forEach((i) => (i.textContent = ''));
    send.classList.remove('is-on');
  })
    .set(rows, { autoAlpha: 0, y: 12 })
    .fromTo(fill, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 3.6, ease: 'none' }, 0)
    .from(ticket, { y: 40, rotation: -3, autoAlpha: 0, duration: 0.8 }, 0.2)
    // The footer (the button) stays put so it can take focus straight away.
    .from(copy.querySelectorAll(':scope > :not(.ld-foot)'), { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 0)
    .call(setStep, [1], 0.75);
  rows.forEach((row, i) => {
    const at = 0.9 + i * 0.4;
    tl.to(row, { autoAlpha: 1, y: 0, duration: 0.45 }, at).call(setCount, [i + 1], at);
  });
  tl.call(setStep, [2], 2.15);
  inputs.forEach((input, i) => tl.call(() => (input.textContent = input.dataset.type ?? ''), [], 2.35 + i * 0.25));
  tl.call(setStep, [3], 3.05).call(() => send.classList.add('is-on'), [], 3.25).to({}, { duration: 0.35 });

  // Replay from the docket: the same sequence, closed with the button.
  const howto = document.getElementById('dk-howto');
  let mode: 'loading' | 'ready' | 'replay' | 'closed' = root.classList.contains('hz-loading') ? 'loading' : 'closed';
  const openReplay = () => {
    mode = 'replay';
    status.textContent = 'Example docket';
    button.disabled = false;
    setButton('Close', false);
    loader.classList.add('is-open');
    lockScroll(true);
    gsap.set(loader, { autoAlpha: 1 });
    if (reduced) tl.progress(1, false);
    else tl.restart();
    button.focus();
  };
  const closeReplay = () => {
    mode = 'closed';
    gsap.to(loader, {
      autoAlpha: 0,
      duration: reduced ? 0 : 0.35,
      onComplete: () => {
        loader.classList.remove('is-open');
        gsap.set(loader, { clearProps: 'all' });
        lockScroll(false);
        howto?.focus();
      },
    });
  };
  if (howto) {
    howto.hidden = false;
    howto.addEventListener('click', openReplay);
  }

  let finish: () => void = () => {};
  const dismiss = () => {
    if (mode === 'ready') finish();
    else if (mode === 'replay') closeReplay();
  };
  button.addEventListener('click', dismiss);
  loader.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismiss();
  });

  if (mode !== 'loading') return Promise.resolve();

  // First visit: play while the page loads, then wait for the visitor.
  return new Promise<void>((resolve) => {
    lockScroll(true);
    loader.tabIndex = -1;
    loader.focus({ preventScroll: true });
    tl.play(0);

    // Loading readout: eases towards 90 % until the page has loaded.
    const shown = { v: 0 };
    const pct = () => button.querySelector('#ld-pct');
    const crawl = gsap.to(shown, {
      v: 90,
      duration: 2.5,
      ease: 'power1.out',
      onUpdate: () => {
        const p = pct();
        if (p) p.textContent = String(Math.round(shown.v));
      },
    });

    const loaded = new Promise<void>((r) =>
      document.readyState === 'complete' ? r() : addEventListener('load', () => r(), { once: true }),
    );
    Promise.race([Promise.all([loaded, document.fonts.ready]), new Promise((r) => setTimeout(r, 4000))]).then(() => {
      crawl.kill();
      mode = 'ready';
      button.disabled = false;
      setButton('Enter the site', true);
      status.textContent = 'or press Enter';
      gsap.from(button, { scale: 0.94, duration: 0.5, ease: 'back.out(2.5)', clearProps: 'transform' });
      button.focus({ preventScroll: true });
    });

    finish = () => {
      mode = 'closed';
      tl.pause();
      try {
        sessionStorage.setItem(SEEN, '1');
      } catch {}
      // The ticket shrinks into the Docket button, so visitors see where it lives.
      const target = document.getElementById('pill-docket')?.getBoundingClientRect();
      const from = ticket.getBoundingClientRect();
      const out = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          root.classList.remove('hz-loading');
          loader.removeAttribute('tabindex');
          gsap.set([loader, ticket, copy], { clearProps: 'all' });
          tl.progress(1, true);
          lockScroll(false);
          resolve();
        },
      });
      out.to(copy, { y: -20, autoAlpha: 0, duration: 0.4 }, 0);
      if (target && target.width) {
        out.to(
          ticket,
          {
            x: target.left + target.width / 2 - (from.left + from.width / 2),
            y: target.top + target.height / 2 - (from.top + from.height / 2),
            scale: target.width / from.width,
            rotation: 4,
            autoAlpha: 0,
            duration: 0.85,
          },
          0.05,
        );
      }
      out.to(loader, { autoAlpha: 0, duration: 0.45 }, 0.45);
    };
  });
}
