"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (

    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black to-gray-800 text-white">
      <h1 className="text-3xl md:text-6xl font-extrabold mb-10 mx-1 stext-gray-200 drop-shadow-xl">
        Doubles Poker
      </h1>
      <p className=" text-md mx-1 md:text-lg text-gray-400 mb-6">
        A thrilling poker experience with a modern twist!
      </p>
      <div className="flex space-x-6">
        <button
          className="px-10 py-4 bg-green-500 rounded-full shadow-xl text-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-110"
          onClick={() => router.push("/play")}
        >
          Play Now
        </button>
        <button
          className="px-10 py-4 bg-gray-700 rounded-full shadow-xl text-lg font-semibold hover:bg-gray-600 transition-all transform hover:scale-110"
          onClick={() => router.push("/settings")}
        >
          Settings
        </button>
      </div>
    </div>

  );
}
