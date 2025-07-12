import { db } from "@/app/lib/firebase";
import { Card } from "@/app/types/Card";
import { gameState } from "@/app/types/GameState";
import { Player } from "@/app/types/Player";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { initializeGame } from "./intializeGame";
import { merge } from "lodash";

export async function evaluateGame(roomCode: string, updates: Partial<gameState>) {
    console.log("Evaluating the game...");
    const gameRef = doc(db, "games", roomCode);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return;

    const gameData = merge({}, gameSnap.data() as gameState, updates);

    const players: Player[] = gameData.players;
    const communityCards: Card[] = gameData.communityCards;
    const potMoney: number = gameData.pot;
    const actionLog = gameData.actionLog;
    const bestHands: { playerId: number; handRank: number; values: number[]; bestHand: Card[] }[] = [];
    for (let id = 1; id <= players.length; id++) {
        const player = players[id - 1]; // Access player object
        if (!player.isPlaying) continue;
        const bestHand = getBestHand(player.cards, communityCards);
        const { rank: handRank, values } = rankHand(bestHand);
        bestHands.push({ playerId: id, handRank, values, bestHand });
        console.log(`Player ${id}: Best Hand: ${bestHand.map(card => `${card.rank} of ${card.suit}`).join(", ")}, Rank: ${handRank}, Values: ${values}`);
    }

    // Sort by rank first, then by kicker values
    bestHands.sort((a, b) => {
        if (b.handRank !== a.handRank) return b.handRank - a.handRank; // Higher rank wins
        for (let i = 0; i < Math.min(a.values.length, b.values.length); i++) {
            if (b.values[i] !== a.values[i]) return b.values[i] - a.values[i]; // Compare highest kickers
        }
        return 0; // Exact tie
    });

    // Determine the highest-ranking hand
    const bestHandRank = bestHands[0].handRank;
    const bestHandValues = bestHands[0].values;

    // Find all winners with the same rank and kicker values
    const winners = bestHands.filter(h => h.handRank === bestHandRank && h.values.join(",") === bestHandValues.join(","))
        .map(h => h.playerId);

    // Split pot if multiple winners
    const prize = winners.length > 0 ? Math.floor(potMoney / winners.length) : 0;
    const remainingPot = potMoney - (prize * winners.length);

    // Update player balances
    let winMessage = "Player/s ";
    winners.forEach((winnerId) => {
        winMessage += winnerId + "(gets" + prize + ")" + " ";
        const winnerIndex = players.findIndex(player => player.id === winnerId);
        if (winnerIndex !== -1) {
            players[winnerIndex].tokens += prize;
        }
    });

    // Assign remainder to the first winner
    if (remainingPot > 0 && winners.length > 0) {
        const firstWinnerIndex = players.findIndex(player => player.id === winners[0]);
        if (firstWinnerIndex !== -1) {
            players[firstWinnerIndex].tokens += remainingPot;
        }
    }

    // Fix trim issue
    actionLog.push(winMessage.trim() + " won the match proceeding next round");

    const zeroTokenPlayers = players.filter(player => player.tokens === 0);

    let hasUser1Won = false; // For players 1 or 3
    let hasUser2Won = false; // For players 2 or 4

    const hasUserWon = zeroTokenPlayers.length > 0;
    zeroTokenPlayers.forEach(player => {
        if (player.id === 1 || player.id === 3) {
            hasUser2Won = true;

        } else if (player.id === 2 || player.id === 4) {
            hasUser1Won = true;
        } else {
            console.log(`No action for Player ${player.id}`);
        }
    });




    // Update game state with winners and new balances
    await updateDoc(gameRef, {
        hasUserWon,
        winUser: (hasUser1Won && hasUser2Won) ? 3 : hasUser1Won ? 1 : hasUser2Won ? 2 : -1,
        winners,
        players,
    });

    console.log(`Winners: ${winners.join(", ")} received ${prize} each.`);
    if (!hasUserWon)
        initializeGame(gameRef, gameData)
}

