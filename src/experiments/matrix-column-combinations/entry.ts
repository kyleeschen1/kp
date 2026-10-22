import "./style.css";
import "../matrix-example-page.css";
import { loadColumnPage } from "./page.ts";
import { mountColumnReader } from "./reader.ts";

const root = document.querySelector<HTMLElement>("#comb-player")!;
let disposed = false, dispose: (() => void) | undefined;
if (new URL(location.href).searchParams.get("author") === "1") {
  void import("./author.ts").then(({ mountColumnAuthor }) => {
    if (!disposed) dispose = mountColumnAuthor(root);
  }).catch(error => { if (!disposed) { root.textContent = String(error); root.setAttribute("aria-busy", "false"); } });
} else dispose = mountColumnReader(root, loadColumnPage);
import.meta.hot?.dispose(() => { disposed = true; dispose?.(); });
