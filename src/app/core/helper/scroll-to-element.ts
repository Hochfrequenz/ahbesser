export const scrollToElement = (
  element: HTMLElement,
  offsetY = 0,
  container: HTMLElement | undefined
) => {
  if (!container) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offsetY;
    window.scrollTo({ top: offsetPosition });
    return;
  }
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetPosition = elementRect.top - containerRect.top + container.scrollTop - offsetY;
  container.scrollTo({ top: offsetPosition });
};
