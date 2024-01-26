import wasm, { help } from "./pkg/wordle_extension.js";

window.addEventListener("load", startup, false);

async function startup() {
  const row = document.querySelector(".row");

  row?.addEventListener("click", (e) => {
    const button = (e.target as HTMLButtonElement).closest("span");
    button?.classList.add("show");
  });

  if (row) {
    document.getElementById("show-all")?.addEventListener("click", () => {
      row?.classList.add("show-all");
      Array.from(row.children).forEach((cell) => cell.classList.add("show"));
    });

    Array.from(row.children).forEach((element, i) => {
      const el = element as HTMLElement;
      const delay = 100 * i;
      el.style.setProperty("--_a-delay", `${delay}ms`);
      el.style.setProperty("--_t-delay", `${delay + 250}ms`);
    });

    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    const { guesses, masks } = await chrome.tabs.sendMessage(tab.id!, {
      popupId: "wordle-helper",
    });

    wasm().then((module) => {
      const row = document.getElementById("row");
      const cells = row?.children;

      if (cells) {
        const guess = help(guesses, masks);
        Array.from(cells).forEach((cell, i) => {
          (cell as HTMLElement).innerText = guess[i] || "-";
        });
      }
    });
  }
}
