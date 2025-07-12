"use client"
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Settings() {
    const router = useRouter();
    const [name, setName] = useState<string>("");
    const [image, setImage] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
            <h1 className="text-4xl font-bold mb-6">Settings</h1>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-80 text-center">
                <label className="cursor-pointer block mb-4">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {image ? (
                        <Image src={image} alt="Profile Picture" width={100} height={100} className="rounded-full mx-auto border-2 border-white" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto flex items-center justify-center text-gray-300">Upload</div>
                    )}
                </label>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-gray-200  rounded-md mb-4"
                />
                <button className="w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">Save(Under development)</button>
            </div>
            <button onClick={() => router.push("/")} className="mt-6 text-gray-300 hover:underline">Back to Home</button>
        </div>
    );
}