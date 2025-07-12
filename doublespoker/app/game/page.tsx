"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import useGameLogs from "../lib/hooks/useLogs";
import { evaluateGame } from "./lib/evaluateGame";
import useGame from "./lib/useGame";
import { Modal } from "../Modal";
import { Player } from "../types/Player";

export default function GamePage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
                    <p className="mt-4 text-lg font-semibold">Loading game onto device...</p>
                </div>
            }
        >
            <SearchParamsWrapper />
        </Suspense>
    );
}

function SearchParamsWrapper() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get("room");
    const currentUser = searchParams.get("user");

    if (!currentUser || !roomCode) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-red-700 text-white p-6">
                <h1 className="text-3xl font-bold">Error</h1>
                <p className="mt-4 text-lg">Invalid Parameters, could not find the game</p>
            </div>
        );
    }

    return <Game currentUser={currentUser} roomCode={roomCode} />;
}
//each user has 2 players

function Game({ roomCode, currentUser }: { roomCode: string, currentUser: string }) {
    const router = useRouter();
    const { logs } = useGameLogs(roomCode);
    const [isLogModalOpen, setLogModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"raise" | "call" | null>(null)
    const { loading, gameState, showWinUser, result, maxRaise, minRaise } = useGame(roomCode, currentUser);
    const [raise, setRaise] = useState<number>(minRaise)
    if (loading)
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
                <p className="mt-4 text-lg font-semibold">Loading game onto device...</p>
            </div>
        );
    if (gameState === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <p className="mt-4 text-lg font-semibold">The game state could not be loaded onto the device(You may reload)</p>
            </div>
        );
    }

    const handleAction = async (action: "fold" | "call" | "raise", amount?: number) => {
        if (!gameState) return;

        const isUserTurn =
            (currentUser === "User1" && gameState.currentPlayerNumber % 2 === 1) ||
            (currentUser === "User2" && gameState.currentPlayerNumber % 2 === 0);
        if (!isUserTurn) return;

        const gameRef = doc(db, "games", roomCode);
        const playerIndex = gameState.currentPlayerNumber - 1;
        const player = gameState.players[playerIndex];
        let pot = gameState.pot

        let logEntry = `Round ${gameState.roundNumber} - Player ${gameState.currentPlayerNumber} ${action}`;
        const updates: Partial<typeof gameState> = {};

        switch (action) {
            case "fold":
                player.isPlaying = false;
                break;
            case "call":
                const betDifference = gameState.currentHighestBet - player.lastBet;
                player.tokens -= betDifference;  // Deduct only the extra amount needed
                player.lastBet += betDifference; // Update the player's total bet
                logEntry += ` ${gameState.currentHighestBet} tokens`;
                pot += betDifference; // Add only the additional bet amount to the pot
                break;
            case "raise":
                if (!amount || amount < minRaise || amount > maxRaise) return;
                pot += (amount - player.lastBet);
                player.tokens -= amount - player.lastBet;
                player.lastBet = amount
                gameState.isRaised = true;
                gameState.raiseIndex = gameState.currentPlayerNumber;
                gameState.currentHighestBet = amount;
                logEntry += ` to ${amount} tokens`;
                break;
        }

        setModalType(null);
        gameState.actionLog.push(logEntry);
        if (gameState.actionLog.length > 20) gameState.actionLog.shift();

        updates.actionLog = gameState.actionLog;
        updates.pot = pot
        updates.players = gameState.players;
        updates.currentHighestBet = gameState.currentHighestBet;


        // Determine next active player
        let nextPlayer = gameState.currentPlayerNumber;
        const activePlayers = gameState.players.filter(p => p.isPlaying);
        if (activePlayers.length > 1) {
            do {
                nextPlayer = (nextPlayer % gameState.players.length) + 1;
            } while (!gameState.players[nextPlayer - 1].isPlaying);
        } else {
            await evaluateGame(roomCode, updates);
            return;
        }

        // Cycle detection
        if (gameState.lastToAct === -1 && player.isPlaying) {
            gameState.lastToAct = gameState.currentPlayerNumber;
        } else if (!gameState.isRaised && nextPlayer === gameState.lastToAct) {
            gameState.cycleCompleted = true;
        }

        // Move to the next round if needed
        if (gameState.cycleCompleted || (gameState.isRaised && nextPlayer === gameState.raiseIndex)) {
            Object.assign(gameState, {
                roundNumber: gameState.roundNumber + 1,
                lastToAct: -1,
                cycleCompleted: false,
                raiseIndex: -1,
                isRaised: false,
            });
        }

        updates.currentPlayerNumber = nextPlayer;
        updates.roundNumber = gameState.roundNumber;
        updates.lastToAct = gameState.lastToAct;
        updates.cycleCompleted = gameState.cycleCompleted;
        updates.raiseIndex = gameState.raiseIndex;
        updates.isRaised = gameState.isRaised;
        if (gameState.roundNumber > 3) {
            await evaluateGame(roomCode, updates);
            return;
        }
        await updateDoc(gameRef, updates);
    };
    const truncateLog = (log: string) => {
        const maxLength = window.innerWidth / 2 / 8; // Approximate max chars based on screen width
        return log.length > maxLength ? log.substring(0, maxLength) + "..." : log;
    };


    const PlayerCards = ({ player }: { player: Player }) => (
        <div key={player.id} className="flex flex-col items-center">
            <span>Player {player.id} ({player.isPlaying ? "in" : "out"})</span>
            <div className="flex space-x-2">
                {[0, 1].map((i) => (
                    <Image
                        key={i}
                        src={currentUser === "User1" && [1, 3].includes(player.id) || currentUser === "User2" && [2, 4].includes(player.id)
                            ? `${player.cards[i].image}`
                            : "/assets/cards/card_back.png"
                        }
                        alt="Card"
                        width={735}
                        height={1041}
                        className="w-14 h-20 lg:w-16 lg:h-24 rounded-md shadow-md"
                    />
                ))}
            </div>
        </div>
    );

    const CommunityCards = () => (
        <div className="flex space-x-1 justify-center lg:mb-4 bg-gray-900 py-2 lg:p-4 rounded-lg shadow-md">
            {gameState.communityCards.slice(0, 3).map((card, index) => (
                <Image key={index} src={card.image} alt="Community Card" width={735} height={1041} className="w-14 h-20 lg:w-16 lg:h-24 rounded-md shadow-md" />
            ))}
            {[3, 4].map((i) =>
                <Image
                    key={i}
                    src={gameState.roundNumber >= i - 1 ? gameState.communityCards[i].image : "/assets/cards/card_back.png"}
                    alt="Community Card"
                    width={735}
                    height={1041}
                    className="w-14 h-20 lg:w-16 lg:h-24 rounded-md shadow-md"
                />
            )}
        </div>
    );

    const ActionButtons = () => (
        (currentUser === "User1" && gameState.currentPlayerNumber % 2 === 1) || (currentUser === "User2" && gameState.currentPlayerNumber % 2 === 0)
            ? <div className="mt-6 flex space-x-4">
                <button onClick={() => handleAction("fold")} className="btn-red">Fold</button>
                <button onClick={() => setModalType("call")} className="btn-blue">Call</button>
                <button onClick={() => setModalType("raise")} className="btn-yellow">Raise</button>
            </div>
            : <div className="mt-6 text-yellow-400">Waiting for Player {gameState.currentPlayerNumber}&apos;s turn...</div>
    );

    return (
        <div className="w-screen h-full min-h-screen flex flex-col items-center justify-center bg-green-700 text-white p-6 relative">
            <div className="absolute top-4 w-full px-4 flex text-xs justify-between flex-wrap gap-2">
                <div className="bg-gray-900 text-white p-2 rounded-lg cursor-pointer shadow-md flex-shrink-0" onClick={() => setLogModalOpen(true)}>
                    {loading ? "Loading Logs..." : logs.length > 0 ? truncateLog(logs[logs.length - 1]) : "No Logs"}
                </div>
                <div className="flex flex-col p-2 rounded-lg shadow-md w-fit text-right flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                        {gameState.players.map(player => <span key={player.id}>{player.id}: {player.tokens}$</span>)}
                    </div>
                    <span className="mt-1">Pot: {gameState.pot}$</span>
                </div>
            </div>

            <h1 className="text-xl md:text-4xl font-bold mb-6">Poker Table</h1>
            <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center relative">
                <div className="flex justify-between w-full">
                    {gameState.players.slice(0, 2).map(player => <PlayerCards key={player.id} player={player} />)}
                </div>
                <CommunityCards />
                <div className="flex justify-between w-full">
                    {gameState.players.slice(2, 4).map(player => <PlayerCards key={player.id} player={player} />)}
                </div>
                <ActionButtons />
                {modalType && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 ">
                        <div className="text-white p-6 rounded-lg shadow-lg border border-white border-opacity-30"
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
                            {modalType === "call" ? (
                                <div>
                                    <p className="text-white">Call the current bet of ${gameState.currentHighestBet}?</p>
                                    <button onClick={() => handleAction("call")} className="bg-green-500/70 cursor-pointer px-4 py-2 rounded-lg mt-4">Confirm</button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white">Enter a raise amount (greater than ${gameState.currentHighestBet} but less than equal to ${maxRaise}):</p>
                                    {maxRaise < minRaise ? <>You cannot raise anymore</> : <><input
                                        type="number"
                                        className="border border-white border-opacity-50 bg-transparent text-white p-2 w-full mt-2 placeholder-white"
                                        value={raise}
                                        min={minRaise}
                                        max={maxRaise}
                                        onChange={(e) => setRaise(parseInt(e.target.value))}
                                    />
                                        <button onClick={() => handleAction("raise", raise)} className="bg-green-500/70 px-4 py-2 cursor-pointer rounded-lg mt-4">Confirm</button></>}

                                </div>
                            )}
                            <button onClick={() => setModalType(null)} className="block mt-4 bg-red-600 opacity-50 p-2 rounded-md cursor-pointer">Cancel</button>
                        </div>
                    </div>
                )}
            </div>



            {/* Log Modal */}
            {isLogModalOpen && (
                <Modal >
                    <div className="p-6 text-white">
                        <h2 className="text-2xl font-bold mb-4">Game Logs</h2>
                        {loading ? (
                            <p>Loading logs...</p>
                        ) : logs.length > 0 ? (
                            <ul className="max-h-80 overflow-y-scroll">
                                {logs.map((log, index) => (
                                    <li key={index} className="p-2 bg-gray-700 mb-2 rounded">
                                        {log}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No logs available.</p>
                        )}
                        <button onClick={() => setLogModalOpen(false)} className="mt-4 bg-red-500 px-4 py-2 rounded-lg">Close</button>
                    </div>
                </Modal>
            )}


            {showWinUser && (
                <Modal >
                    <div className="flex flex-col items-center text-center p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Match has ended
                        </h2>

                        <p className="text-lg text-gray-300 mb-4">{result}</p>

                        <span className="text-gray-400 text-sm">
                            <button
                                className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg font-semibold shadow-md transition-all transform hover:scale-105"
                                onClick={() => router.push("/play")}>Go to play</button>
                        </span>

                    </div>
                </Modal>
            )}



        </div>
    );
}
