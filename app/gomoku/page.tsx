"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Bot, User, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";

const SIZE = 15;
const EMPTY = 0;
const HUMAN = 1;
const AI = 2;
const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

type LineInfo = { count: number; openEnds: number };

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const createBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));

function cloneBoard(board: number[][]) {
  return board.map((row) => [...row]);
}

function checkWin(board: number[][], row: number, col: number, player: number) {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    for (const dir of [-1, 1]) {
      let r = row + dr * dir;
      let c = col + dc * dir;
      while (inBounds(r, c) && board[r][c] === player) {
        count += 1;
        r += dr * dir;
        c += dc * dir;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

function isBoardFull(board: number[][]) {
  return board.every((row) => row.every((cell) => cell !== EMPTY));
}

function getLineInfo(board: number[][], row: number, col: number, dr: number, dc: number, player: number): LineInfo {
  let count = 1;
  let openEnds = 0;

  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c) && board[r][c] === player) {
    count += 1;
    r += dr;
    c += dc;
  }
  if (inBounds(r, c) && board[r][c] === EMPTY) openEnds += 1;

  r = row - dr;
  c = col - dc;
  while (inBounds(r, c) && board[r][c] === player) {
    count += 1;
    r -= dr;
    c -= dc;
  }
  if (inBounds(r, c) && board[r][c] === EMPTY) openEnds += 1;

  return { count, openEnds };
}

function patternScore(count: number, openEnds: number) {
  if (count >= 5) return 1_000_000;
  if (count === 4 && openEnds === 2) return 120_000;
  if (count === 4 && openEnds === 1) return 15_000;
  if (count === 3 && openEnds === 2) return 5_000;
  if (count === 3 && openEnds === 1) return 600;
  if (count === 2 && openEnds === 2) return 180;
  if (count === 2 && openEnds === 1) return 40;
  if (count === 1 && openEnds === 2) return 10;
  return 0;
}

function evaluatePosition(board: number[][], row: number, col: number, player: number) {
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = getLineInfo(board, row, col, dr, dc, player);
    total += patternScore(count, openEnds);
  }
  return total;
}

function hasNeighbor(board: number[][], row: number, col: number, dist = 2) {
  for (let dr = -dist; dr <= dist; dr++) {
    for (let dc = -dist; dc <= dist; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (inBounds(r, c) && board[r][c] !== EMPTY) return true;
    }
  }
  return false;
}

function getCandidateMoves(board: number[][]) {
  const moves: [number, number][] = [];
  let hasStone = false;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) hasStone = true;
    }
  }

  if (!hasStone) return [[Math.floor(SIZE / 2), Math.floor(SIZE / 2)]];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY && hasNeighbor(board, r, c, 2)) {
        moves.push([r, c]);
      }
    }
  }

  return moves;
}

function scoreMove(board: number[][], row: number, col: number) {
  const center = SIZE / 2;
  const centerBias = 18 - (Math.abs(row - center) + Math.abs(col - center));

  board[row][col] = AI;
  const attack = evaluatePosition(board, row, col, AI);
  const aiWins = checkWin(board, row, col, AI);
  board[row][col] = EMPTY;

  board[row][col] = HUMAN;
  const defense = evaluatePosition(board, row, col, HUMAN);
  const blockHumanWin = checkWin(board, row, col, HUMAN);
  board[row][col] = EMPTY;

  return {
    row,
    col,
    score:
      (aiWins ? 10_000_000 : 0) +
      attack * 1.25 +
      (blockHumanWin ? 8_000_000 : 0) +
      defense * 1.1 +
      centerBias,
  };
}

function getBestAIMove(board: number[][]) {
  const candidates = getCandidateMoves(board).map(([r, c]) => scoreMove(board, r, c));
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || { row: Math.floor(SIZE / 2), col: Math.floor(SIZE / 2), score: 0 };
}

