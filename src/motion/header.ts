// The fixed header turns compact (smaller logo, company name shown) as soon as
// the page is scrolled, and back to full size at the very top. Toggling one
// class is cheap, so it runs on every scroll event rather than being deferred
// to a frame that a smooth-scroll step could skip.
export function initHeader() {
  const header = document.querySelector<HTMLElement>('header.top');
  if (!header) return;
  const update = () => header.classList.toggle('is-compact', scrollY > 24);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
