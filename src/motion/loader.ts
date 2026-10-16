import { gsap } from 'gsap';
import { lockScroll } from './scroll';

const SEEN = 'hz-loader-seen';

// The docket explainer. On the first visit of a session it doubles as the
// loader: a sample docket fills itself in step by step while the page loads,
// then the ticket flies into the pill's Docket button. "How the docket works"
// in the docket replays it on demand.
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
  const pct = $('#ld-pct');
  const skip = $<HTMLButtonElement>('#ld-skip');

  const setStep = (n: number) => steps.forEach((s, i) => s.classList.toggle('is-on', i < n));
  const setCount = (n: number) => (count.textContent = String(n).padStart(2, '0'));

  // The sequence resets itself at time 0, so restart() replays it cleanly.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.call(() => {
    setStep(0);
    setCount(0);
    inputs.forEach((i) => (i.textContent = ''));
    send.classList.remove('is-on');
  })
    .set(rows, { autoAlpha: 0, y: 12 })
    .fromTo(fill, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 3.2, ease: 'none' }, 0)
    .from(ticket, { y: 40, rotation: -3, autoAlpha: 0, duration: 0.8 }, 0)
    // The footer (Skip / Close) stays put so it can take focus straight away.
    .from(copy.querySelectorAll(':scope > :not(.ld-foot)'), { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0)
    .call(setStep, [1], 0.35);
  rows.forEach((row, i) => {
    const at = 0.5 + i * 0.4;
    tl.to(row, { autoAlpha: 1, y: 0, duration: 0.45 }, at).call(setCount, [i + 1], at);
  });
  tl.call(setStep, [2], 1.75);
  inputs.forEach((input, i) => tl.call(() => (input.textContent = input.dataset.type ?? ''), [], 1.95 + i * 0.25));
  tl.call(setStep, [3], 2.65).call(() => send.classList.add('is-on'), [], 2.85).to({}, { duration: 0.35 });

  // Replay from the docket.
  const howto = document.getElementById('dk-howto');
  let replaying = false;
  if (howto) {
    howto.hidden = false;
    howto.addEventListener('click', () => {
      replaying = true;
      status.textContent = 'Example docket';
      skip.textContent = 'Close';
      loader.classList.add('is-open');
      lockScroll(true);
      gsap.set(loader, { autoAlpha: 1 });
      if (reduced) tl.progress(1, false);
      else tl.restart();
      skip.focus();
    });
  }
  const closeReplay = () => {
    replaying = false;
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

  const firstVisit = root.classList.contains('hz-loading');
  if (!firstVisit) {
    skip.addEventListener('click', () => replaying && closeReplay());
    loader.addEventListener('keydown', (e) => e.key === 'Escape' && replaying && closeReplay());
    return Promise.resolve();
  }

  // First visit: play while the page loads, then hand over to the site.
  return new Promise<void>((resolve) => {
    lockScroll(true);
    skip.focus({ preventScroll: true });
    let ready = false;
    const loaded = new Promise<void>((r) =>
      document.readyState === 'complete' ? r() : addEventListener('load', () => r(), { once: true }),
    );
    Promise.race([Promise.all([loaded, document.fonts.ready]), new Promise((r) => setTimeout(r, 4000))]).then(
      () => (ready = true),
    );
    const played = new Promise<void>((r) => tl.eventCallback('onComplete', () => r()));
    tl.eventCallback('onUpdate', () => {
      pct.textContent = String(Math.round(tl.progress() * (ready ? 100 : 99)));
    });
    tl.play(0);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      tl.eventCallback('onComplete', null).eventCallback('onUpdate', null);
      pct.textContent = '100';
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
          gsap.set([loader, ticket, copy], { clearProps: 'all' });
          lockScroll(false);
          skip.addEventListener('click', () => replaying && closeReplay());
          loader.addEventListener('keydown', (e) => e.key === 'Escape' && replaying && closeReplay());
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
    skip.addEventListener('click', () => !done && finish(), { once: true });
    loader.addEventListener('keydown', (e) => e.key === 'Escape' && finish());
    Promise.all([played, new Promise<void>((r) => {
      const check = () => (ready ? r() : setTimeout(check, 100));
      check();
    })]).then(finish);
  });
}
