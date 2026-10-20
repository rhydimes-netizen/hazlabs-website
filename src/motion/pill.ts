import { gsap } from 'gsap';

// The floating pill works as plain HTML (a <details> menu and two links);
// this adds closing the menu on a pick, an outside click or Escape, and a small
// bump on the Docket count whenever it changes.
export function initPill(reduced: boolean) {
  const pill = document.querySelector<HTMLElement>('.pill');
  if (!pill) return;
  const menu = pill.querySelector('details');

  if (menu) {
    menu.addEventListener('click', (e) => {
      if ((e.target as Element).closest('.pill-menu a')) menu.open = false;
    });
    document.addEventListener('click', (e) => {
      if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
    if (!reduced) {
      menu.addEventListener('toggle', () => {
        if (menu.open)
          gsap.from(menu.querySelectorAll('.pill-menu li'), {
            y: 10,
            autoAlpha: 0,
            duration: 0.35,
            stagger: 0.025,
            ease: 'power3.out',
            clearProps: 'all',
          });
      });
    }
  }

  const count = document.getElementById('dk-count-nav');
  const docket = document.getElementById('pill-docket');
  if (count && docket && !reduced) {
    // The page rewrites the count on every docket render; only bump on a real change.
    let last = count.textContent;
    new MutationObserver(() => {
      if (count.textContent === last) return;
      last = count.textContent;
      gsap.fromTo(docket, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
    }).observe(count, { childList: true, characterData: true, subtree: true });
  }
}
