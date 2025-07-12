import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"; // Adjust based on your Firebase setup

const useGameLogs = (roomCode: string) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [loadingLogs, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!roomCode) return;

        const gameRef = doc(db, "games", roomCode);

        const unsubscribe = onSnapshot(gameRef, (gameSnap) => {
            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                const actionLog = gameData.actionLog ?? [];

                // Keep only the last 100 logs
                setLogs(actionLog.slice(-100));
            }
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [roomCode]);

    // Memoize logs to prevent unnecessary re-renders

    return { logs, loadingLogs };
};

export default useGameLogs;
