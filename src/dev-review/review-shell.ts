export interface KpDevReviewShell {
  readonly host: HTMLElement;
  readonly root: ShadowRoot;
  readonly launcher: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly content: HTMLElement;
  readonly status: HTMLOutputElement;
  readonly inboxCount: HTMLOutputElement;
  readonly reviewRound: HTMLOutputElement;
  setInboxCount(count: number): void;
  setReviewRound(label: string, sequence: number, synthetic: boolean): void;
  open(): void;
  close(): void;
  dispose(): void;
}

export const KP_DEV_REVIEW_SHELL_OPEN_EVENT = "kp:dev-review-shell-open";
export const KP_DEV_REVIEW_SHELL_CLOSE_EVENT = "kp:dev-review-shell-close";

export function mountKpDevReviewShell(ownerDocument: Document): KpDevReviewShell {
  if (ownerDocument.querySelector("[data-kp-dev-review-shell]") !== null) {
    throw new Error("The visual review shell is already mounted");
  }

  const host = ownerDocument.createElement("div");
  host.dataset["kpDevReviewShell"] = "true";
  host.setAttribute("aria-hidden", "false");
  const root = host.attachShadow({ mode: "open" });
  const style = ownerDocument.createElement("style");
  style.textContent = shellStyles;

  const launcher = button(ownerDocument, "launcher", "Review");
  launcher.type = "button";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "review-panel");
  const launcherIcon = ownerDocument.createElement("span");
  launcherIcon.setAttribute("aria-hidden", "true");
  launcherIcon.textContent = "✦";
  const launcherLabel = ownerDocument.createElement("span");
  launcherLabel.textContent = "Review";
  const launcherCount = ownerDocument.createElement("output");
  launcherCount.className = "launcher-count";
  launcherCount.hidden = true;
  launcher.append(launcherIcon, launcherLabel, launcherCount);

  const panel = ownerDocument.createElement("section");
  panel.id = "review-panel";
  panel.className = "panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "review-title");

  const header = ownerDocument.createElement("header");
  const heading = ownerDocument.createElement("div");
  const eyebrow = ownerDocument.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Developer feedback";
  const title = ownerDocument.createElement("h2");
  title.id = "review-title";
  title.textContent = "Review this moment";
  const reviewRound = ownerDocument.createElement("output");
  reviewRound.className = "review-round";
  reviewRound.setAttribute("aria-live", "polite");
  reviewRound.value = "Loading review round…";
  heading.append(eyebrow, title, reviewRound);
  const closeButton = button(ownerDocument, "close", "Close visual review");
  closeButton.type = "button";
  closeButton.textContent = "×";
  const headerActions = ownerDocument.createElement("div");
  headerActions.className = "header-actions";
  const inboxCount = ownerDocument.createElement("output");
  inboxCount.className = "inbox-count";
  inboxCount.setAttribute("aria-live", "polite");
  inboxCount.value = "Inbox 0";
  inboxCount.setAttribute("aria-label", "Current round contains 0 unread notes");
  headerActions.append(inboxCount, closeButton);
  header.append(heading, headerActions);

  const content = ownerDocument.createElement("div");
  content.className = "content";
  const status = ownerDocument.createElement("output");
  status.className = "status";
  status.setAttribute("aria-live", "polite");
  panel.append(header, content, status);
  root.append(style, launcher, panel);
  ownerDocument.body.append(host);

  const open = (): void => {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    closeButton.focus();
    host.dispatchEvent(new CustomEvent(KP_DEV_REVIEW_SHELL_OPEN_EVENT));
  };
  const close = (): void => {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
    host.dispatchEvent(new CustomEvent(KP_DEV_REVIEW_SHELL_CLOSE_EVENT));
  };
  const onKeyDown = (event: Event): void => {
    if (event instanceof KeyboardEvent && event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close();
    }
  };
  launcher.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  root.addEventListener("keydown", onKeyDown);
  const setInboxCount = (count: number): void => {
    if (!Number.isInteger(count) || count < 0) throw new RangeError("Inbox count must be a non-negative integer");
    const noun = count === 1 ? "note" : "notes";
    inboxCount.value = `Inbox ${count}`;
    inboxCount.setAttribute("aria-label", `Current round contains ${count} unread ${noun}`);
    launcherCount.value = String(count);
    launcherCount.hidden = count === 0;
    launcherCount.setAttribute("aria-label", `${count} unread ${noun} in current round`);
  };
  const setReviewRound = (label: string, sequence: number, synthetic: boolean): void => {
    if (label.trim().length === 0) throw new TypeError("Review round label must not be empty");
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new RangeError("Review round sequence must be a positive integer");
    }
    reviewRound.value = `${synthetic ? "Imported" : "Round"} ${sequence} · ${label}`;
  };

  return {
    host,
    root,
    launcher,
    panel,
    content,
    status,
    inboxCount,
    reviewRound,
    setInboxCount,
    setReviewRound,
    open,
    close,
    dispose() {
      launcher.removeEventListener("click", open);
      closeButton.removeEventListener("click", close);
      root.removeEventListener("keydown", onKeyDown);
      host.remove();
    }
  };
}

function button(ownerDocument: Document, className: string, label: string): HTMLButtonElement {
  const element = ownerDocument.createElement("button");
  element.className = className;
  element.setAttribute("aria-label", label);
  return element;
}

