// /controllers/gameController.js
import GameSession from "../models/gameSession.js";

let sessions = {};

function updateSession(session, io) {
  const data = {
    players: Object.values(session.players).map((p) => ({
      username: p.username,
      score: p.score,
    })),
    playerCount: Object.keys(session.players).length,
  };
  io.to(session.sessionId).emit("sessionUpdate", data);
}

function createSession(socket, io, data) {
  const sessionId = "session-" + socket.id;
  const newSession = new GameSession(sessionId, socket.id);
  newSession.players[socket.id] = {
    username: data.username || "Master",
    score: 0,
    attempts: 3,
  };
  sessions[sessionId] = newSession;
  socket.join(sessionId);
  socket.emit("sessionCreated", { sessionId });
  updateSession(newSession, io);
}

function joinSession(socket, io, data) {
  const sessionId = data.sessionId.trim();
  const session = sessions[sessionId];
  if (!session) {
    socket.emit("errorMsg", { msg: "Session does not exist" });
    return;
  }
  if (session.gameInProgress) {
    socket.emit("errorMsg", { msg: "Game already in progress" });
    return;
  }
  session.players[socket.id] = {
    username: data.username || "Player",
    score: 0,
    attempts: 3,
  };
  socket.join(sessionId);
  updateSession(session, io);
}

function setQuestion(socket, data) {
  const session = Object.values(sessions).find((s) => s.masterId === socket.id);
  if (!session) {
    socket.emit("errorMsg", { msg: "You are not a game master" });
    return;
  }
  session.question = data.question;
  session.answer = data.answer;
  socket.emit("message", {
    msg: "Question and answer set. Ready to start the game.",
  });
}

function startGame(socket, io) {
  const session = Object.values(sessions).find((s) => s.masterId === socket.id);
  if (!session) {
    socket.emit("errorMsg", { msg: "You are not a game master" });
    return;
  }
  if (Object.keys(session.players).length < 3) {
    socket.emit("errorMsg", {
      msg: "At least 3 players (including game master) required to start game",
    });
    return;
  }
  session.gameInProgress = true;
  io.to(session.sessionId).emit("gameStarted", { question: session.question });

  session.timer = setTimeout(() => {
    session.gameInProgress = false;
    io.to(session.sessionId).emit("gameEnded", {
      msg: "Time expired",
      answer: session.answer,
    });
    Object.keys(session.players).forEach(
      (pid) => (session.players[pid].attempts = 3)
    );
  }, 60000);
}

function guess(socket, data, io) {
  const session = Object.values(sessions).find((s) => s.players[socket.id]);
  if (!session || !session.gameInProgress) {
    socket.emit("errorMsg", { msg: "No active game session for you" });
    return;
  }
  let player = session.players[socket.id];
  if (player.attempts <= 0) {
    socket.emit("message", { msg: "No active game session for you" });
    return;
  }
  player.attempts -= 1;
  if (data.guess.toLowerCase() === session.answer.toLowerCase()) {
    clearTimeout(session.timer);
    session.gameInProgress = false;
    player.score += 10;
    io.to(session.sessionId).emit("gameEnded", {
      msg: `${player.username} has won! The answer was: ${session.answer}`,
      winner: player.username,
    });
    updateSession(session, io);
    Object.keys(session.players).forEach(
      (pid) => (session.players[pid].attempts = 3)
    );
  } else {
    socket.emit("message", {
      msg: `Wrong guess. Attempts left: ${player.attempts}`,
    });
  }
}

export { createSession, joinSession, setQuestion, startGame, guess };
