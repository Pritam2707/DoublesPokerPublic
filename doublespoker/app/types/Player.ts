import { Card } from "./Card";

export interface Player {
    id: number;
    cards: Card[]
    tokens: number;
    isPlaying: boolean;
    lastBet: number;
};
