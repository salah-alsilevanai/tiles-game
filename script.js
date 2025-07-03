class MemoryGame {
  constructor() {
    this.tiles = [];
    this.flippedTiles = [];
    this.matches = 0;
    this.moves = 0;
    this.isLocked = false;
    this.mediaUrls = [];
    this.players = [];
    this.currentPlayerIndex = 0;

    // DOM elements
    this.gameBoard = document.getElementById("gameBoard");
    this.movesDisplay = document.getElementById("moves");
    this.matchesDisplay = document.getElementById("matches");
    this.gridSizeSelect = document.getElementById("gridSize");
    this.imageFolderInput = document.getElementById("imageFolder");
    this.startButton = document.getElementById("startGame");
    this.playerCountSelect = document.getElementById("playerCount");
    this.playerScoresDiv = document.getElementById("playerScores");
    this.currentPlayerDisplay = document.getElementById("currentPlayer");

    // By default, load dudububu folder media
    this.loadDefaultDudububuMedia();

    // Event listeners
    this.startButton.addEventListener("click", () => this.startGame());
    this.imageFolderInput.addEventListener("change", (e) =>
      this.handleMediaUpload(e)
    );
  }

  loadDefaultDudububuMedia() {
    // There are 22 stickers, but check which files exist by name
    const dudububuFiles = [
      ...Array.from({ length: 22 }, (_, i) => `sticker${i + 1}.webm`),
    ];
    this.mediaUrls = dudububuFiles.map((name) => ({
      url: `./dudububu/${name}`,
      type: "video",
    }));
    // Optionally, visually indicate in the UI that dudububu is selected by default
    const note = document.getElementById("defaultFolderNote");
    if (note) note.textContent = "(default: dudububu, using built-in stickers)";
  }

  handleMediaUpload(event) {
    const files = Array.from(event.target.files);
    const mediaFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.name.endsWith(".webm")
    );
    this.mediaUrls = mediaFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type:
        file.name.endsWith(".webm") || file.type.startsWith("video/")
          ? "video"
          : "image",
    }));
  }

  startGame() {
    if (this.mediaUrls.length === 0) {
      alert("Please select media files first!");
      return;
    }

    const [rows, cols] = this.gridSizeSelect.value.split("x").map(Number);
    const totalPairs = (rows * cols) / 2;

    if (this.mediaUrls.length < totalPairs) {
      alert(
        `Not enough media files! Please select at least ${totalPairs} files.`
      );
      return;
    }

    this.resetGame();
    this.setupPlayers();
    this.setupGrid(rows, cols);
    this.updatePlayerDisplay();
  }

  setupPlayers() {
    const playerCount = parseInt(this.playerCountSelect.value);
    this.players = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      score: 0,
      name: `Player ${i + 1}`,
    }));
    this.currentPlayerIndex = 0;
    this.updatePlayerScores();
  }

  updatePlayerScores() {
    this.playerScoresDiv.innerHTML = this.players
      .map(
        (player) => `
                <div class="player-score ${
                  player.id === this.currentPlayer.id ? "active" : ""
                }">
                    ${player.name}: ${player.score}
                </div>
            `
      )
      .join("");
  }

  updatePlayerDisplay() {
    this.currentPlayerDisplay.textContent = this.currentPlayer.name;
    this.updatePlayerScores();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextPlayer() {
    if (!this.lastMatchWasSuccessful) {
      this.currentPlayerIndex =
        (this.currentPlayerIndex + 1) % this.players.length;
      this.updatePlayerDisplay();
    }
  }

  resetGame() {
    this.tiles = [];
    this.flippedTiles = [];
    this.matches = 0;
    this.moves = 0;
    this.isLocked = false;
    this.gameBoard.innerHTML = "";
    this.updateStats();
  }

  setupGrid(rows, cols) {
    this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Select random media files for pairs
    const selectedMedia = this.shuffleArray(this.mediaUrls).slice(
      0,
      (rows * cols) / 2
    );

    // Create pairs and shuffle them
    const tilePairs = [...selectedMedia, ...selectedMedia];
    const shuffledPairs = this.shuffleArray(tilePairs);

    // Create tiles
    shuffledPairs.forEach((media, index) => {
      const tile = this.createTile(media, index);
      this.tiles.push(tile);
      this.gameBoard.appendChild(tile);
    });
  }

  createTile(media, index) {
    const tile = document.createElement("div");
    tile.className = "tile";

    if (media.type === "video") {
      tile.innerHTML = `
                <video src="${media.url}" loop muted playsinline>
                    Your browser does not support the video tag.
                </video>`;
    } else {
      tile.innerHTML = `<img src="${media.url}" alt="tile-${index}">`;
    }

    tile.addEventListener("click", () => this.handleTileClick(tile, index));
    return tile;
  }

  handleTileClick(tile, index) {
    if (
      this.isLocked ||
      this.flippedTiles.length === 2 ||
      tile.classList.contains("flipped") ||
      tile.classList.contains("matched")
    ) {
      return;
    }

    tile.classList.add("flipped");
    const video = tile.querySelector("video");
    if (video) {
      video.play();
    }

    this.flippedTiles.push({ tile, index });

    if (this.flippedTiles.length === 2) {
      this.moves++;
      this.updateStats();
      this.checkMatch();
    }
  }

  checkMatch() {
    const [first, second] = this.flippedTiles;
    const firstMedia = first.tile.querySelector("video, img");
    const secondMedia = second.tile.querySelector("video, img");
    const match = firstMedia.src === secondMedia.src;

    this.lastMatchWasSuccessful = match;
    if (match) {
      this.handleMatch(first.tile, second.tile);
    } else {
      this.handleMismatch(first.tile, second.tile);
    }

    setTimeout(() => {
      this.nextPlayer();
    }, 1000);
  }

  handleMatch(firstTile, secondTile) {
    firstTile.classList.add("matched");
    secondTile.classList.add("matched");
    this.matches++;
    this.currentPlayer.score++;
    this.updateStats();
    this.updatePlayerScores();
    this.flippedTiles = [];

    if (this.matches === this.tiles.length / 2) {
      setTimeout(() => {
        const winners = this.getWinners();
        const winnerMessage =
          winners.length > 1
            ? `It's a tie between ${winners.map((p) => p.name).join(" and ")}!`
            : `${winners[0].name} wins!`;
        alert(
          `Game Over! ${winnerMessage}\nFinal Scores:\n${this.players
            .map((p) => `${p.name}: ${p.score}`)
            .join("\n")}`
        );
      }, 500);
    }
  }

  getWinners() {
    const maxScore = Math.max(...this.players.map((p) => p.score));
    return this.players.filter((p) => p.score === maxScore);
  }

  handleMismatch(firstTile, secondTile) {
    this.isLocked = true;
    setTimeout(() => {
      firstTile.classList.remove("flipped");
      secondTile.classList.remove("flipped");
      const firstVideo = firstTile.querySelector("video");
      const secondVideo = secondTile.querySelector("video");
      if (firstVideo) firstVideo.pause();
      if (secondVideo) secondVideo.pause();
      this.flippedTiles = [];
      this.isLocked = false;
    }, 1000);
  }

  updateStats() {
    this.movesDisplay.textContent = this.moves;
    this.matchesDisplay.textContent = this.matches;
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

// Initialize the game when the page loads
window.addEventListener("load", () => {
  new MemoryGame();
});
