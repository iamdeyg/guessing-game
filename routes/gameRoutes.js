// /routes/gameRoutes.js
import express from "express";
import {
  createSession,
  joinSession,
  setQuestion,
  startGame,
  guess,
} from "../controllers/gameController.js";

const router = express.Router();

router.post("/createSession", (req, res) => createSession(req, res));
router.post("/joinSession", (req, res) => joinSession(req, res));
router.post("/setQuestion", (req, res) => setQuestion(req, res));
router.post("/startGame", (req, res) => startGame(req, res));
router.post("/guess", (req, res) => guess(req, res));

export default router;
