import wasm, { help } from "./pkg/wordle_extension.js";

window.addEventListener("load", startup, false);

async function makeNextGuess(hardmode: boolean) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  const { guesses, masks } = await chrome.tabs.sendMessage(tab.id!, {
    popupId: "wordle-helper",
  });

  wasm().then(() => {
    const row = document.getElementById("row");
    const cells = row?.children;

    if (cells) {
      const guess = help(guesses, masks, hardmode);
      Array.from(cells).forEach((cell, i) => {
        (cell as HTMLElement).innerText = guess[i] || "-";
      });
    }
  });
}

async function startup() {
  // Get the current mode being used
  let hardmode = true;
  const toggle = document.getElementById("switch");

  if (toggle) {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      hardmode = toggle.classList.toggle("toggle-on");
      if (hardmode) {
        chrome.storage.local.set({ mode: "hard" });
      } else {
        chrome.storage.local.set({ mode: "easy" });
      }
      makeNextGuess(hardmode);
    });

    chrome.storage.local.get("mode").then((result) => {
      hardmode = toggle.classList.toggle("toggle-on", result?.mode === "hard");
    });
  }

  // Get the row in the helper
  const row = document.querySelector(".row");
  if (row) {
    row.addEventListener("click", (e) => {
      const button = (e.target as HTMLButtonElement).closest("span");
      button?.classList.add("show");
    });

    toggle?.addEventListener("click", () => {
      row.classList.remove("show-all");
      Array.from(row.children).forEach((cell) => cell.classList.remove("show"));
    });

    document.getElementById("show-all")?.addEventListener("click", () => {
      row.classList.add("show-all");
      Array.from(row.children).forEach((cell) => cell.classList.add("show"));
    });

    Array.from(row.children).forEach((element, i) => {
      const el = element as HTMLElement;
      const delay = 100 * i;
      el.style.setProperty("--_a-delay", `${delay}ms`);
      el.style.setProperty("--_t-delay", `${delay + 250}ms`);
    });

    makeNextGuess(hardmode);
  }
}