function getBestHand(playerCards: Card[], communityCards: Card[]): Card[] {
    const allCards = [...playerCards, ...communityCards];
    const combinations = getCombinations(allCards, 5);

    return combinations.reduce((best, hand) => {
        const bestRank = rankHand(best);
        const newRank = rankHand(hand);

        if (newRank.rank > bestRank.rank) return hand; // Higher rank wins
        if (newRank.rank < bestRank.rank) return best; // Lower rank loses

        // If rank is the same, compare values for tie-breaking
        for (let i = 0; i < newRank.values.length; i++) {
            if (newRank.values[i] > bestRank.values[i]) return hand;
            if (newRank.values[i] < bestRank.values[i]) return best;
        }

        return best; // If all values are identical, keep the first hand (edge case)
    }, combinations[0] || []);
}

function rankHand(hand: Card[]): { rank: number, values: number[] } {
    const values = hand.map(card => "23456789TJQKA".indexOf(card.rank)).sort((a, b) => b - a);
    const suits = hand.map(card => card.suit);
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

    // Check for a valid straight (5 consecutive unique values)
    let isStraight = false;
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
            isStraight = true;
            break;
        }
    }

    const isFlush = new Set(suits).size === 1;

    if (isFlush && isStraight && uniqueValues[0] === 12) return { rank: 10, values: uniqueValues }; // Royal Flush
    if (isFlush && isStraight) return { rank: 9, values: uniqueValues }; // Straight Flush
    if (hasDuplicates(values, 4)) return { rank: 8, values: getSortedByFrequency(values, 4) }; // Four of a Kind
    if (hasDuplicates(values, 3) && hasDuplicates(values, 2)) return { rank: 7, values: getSortedByFrequency(values, 3, 2) }; // Full House
    if (isFlush) return { rank: 6, values: values }; // Flush
    if (isStraight) return { rank: 5, values: uniqueValues }; // Straight
    if (hasDuplicates(values, 3)) return { rank: 4, values: getSortedByFrequency(values, 3) }; // Three of a Kind
    if (hasTwoPairs(values)) return { rank: 3, values: getSortedByFrequency(values, 2, 2) }; // Two Pair
    if (hasDuplicates(values, 2)) return { rank: 2, values: getSortedByFrequency(values, 2) }; // One Pair

    return { rank: 1, values: values }; // High Card
}

function getSortedByFrequency(values: number[], firstCount: number, secondCount?: number): number[] {
    const freqMap = values.reduce((acc, v) => (acc[v] = (acc[v] || 0) + 1, acc), {} as Record<number, number>);
    const sorted = Object.keys(freqMap)
        .map(Number)
        .sort((a, b) => {
            if (freqMap[a] !== freqMap[b]) return freqMap[b] - freqMap[a]; // Higher frequency first
            return b - a; // Higher value first
        });

    const primary = sorted.filter(v => freqMap[v] === firstCount);
    const secondary = secondCount ? sorted.filter(v => freqMap[v] === secondCount) : [];
    const kickers = sorted.filter(v => !primary.includes(v) && !secondary.includes(v));

    return [...primary, ...secondary, ...kickers];
}


function getCombinations(cards: Card[], handSize: number): Card[][] {
    const result: Card[][] = [];
    const indices = Array.from({ length: handSize }, (_, i) => i);
    const n = cards.length;

    while (true) {
        result.push(indices.map(i => cards[i]));

        let i = handSize - 1;
        while (i >= 0 && indices[i] === i + n - handSize) i--;

        if (i < 0) break;

        indices[i]++;
        for (let j = i + 1; j < handSize; j++) indices[j] = indices[j - 1] + 1;
    }

    return result;
}

function hasDuplicates(values: number[], count: number): boolean {
    return [...new Set(values)].some(val => values.filter(v => v === val).length === count);
}

function hasTwoPairs(values: number[]): boolean {
    const uniquePairs = new Set(values.filter(v => values.filter(x => x === v).length === 2));
    return uniquePairs.size === 2;
}