function useGameAudio(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = () => {
    if (!enabled || typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const beep = (
    frequency = 440,
    duration = 0.08,
    type: OscillatorType = "sine",
    volume = 0.03,
    delay = 0
  ) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  return {
    playPlace: (isAI = false) => {
      beep(isAI ? 420 : 280, 0.07, "triangle", 0.035);
      beep(isAI ? 520 : 360, 0.05, "sine", 0.015, 0.02);
    },
    playWin: () => {
      beep(523.25, 0.1, "triangle", 0.04);
      beep(659.25, 0.1, "triangle", 0.04, 0.08);
      beep(783.99, 0.16, "triangle", 0.05, 0.16);
    },
    playLose: () => {
      beep(392, 0.1, "sawtooth", 0.03);
      beep(311.13, 0.12, "sawtooth", 0.03, 0.08);
      beep(220, 0.18, "sawtooth", 0.03, 0.16);
    },
    playDraw: () => {
      beep(440, 0.08, "sine", 0.025);
      beep(440, 0.08, "sine", 0.025, 0.09);
    },
    playReset: () => {
      beep(330, 0.05, "triangle", 0.02);
      beep(440, 0.06, "triangle", 0.02, 0.05);
    },
  };
}

function Stone({ value, last, justPlaced }: { value: number; last?: boolean; justPlaced?: boolean }) {
  if (value === EMPTY) return null;
  const isHuman = value === HUMAN;

  return (
    <div className="relative flex items-center justify-center">
      {justPlaced ? (
        <div className="absolute h-10 w-10 rounded-full border-2 border-amber-300/80 animate-ping" />
      ) : null}
      <div
        className={`h-7 w-7 rounded-full border shadow-lg transition-all duration-300 animate-in zoom-in-75 fade-in ${
          isHuman
            ? "bg-slate-900 border-slate-700 shadow-slate-900/30"
            : "bg-gradient-to-br from-white via-slate-100 to-slate-300 border-slate-300 shadow-slate-400/30"
        } ${last ? "ring-4 ring-amber-400/80 scale-110" : ""} ${justPlaced ? "scale-110" : ""}`.trim()}
      />
      {last ? <div className="absolute h-2.5 w-2.5 rounded-full bg-amber-400 shadow" /> : null}
    </div>
  );
}

export default function AIGomokuGame() {
  const [board, setBoard] = useState(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState(HUMAN);
  const [winner, setWinner] = useState<number | null>(null);
  const [status, setStatus] = useState("你的回合");
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [flashCells, setFlashCells] = useState<Record<string, number>>({});

  const audio = useGameAudio(soundOn);
  const gameOver = !!winner || isBoardFull(board);

  const stats = useMemo(() => {
    let human = 0;
    let ai = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === HUMAN) human += 1;
        if (board[r][c] === AI) ai += 1;
      }
    }
    return { human, ai };
  }, [board]);

  const triggerCellEffect = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setFlashCells((prev) => ({ ...prev, [key]: Date.now() }));
    window.setTimeout(() => {
      setFlashCells((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 420);
  };

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPlayer(HUMAN);
    setWinner(null);
    setStatus("你的回合");
    setLastMove(null);
    setIsThinking(false);
    setMoveCount(0);
    setFlashCells({});
    audio.playReset();
  };

  const placeStone = (row: number, col: number, player: number) => {
    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = player;
    setBoard(nextBoard);
    setLastMove({ row, col });
    setMoveCount((m) => m + 1);
    triggerCellEffect(row, col);
    audio.playPlace(player === AI);

    if (checkWin(nextBoard, row, col, player)) {
      setWinner(player);
      if (player === HUMAN) {
        setStatus("你贏了，這一手很有殺氣。{}");
        audio.playWin();
      } else {
        setStatus("AI 贏了，它今天像開了天眼。{}");
        audio.playLose();
      }
      return { nextBoard, ended: true };
    }

    if (isBoardFull(nextBoard)) {
      setWinner(0);
      setStatus("平手。這盤棋很有宿命感。");
      audio.playDraw();
      return { nextBoard, ended: true };
    }

    return { nextBoard, ended: false };
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver || isThinking || currentPlayer !== HUMAN || board[row][col] !== EMPTY) return;

    const result = placeStone(row, col, HUMAN);
    if (result.ended) return;

    setCurrentPlayer(AI);
    setStatus("AI 思考中...");
    setIsThinking(true);
  };

  useEffect(() => {
    if (currentPlayer !== AI || winner || !isThinking) return;

    const timer = setTimeout(() => {
      const move = getBestAIMove(board);
      const nextBoard = cloneBoard(board);
      nextBoard[move.row][move.col] = AI;
      setBoard(nextBoard);
      setLastMove({ row: move.row, col: move.col });
      setMoveCount((m) => m + 1);
      triggerCellEffect(move.row, move.col);
      audio.playPlace(true);

      if (checkWin(nextBoard, move.row, move.col, AI)) {
        setWinner(AI);
        setStatus("AI 贏了，它今天像開了天眼。{}");
        setIsThinking(false);
        audio.playLose();
        return;
      }

      if (isBoardFull(nextBoard)) {
        setWinner(0);
        setStatus("平手。這盤棋很有宿命感。");
        setIsThinking(false);
        audio.playDraw();
        return;
      }

      setCurrentPlayer(HUMAN);
      setStatus("你的回合");
      setIsThinking(false);
    }, 420);

    return () => clearTimeout(timer);
  }, [board, currentPlayer, isThinking, winner, audio]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 px-4 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="bg-white/10">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <Sparkles className="h-7 w-7 text-amber-400" /> AI 五子棋對戰
              </CardTitle>
              <p className="mt-2 text-sm text-slate-300">
                你執黑先手，AI 執白。這版新增音效、動畫及落子粒子，讓棋局多點儀式感。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setSoundOn((v) => !v)}>
                {soundOn ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                {soundOn ? "音效開" : "音效關"}
              </Button>
              <Button className="rounded-2xl" onClick={resetGame}>
                <RotateCcw className="mr-2 h-4 w-4" /> 重新開始
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
                {currentPlayer === HUMAN ? <User className="mr-2 h-4 w-4" /> : <Bot className="mr-2 h-4 w-4" />}
                {status}
              </Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
                步數 {moveCount}
              </Badge>
              {isThinking ? (
                <Badge className="flex items-center gap-2 rounded-full border border-amber-400/70 bg-amber-500/80 px-4 py-1 text-sm text-white">
                  <Zap className="h-4 w-4" /> AI 思考中
                </Badge>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-3xl border border-amber-200 bg-[#ddb56d] p-3 shadow-inner">
              <div
                className="grid gap-[1px] mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                  width: "min(90vw, 780px)",
                  aspectRatio: "1 / 1",
                }}
              >
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const key = `${r}-${c}`;
                    const isLast = lastMove?.row === r && lastMove?.col === c;
                    const justPlaced = !!flashCells[key];

                    return (
                      <button
                        key={key}
                        onClick={() => handleCellClick(r, c)}
                        className="relative flex items-center justify-center border border-amber-900/25 bg-[#e7c98a] transition-colors hover:bg-[#efd7a6]"
                      >
                        <div className="absolute inset-0 opacity-50 pointer-events-none">
                          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-900/20" />
                          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-amber-900/20" />
                        </div>

                        {(r === 3 || r === 7 || r === 11) &&
                        (c === 3 || c === 7 || c === 11) &&
                        cell === EMPTY ? (
                          <div className="absolute h-1.5 w-1.5 rounded-full bg-amber-900/50" />
                        ) : null}

                        {justPlaced ? (
                          <div className="absolute h-12 w-12 rounded-full bg-amber-200/60 animate-pulse" />
                        ) : null}

                        <Stone value={cell} last={isLast} justPlaced={justPlaced} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/80 text-slate-900">
            <CardHeader>
              <CardTitle className="text-xl">對戰資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" /> 玩家（黑）
                </span>
                <strong>{stats.human}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-4">
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI（白）
                </span>
                <strong>{stats.ai}</strong>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 leading-6 text-slate-800">
                這版新增落子音、勝負音、放大動畫與落點粒子，棋局的儀式感就位了。
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 text-slate-900">
            <CardHeader>
              <CardTitle className="text-xl">規則</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6">
              <p>黑棋先手，白棋後手。</p>
              <p>橫、直、斜任意方向連成五子即勝。</p>
              <p>點選空格落子，右上角可以切換音效。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
