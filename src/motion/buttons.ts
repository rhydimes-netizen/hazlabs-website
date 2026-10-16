// Button labels roll their letters up on hover, one after another. Only the
// button's own text is split; inner spans (arrows, the docket count) stay as they
// are. Screen readers get the plain label from a visually hidden copy.
export function initButtons() {
  for (const btn of document.querySelectorAll<HTMLElement>('.hl-btn')) {
    for (const node of Array.from(btn.childNodes)) {
      // The button's flex gap already spaces the label from its arrow.
      const text = node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '').trim() : '';
      if (!text) continue;
      const label = document.createElement('span');
      label.className = 'hz-roll';
      const plain = document.createElement('span');
      plain.className = 'sr';
      plain.textContent = text;
      const vis = document.createElement('span');
      vis.className = 'hz-roll-vis';
      vis.setAttribute('aria-hidden', 'true');
      [...text].forEach((ch, i) => {
        const c = document.createElement('i');
        c.textContent = ch;
        c.style.setProperty('--i', String(i));
        vis.appendChild(c);
      });
      label.append(plain, vis);
      node.replaceWith(label);
    }
  }
}
