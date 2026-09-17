const selector = document.querySelector<HTMLSelectElement>('#discipline');
export {};
const sections = [...document.querySelectorAll<HTMLElement>('[data-discipline]')];
if (selector && sections.length) {
  const select = () => {
    const requested = location.hash.slice(1);
    const id = sections.find(section => section.dataset['discipline'] === requested)?.dataset['discipline'] ?? sections[0]!.dataset['discipline']!;
    selector.value = id;
    sections.forEach(section => { section.hidden = section.dataset['discipline'] !== id; });
  };
  selector.disabled = false;
  selector.addEventListener('change', () => { location.hash = selector.value; });
  window.addEventListener('hashchange', select);
  select();
}