const shellStyles = `
  :host {
    --paper: #f7f3e8;
    --surface: #fffaf0;
    --ink: #16231d;
    --muted: #59645e;
    --accent: #df7047;
    --relation: #1f6371;
    --line: #d2d7cd;
    position: fixed;
    z-index: 2147483000;
    right: 18px;
    bottom: 18px;
    color: var(--ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    line-height: 1.4;
    pointer-events: none;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { color: inherit; font: inherit; }
  button:focus-visible, textarea:focus-visible {
    outline: 3px solid var(--relation);
    outline-offset: 4px;
  }
  .launcher {
    display: inline-flex;
    align-items: center;
    gap: .48rem;
    min-height: 42px;
    padding: .62rem .9rem;
    border: 1px solid color-mix(in srgb, var(--ink) 16%, var(--line));
    border-radius: 999px;
    color: var(--surface);
    background: var(--ink);
    box-shadow: 0 12px 34px rgb(22 35 29 / 16%);
    font-size: .78rem;
    font-weight: 750;
    letter-spacing: .01em;
    cursor: pointer;
    pointer-events: auto;
  }
  .launcher > [aria-hidden] { color: var(--accent); font-size: .9rem; }
  .launcher-count {
    display: grid;
    min-width: 1.32rem;
    height: 1.32rem;
    padding-inline: .28rem;
    border-radius: 999px;
    color: var(--ink);
    background: var(--accent);
    font-size: .65rem;
    font-weight: 850;
    place-items: center;
  }
  .launcher-count[hidden] { display: none; }
  .panel {
    width: min(360px, calc(100vw - 24px));
    border: 1px solid color-mix(in srgb, var(--ink) 14%, var(--line));
    border-radius: 1rem;
    background: var(--surface);
    box-shadow: 0 24px 70px rgb(22 35 29 / 18%);
    overflow: hidden;
    pointer-events: auto;
  }
  .panel[hidden] { display: none; }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1rem .78rem;
    border-bottom: 1px solid color-mix(in srgb, var(--line) 78%, transparent);
  }
  .eyebrow {
    display: block;
    margin-bottom: .18rem;
    color: var(--accent);
    font-size: .61rem;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }
  h2 {
    margin: 0;
    font-family: Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif;
    font-size: 1.12rem;
    font-weight: 650;
    letter-spacing: -.015em;
  }
  .review-round {
    display: block;
    max-width: 14rem;
    margin-top: .2rem;
    color: var(--muted);
    font-size: .63rem;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-actions { display: flex; align-items: center; gap: .42rem; }
  .inbox-count {
    padding: .22rem .45rem;
    border: 1px solid color-mix(in srgb, var(--relation) 22%, var(--line));
    border-radius: 999px;
    color: var(--relation);
    background: color-mix(in srgb, var(--relation) 6%, transparent);
    font-size: .62rem;
    font-weight: 750;
    white-space: nowrap;
  }
  .close {
    display: grid;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: var(--muted);
    background: transparent;
    font-size: 1.35rem;
    line-height: 1;
    place-items: center;
    cursor: pointer;
  }
  .close:hover { color: var(--ink); background: color-mix(in srgb, var(--line) 42%, transparent); }
  .content { padding: 1rem; }
  .intro { margin: 0 0 .75rem; color: var(--muted); font-size: .78rem; line-height: 1.5; }
  .capture-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .55rem; }
  .retake {
    flex: none;
    padding: .25rem .45rem;
    border: 1px solid color-mix(in srgb, var(--relation) 22%, var(--line));
    border-radius: .45rem;
    color: var(--relation);
    background: transparent;
    font-size: .62rem;
    font-weight: 750;
    cursor: pointer;
  }
  .retake:hover { background: color-mix(in srgb, var(--relation) 7%, transparent); }
  .retake[hidden] { display: none; }
  .retake:disabled { cursor: wait; opacity: .58; }
  .meta { display: flex; flex-wrap: wrap; gap: .34rem; margin: 0 0 .4rem; }
  .meta span {
    padding: .2rem .44rem;
    border: 1px solid color-mix(in srgb, var(--line) 78%, transparent);
    border-radius: 999px;
    color: var(--relation);
    background: color-mix(in srgb, var(--relation) 6%, transparent);
    font-size: .63rem;
    font-weight: 700;
  }
  .route { margin: 0 0 .85rem; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .61rem; overflow-wrap: anywhere; }
  form { display: grid; gap: .48rem; }
  label { font-size: .72rem; font-weight: 750; }
  textarea {
    width: 100%;
    min-height: 112px;
    resize: vertical;
    padding: .68rem .72rem;
    border: 1px solid var(--line);
    border-radius: .62rem;
    color: var(--ink);
    background: #fffdf7;
    font: 400 .79rem/1.5 Inter, ui-sans-serif, system-ui, sans-serif;
  }
  textarea::placeholder { color: color-mix(in srgb, var(--muted) 72%, transparent); }
  textarea:disabled { opacity: .65; }
  .form-footer { display: flex; align-items: center; justify-content: space-between; gap: .8rem; }
  .count { color: var(--muted); font-size: .62rem; }
  .save {
    min-height: 36px;
    padding: .48rem .72rem;
    border: 0;
    border-radius: .5rem;
    color: var(--surface);
    background: var(--ink);
    font-size: .71rem;
    font-weight: 750;
    cursor: pointer;
  }
  .save:disabled { cursor: default; opacity: .48; }
  .status { display: block; min-height: 1.2rem; padding: 0 1rem .75rem; color: var(--muted); font-size: .7rem; }
  @media (max-width: 520px) {
    :host { right: 12px; bottom: 12px; }
    .panel { width: calc(100vw - 24px); }
  }
  @media print { :host { display: none; } }
`;
