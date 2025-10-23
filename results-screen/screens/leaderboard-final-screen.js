import { navigateTo, makeRequest, socket } from "../app.js";

export default function renderScreen2(data) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="final-leaderboard">
      <h1>🎉 ¡Tenemos un Ganador! 🎉</h1>
      <h2 id="winner-announcement">¡${data.winner} ha ganado el juego!</h2>
      <div id="leaderboard">
        <h3>Tabla de Posiciones Final</h3>
        <div class="button-group">
          <button id="sort-alphabetically-btn">Ordenar alfabéticamente</button>
          <button id="reset-scores-btn">Limpiar puntuaciones y reiniciar</button>
        </div>
        <div id="players-ranking"></div>
      </div>
    </div>
  `;

  const playersRanking = document.getElementById("players-ranking");
  const sortAlphabeticallyBtn = document.getElementById("sort-alphabetically-btn");
  const resetScoresBtn = document.getElementById("reset-scores-btn");
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

  resetScoresBtn.addEventListener("click", async () => {
    const result = await makeRequest("/api/game/reset-scores", "POST");
    if (result.success) {
      console.log("Puntuaciones reiniciadas exitosamente");
      navigateTo("/");
    }
  });

  // Listen for scores reset event to go back to main screen
  socket.on("scoresReset", () => {
    navigateTo("/");
  });
}
