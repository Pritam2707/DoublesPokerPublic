import { fullDeck } from "@/app/cards";

export function shuffleDeck() {
    return [...fullDeck].sort(() => Math.random() - 0.5);
}