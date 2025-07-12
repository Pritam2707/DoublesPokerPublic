import { Card } from "@/app/types/Card";
import { Player } from "@/app/types/Player";
import { DocumentData, DocumentReference, setDoc } from "firebase/firestore";
import { shuffleDeck } from "./shuffleDeck";
import { gameState } from "@/app/types/GameState";

export async function initializeGame(gameRef: DocumentReference<DocumentData, DocumentData>, gameData: gameState) {
    const players = gameData.players as Player[]
    if (!players) return;

    const deck: Card[] = shuffleDeck();

    // Create an array of player objects
    const playersInit: Player[] = players.map((player) => ({
        id: player.id,
        cards: [deck.pop()!, deck.pop()!],
        tokens: Math.max(0, player.tokens - 1), // Ensure tokens never go negative
        isPlaying: player.tokens > 0, // Player can't play if out of tokens
        lastBet: 1
    }));

    const communityCards: Card[] = [
        deck.pop()!,
        deck.pop()!,
        deck.pop()!,
        deck.pop()!,
        deck.pop()!,
    ];

    await setDoc(gameRef, {

        isRaised: false,
        raiseIndex: -1,
        started: true,
        players: playersInit,
        currentHighestBet: 1,
        communityCards,
        pot: 4,
        currentPlayerNumber: 1,
        roundNumber: 1,
        winners: null,
        winUser: gameData.winUser,
        hasUserWon: gameData.hasUserWon,
        actionLog: gameData.actionLog,
        cycleCompleted: false,
        lastToAct: -1,
    } as gameState);
}