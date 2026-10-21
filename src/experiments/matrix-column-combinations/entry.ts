import "./style.css";
import "../matrix-example-page.css";
import { loadColumnPage } from "./page.ts";
import { mountColumnReader } from "./reader.ts";

const dispose = mountColumnReader(document.querySelector<HTMLElement>("#comb-player")!, loadColumnPage);
import.meta.hot?.dispose(dispose);
