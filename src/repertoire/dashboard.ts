const selector = document.querySelector<HTMLSelectElement>('#discipline');
export {};
const topicSelector = document.querySelector<HTMLSelectElement>('#topic');
const sections = [...document.querySelectorAll<HTMLElement>('[data-discipline]')];
if (selector && topicSelector && sections.length) {
  let pendingScroll: number | undefined;
  const select = () => {
    if (pendingScroll !== undefined) cancelAnimationFrame(pendingScroll);
    const requested = location.hash.slice(1);
    const target = document.getElementById(requested);
    const containingSection = target?.closest<HTMLElement>('[data-discipline]');
    const section = containingSection ?? sections.find(section => section.dataset['discipline'] === requested) ?? sections[0]!;
    const id = section.dataset['discipline']!;
    selector.value = id;
    sections.forEach(section => { section.hidden = section.dataset['discipline'] !== id; });
    const topics = [...section.querySelectorAll<HTMLElement>('.topic')];
    const chosenTopic = target?.closest<HTMLElement>('.topic');
    topicSelector.replaceChildren(new Option('All topics', id), ...topics.map(topic => new Option(topic.dataset['topicTitle'], topic.id)));
    topicSelector.value = chosenTopic?.id ?? id;
    topics.forEach(topic => { topic.hidden = !!chosenTopic && topic !== chosenTopic; });
    // Unhide the owning topic before resolving a deep link into its row.
    if (target?.matches('li[id]')) pendingScroll = requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
  };
  selector.disabled = false;
  topicSelector.disabled = false;
  document.getElementById('topic-control')!.hidden = false;
  selector.addEventListener('change', () => { location.hash = selector.value; });
  topicSelector.addEventListener('change', () => { location.hash = topicSelector.value; });
  window.addEventListener('hashchange', select);
  select();
}
