import { prepareSaddleAnimation, mountSaddlePlayer, type SaddlePlayer } from "../../src/animation-player/public-api.ts";
import "./style.css";
const animation = prepareSaddleAnimation();
const mounts = new Map<string, SaddlePlayer>();
let count = 0;
function mount() {
  for (const player of mounts.values()) player.dispose(); mounts.clear();
  for (const id of ["article", "compact"]) {
    const host = document.getElementById(id)!;
    const controls = document.querySelector<HTMLElement>(`[data-for="${id}"]`)!;
    controls.replaceChildren();
    const slider = document.createElement("input"); slider.type = "range"; slider.min = "0"; slider.max = "1"; slider.step = ".001";
    slider.setAttribute("aria-label", `${id} animation progress`);
    const player = mountSaddlePlayer(host, { animation, initialProgress: id === "compact" ? 1 : 0,
      onChange: snapshot => { slider.value = String(snapshot.progress); } });
    mounts.set(id, player);
    for (const [label, run] of [["Play", () => player.play()], ["Pause", () => player.pause()],
      ["Reverse", () => player.play("rewind")]] as const) {
      const button = document.createElement("button"); button.textContent = label;
      button.addEventListener("click", run); controls.append(button);
    }
    slider.addEventListener("input", () => player.seek(Number(slider.value))); controls.append(slider);
  }
  document.getElementById("mount-status")!.textContent = `Mounted ${++count} time${count === 1 ? "" : "s"}. One prepared artifact; two independent players.`;
}
document.getElementById("remount")!.addEventListener("click", mount);
window.addEventListener("pagehide", () => { for (const player of mounts.values()) player.dispose(); });
mount();
