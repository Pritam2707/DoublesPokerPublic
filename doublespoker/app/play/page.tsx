"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, updateDoc, onSnapshot, arrayUnion, setDoc } from "firebase/firestore";
import shuffle from "lodash/shuffle";
import { fullDeck } from "../cards";
import { useRouter } from "next/navigation";
import { gameState } from "../types/GameState";

export default function Play() {

    const [gameId, setGameId] = useState<string | null>(null);
    const [playerNumber, setPlayerNumber] = useState<number | null>(null);
    const [gameData, setGameData] = useState<gameState | null>(null);
    const [status, setStatus] = useState("Idle");
    const [gameIdInput, setGameIdInput] = useState<string>("");
    const router = useRouter();
    useEffect(() => {
        if (gameId) {
            const gameRef = doc(db, "games", gameId);
            const unsubscribe = onSnapshot(gameRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setGameData(data as gameState);
                    if (data.started) {
                        setStatus("Game Started!Entering in 3 secs");
                        setTimeout(() => {
                            router.push(`/game?room=${gameId}&user=User${playerNumber}`);
                        }, 3000);
                    } else if (data.players.length === 2) {
                        setStatus("Ready to Start!");
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [gameId, playerNumber, router]);

    const createRoom = async () => {
        const gameRef = await addDoc(collection(db, "games"), {
            players: [],
            started: false,
        });
        setGameId(gameRef.id);
        setPlayerNumber(1);
        setStatus("Waiting for another player...");
        await updateDoc(doc(db, "games", gameRef.id), {
            players: [{ id: 1, user: "Player1" }],
        });
    };

    const joinRoom = async () => {
        if (!gameIdInput) return;

        const gameRef = doc(db, "games", gameIdInput);
        setGameId(gameIdInput);
        setPlayerNumber(2);
        setStatus("Waiting to start...");

        await updateDoc(gameRef, {
            players: arrayUnion({ id: 2, user: "Player2" }),
        });
    };


    const startGame = async () => {
        if (!gameId || playerNumber !== 1) return;

        const shuffledDeck = shuffle(fullDeck);

        const players = [
            { id: 1, cards: [shuffledDeck.pop(), shuffledDeck.pop()], tokens: 9, isPlaying: true, lastBet: 1 },
            { id: 2, cards: [shuffledDeck.pop(), shuffledDeck.pop()], tokens: 9, isPlaying: true, lastBet: 1 },
            { id: 3, cards: [shuffledDeck.pop(), shuffledDeck.pop()], tokens: 9, isPlaying: true, lastBet: 1 },
            { id: 4, cards: [shuffledDeck.pop(), shuffledDeck.pop()], tokens: 9, isPlaying: true, lastBet: 1 }
        ];

        const communityCards = [
            shuffledDeck.pop(),
            shuffledDeck.pop(),
            shuffledDeck.pop(),
            shuffledDeck.pop(),
            shuffledDeck.pop()
        ];


        await setDoc(doc(db, "games", gameId), {
            isRaised: false,
            raiseIndex: -1,
            started: true,
            players,
            communityCards,
            currentHighestBet: 1,
            pot: 4,
            currentPlayerNumber: 1, // First turn goes to Player 1
            roundNumber: 1,
            winners: null,
            winUser: 0,
            hasUserWon: false,
            actionLog: [],
            cycleCompleted: false,
            lastToAct: -1,
        } as gameState);



    };


    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black p-2 text-white">
            <div className="bg-gray-800 shadow-xl rounded-2xl p-8 w-96 text-center border border-gray-700">
                <h1 className="text-3xl font-extrabold text-green-400 mb-4">Poker Lobby</h1>
                <p className="text-gray-400 mb-6">{status}</p>

                {!gameId ? (
                    <div className="space-y-4">
                        <button
                            onClick={createRoom}
                            className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg font-semibold shadow-md transition-all transform hover:scale-105"
                        >
                            Create Room
                        </button>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Enter Game ID"
                                value={gameIdInput}
                                onChange={(e) => setGameIdInput(e.target.value.trim())}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-600 outline-none"
                            />
                            <button
                                onClick={joinRoom}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-lg shadow-md transition-all transform hover:scale-105"
                            >
                                Join
                            </button>

                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg text-gray-300">Game ID: <span className="font-bold text-white">{gameId}</span></h2>
                        {playerNumber === 1 && gameData?.players?.length === 2 && !gameData.started && (
                            <button
                                onClick={startGame}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-lg text-lg font-semibold shadow-md transition-all transform hover:scale-105"
                            >
                                Start Game
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
