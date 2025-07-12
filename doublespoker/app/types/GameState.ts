import { Card } from "./Card";

export interface gameState {
    isRaised: boolean;
    raiseIndex: number;
    started: boolean;
    players: {
        id: number;
        cards: Card[];
        tokens: number;
        isPlaying: boolean;
        lastBet: number;
    }[];

    communityCards: Card[],
    currentHighestBet: number,
    pot: number,
    currentPlayerNumber: number, // First turn goes to Player 1
    roundNumber: number,
    winUser: number,
    hasUserWon: boolean,
    actionLog: string[],
    cycleCompleted: boolean;
    lastToAct: number;

}