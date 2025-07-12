import React, { ReactNode } from "react";

export const Modal: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-black p-6 rounded-lg shadow-lg w-80 text-center">
                {children}

            </div>
        </div>
    );
};
