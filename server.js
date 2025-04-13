// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import gameRoutes from "./routes/gameRoutes.js";
import {
  createSession,
  joinSession,
  setQuestion,
  startGame,
  guess,
} from "./controllers/gameController.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/api", gameRoutes);

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

io.on("connection", (socket) => {
  console.log("New connection: " + socket.id);

  socket.on("createSession", (data) => {
    createSession(socket, io, data);
  });

  socket.on("joinSession", (data) => {
    joinSession(socket, io, data);
  });

  socket.on("setQuestion", (data) => {
    setQuestion(socket, data);
  });

  socket.on("startGame", () => {
    startGame(socket, io);
  });

  socket.on("guess", (data) => {
    guess(socket, data, io);
  });

  socket.on("chatMessage", (data) => {
    let session = Object.values(sessions).find((s) => s.players[socket.id]);
    if (!session) {
      socket.emit("errorMsg", { msg: "You are not in a session" });
      return;
    }
    io.to(session.sessionId).emit("chatMessage", {
      username: session.players[socket.id].username,
      msg: data.msg,
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);
    for (let sessionId in sessions) {
      let session = sessions[sessionId];
      if (session.players[socket.id]) {
        delete session.players[socket.id];
        if (session.masterId === socket.id) {
          const remaining = Object.keys(session.players);
          if (remaining.length > 0) {
            session.masterId = remaining[0];
            io.to(session.sessionId).emit("message", {
              msg: `${
                session.players[session.masterId].username
              } is the new game master.`,
            });
          }
        }
        updateSession(session, io);
        if (Object.keys(session.players).length === 0) {
          delete sessions[sessionId];
        }
        break;
      }
    }
  });
});

const PORT = 4040;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
