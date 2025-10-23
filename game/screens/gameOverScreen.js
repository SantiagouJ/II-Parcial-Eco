import { makeRequest, navigateTo, socket } from "../app.js";

export default function renderGameOverScreen(data) {
  const app = document.getElementById("app");
  
  // Check if this is a winner screen
  if (data.isWinner && data.players) {
    app.innerHTML = `
      <div id="game-over">
        <h1>🎉 ¡Tenemos un Ganador! 🎉</h1>
        <h2 id="game-result">${data.message}</h2>
        <div id="leaderboard">
          <h3>Tabla de Posiciones</h3>
          <button id="sort-alphabetically-btn">Ordenar alfabéticamente</button>
          <div id="players-ranking"></div>
        </div>
        <button id="restart-button">Reiniciar juego</button>
      </div>
    `;

    const playersRanking = document.getElementById("players-ranking");
    const sortAlphabeticallyBtn = document.getElementById("sort-alphabetically-btn");
    let sortedByScore = true;

    function renderLeaderboard(players) {
      playersRanking.innerHTML = players
        .map(
          (player, index) => `
        <div class="player-rank">
          <span class="rank">${index + 1}.</span>
          <span class="name">${player.nickname}</span>
          <span class="score">(${player.score} pts)</span>
        </div>
      `
        )
        .join("");
    }

    // Initial render sorted by score
    renderLeaderboard(data.players);

    sortAlphabeticallyBtn.addEventListener("click", () => {
      if (sortedByScore) {
        const alphabeticallySorted = [...data.players].sort((a, b) =>
          a.nickname.localeCompare(b.nickname)
        );
        renderLeaderboard(alphabeticallySorted);
        sortAlphabeticallyBtn.textContent = "Ordenar por puntuación";
        sortedByScore = false;
      } else {
        renderLeaderboard(data.players);
        sortAlphabeticallyBtn.textContent = "Ordenar alfabéticamente";
        sortedByScore = true;
      }
    });
  } else {
    // Regular game over screen
    app.innerHTML = `
      <div id="game-over">
        <h1>Game Over</h1>
        <h2 id="game-result">${data.message}</h2>
        <button id="restart-button">Restart game</button>
      </div>
    `;
  }

  console.log("data", data);

  const restartButton = document.getElementById("restart-button");

  restartButton.addEventListener("click", async () => {
    await makeRequest("/api/game/start", "POST");
  });

  // Keep the socket.on listener for game start event
  socket.on("startGame", (gameData) => {
    navigateTo("/game", {
      nickname: data.nickname,
      role: gameData.role || gameData,
      score: gameData.score || 0,
    });
  });
}
