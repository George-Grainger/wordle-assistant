const parseStatus = (status: string | null) => {
  switch (status) {
    case "absent":
      return "W";
    case "present":
      return "M";
    case "correct":
      return "C";
    default:
      // The cell is empty
      return "X";
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (sender.tab || request.popupId !== "wordle-helper") {
    sendResponse({ isOk: false });
    return;
  }

  // The NYT site has the wordle game within a specific board
  const board = document.getElementById("wordle-app-game");
  if (!board) {
    sendResponse({ isOk: false });
    return;
  }

  // Can find all rows based on their aria-label
  const rows = Array.from(board.querySelectorAll('[aria-label^="Row"]'));
  if (rows.length === 0) {
    sendResponse({ isOk: false });
    return;
  }

  const answers = rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("[data-state]"));

      const status = cells
        .map((cell) => cell.getAttribute("data-state"))
        .map(parseStatus)
        .join("");
      const word = cells
        .map((cell) => (cell as HTMLElement).innerText)
        .join("");

      return { word, status };
    })
    .filter((row) => !row.status.includes("X"));

  const guesses = answers.map((answer) => answer["word"]);
  const masks = answers.map((answer) => answer["status"]);

  sendResponse({ isOk: true, guesses, masks });
});
