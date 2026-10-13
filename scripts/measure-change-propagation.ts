import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const htmlPath = "dist/experiments/change-propagation/index.html";
const html = readFileSync(htmlPath, "utf8");
const paths = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+\.(?:js|css))"/g)].map(match => `dist${match[1]}`))];
const size = (path: string) => { const bytes = readFileSync(path); return { path, bytes: bytes.length, gzip: gzipSync(bytes).length }; };
const assets = paths.map(size);
const total = (suffix: string) => assets.filter(asset => asset.path.endsWith(suffix)).reduce((sum, asset) => ({ bytes: sum.bytes + asset.bytes, gzip: sum.gzip + asset.gzip }), { bytes: 0, gzip: 0 });
console.log(JSON.stringify({ scope: "Built HTML and its declared script, preload and stylesheet assets; excludes fonts, dynamic authoring imports, HTTP overhead and cache effects.",
  html: size(htmlPath), javascript: total(".js"), css: total(".css"), assets }, null, 2));
