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

    // Collection selector
    this.collectionSelector = document.getElementById("collectionSelector");
    this.collectionCount = document.getElementById("collectionCount");
    this.collectionPreview = document.getElementById("collectionPreview");
    this.collections = {
      dudububu: this.getDudububuMedia(),
    };
    this.currentCollection = "dudububu";
    this.mediaUrls = this.collections.dudububu;
    // Track selected images (all selected by default)
    this.selectedMediaIndexes = new Set(this.mediaUrls.map((_, i) => i));
    // Populate selector (in case more collections are added)
    this.updateCollectionSelector();
    this.updateCollectionPreviewAndCount();

    // Event listeners
    this.startButton.addEventListener("click", () => this.startGame());
    this.imageFolderInput.addEventListener("change", (e) =>
      this.handleMediaUpload(e)
    );
    this.collectionSelector.addEventListener("change", (e) =>
      this.handleCollectionChange(e)
    );
  }

  getDudububuMedia() {
    // There are 22 stickers
    return Array.from({ length: 22 }, (_, i) => ({
      url: `./dudububu/sticker${i + 1}.webm`,
      type: "video",
    }));
  }

  updateCollectionSelector() {
    // Remove all except dudububu
    while (this.collectionSelector.options.length > 1) {
      this.collectionSelector.remove(1);
    }
    // Add user-uploaded collections
    Object.keys(this.collections).forEach((key) => {
      if (key !== "dudububu") {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = this.collections[key].label || key;
        this.collectionSelector.appendChild(opt);
      }
    });
    this.collectionSelector.value = this.currentCollection;
  }

  handleCollectionChange(e) {
    this.currentCollection = e.target.value;
    this.mediaUrls = this.collections[this.currentCollection];
    // By default, select all
    this.selectedMediaIndexes = new Set(this.mediaUrls.map((_, i) => i));
    // Optionally update UI note
    const note = document.getElementById("defaultFolderNote");
    if (note) {
      if (this.currentCollection === "dudububu") {
        note.textContent = "(using built-in stickers)";
      } else {
        note.textContent = `(${
          this.collections[this.currentCollection].label ||
          this.currentCollection
        })`;
      }
    }
    this.updateCollectionPreviewAndCount();
  }

  handleMediaUpload(event) {
    const files = Array.from(event.target.files);
    const mediaFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.name.endsWith(".webm")
    );
    if (mediaFiles.length === 0) return;
    // Generate a unique key for this collection
    const collectionKey = `collection_${Date.now()}`;
    this.collections[collectionKey] = mediaFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type:
        file.name.endsWith(".webm") || file.type.startsWith("video/")
          ? "video"
          : "image",
    }));
    // Add a label for the selector
    this.collections[collectionKey].label = files[0].webkitRelativePath
      ? files[0].webkitRelativePath.split("/")[0]
      : `Collection ${Object.keys(this.collections).length}`;
    this.currentCollection = collectionKey;
    this.mediaUrls = this.collections[collectionKey];
    // By default, select all
    this.selectedMediaIndexes = new Set(this.mediaUrls.map((_, i) => i));
    this.updateCollectionSelector();
    // Optionally update UI note
    const note = document.getElementById("defaultFolderNote");
    if (note) note.textContent = `(${this.collections[collectionKey].label})`;
    this.updateCollectionPreviewAndCount();
  }

  updateCollectionPreviewAndCount() {
    // Show number of selected images/videos
    if (this.collectionCount) {
      this.collectionCount.textContent = `(${this.selectedMediaIndexes.size} selected / ${this.mediaUrls.length} total)`;
    }
    // Show previews with selection checkboxes
    if (this.collectionPreview) {
      this.collectionPreview.innerHTML = "";
      this.mediaUrls.forEach((media, idx) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";
        wrapper.style.position = "relative";
        wrapper.style.width = "48px";
        wrapper.style.margin = "2px";

        let el;
        if (media.type === "video") {
          el = document.createElement("video");
          el.src = media.url;
          el.muted = true;
          el.playsInline = true;
          el.loop = true;
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.objectFit = "cover";
          el.title = `Video ${idx + 1}`;
        } else {
          el = document.createElement("img");
          el.src = media.url;
          el.alt = `Image ${idx + 1}`;
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.objectFit = "cover";
          el.title = `Image ${idx + 1}`;
        }

        // Checkbox for selection
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.selectedMediaIndexes.has(idx);
        checkbox.style.marginTop = "2px";
        checkbox.title = "Select/unselect";
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            this.selectedMediaIndexes.add(idx);
          } else {
            this.selectedMediaIndexes.delete(idx);
          }
          this.updateCollectionPreviewAndCount();
        });

        wrapper.appendChild(el);
        wrapper.appendChild(checkbox);
        this.collectionPreview.appendChild(wrapper);
      });
    }
    // Show note if nothing is selected
    const note = document.getElementById("selectedImagesNote");
    if (note) {
      if (this.selectedMediaIndexes.size === 0) {
        note.textContent =
          "No images/videos selected! Please select at least one to play.";
      } else {
        note.textContent = "";
      }
    }
  }

  startGame() {
    // Only use selected images
    const selectedMedia = Array.from(this.selectedMediaIndexes).map(
      (idx) => this.mediaUrls[idx]
    );
    if (!selectedMedia || selectedMedia.length === 0) {
      alert("Please select at least one image or video to play!");
      return;
    }

    const [rows, cols] = this.gridSizeSelect.value.split("x").map(Number);
    const totalPairs = (rows * cols) / 2;

    if (selectedMedia.length < totalPairs) {
      alert(
        `Not enough media files! Please select at least ${totalPairs} images/videos.`
      );
      return;
    }

    this.resetGame();
    this.setupPlayers();
    // Use only selected media for the game
    this.setupGridWithMedia(rows, cols, selectedMedia);
    this.updatePlayerDisplay();
  }

  setupGridWithMedia(rows, cols, mediaList) {
    this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    // Select random media files for pairs
    const selectedMedia = this.shuffleArray(mediaList).slice(
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
