export function hidePreloader() {
  const el = document.getElementById('preloader');
  if (!el || el.dataset.closing) return;
  el.dataset.closing = 'true';

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const giveUp = new Promise((resolve) => setTimeout(resolve, 2000));

  Promise.race([fontsReady, giveUp]).then(() => {
    el.classList.add('hidden');
    setTimeout(() => el.remove(), 350);
  });
}