import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Expected #app root element to exist.");
}

app.innerHTML = `
  <section class="shell" aria-labelledby="title">
    <p class="eyebrow">Vite + TypeScript</p>
    <h1 id="title">Kinetic Press</h1>
    <p class="lede">A strict TypeScript starter running on port 8000.</p>
  </section>
`;
