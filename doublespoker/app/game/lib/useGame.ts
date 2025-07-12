import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { gameState } from "@/app/types/GameState";
import { db } from "@/app/lib/firebase";
import { Player } from "@/app/types/Player";
import { evaluateGame } from "./evaluateGame";

const useGame = (roomCode: string, currentUser: string) => {
    const [gameState, setGameState] = useState<gameState | null>(null)
    const [loading, setLoading] = useState(false);
    const [showWinUser, setShowWinUser] = useState(false);
    const [minRaise, setMinRaise] = useState<number>(2);
    const [maxRaise, setMaxRaise] = useState<number>(20);
    const [result, setResult] = useState('')

    useEffect(() => {
        if (!roomCode) return;
        setLoading(true);

        const gameRef = doc(db, "games", roomCode);
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                const gameState = snapshot.data() as gameState;
                setGameState(gameState)
                setMinRaise(gameState.currentHighestBet + 1);
                setMaxRaise(
                    Math.min(...gameState.players.map(player => player.tokens)) +
                    Math.min(...gameState.players.map(player => player.lastBet))
                )
                // **Check if only one player remains active**
                const activePlayers = gameState.players.filter((player: Player) => player);
                if (activePlayers.length === 1) {
                    evaluateGame(roomCode, gameState); // Declare winner
                    return; // Stop further execution
                }

                if (gameState.hasUserWon) {
                    switch (gameState.winUser) {
                        case 1:
                            setResult("The creator of the match has won the game");
                            break;
                        case 2:
                            setResult("The player who joined has won the game");
                            break;
                        case 3:
                            setResult("It was a tie between the two players");
                            break;
                        default:
                            break;
                    }
                    setShowWinUser(true);
                }
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [roomCode, currentUser]);

    return { gameState, loading, showWinUser, result, maxRaise, minRaise };
};

export default useGame;
