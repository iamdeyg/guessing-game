// /models/gameSession.js
export default class GameSession {
  constructor(sessionId, masterId) {
    this.sessionId = sessionId;
    this.masterId = masterId;
    this.players = {};
    this.answer = "";
    this.gameInProgress = false;
    this.timer = null;
    this.question = "";
  }
}
