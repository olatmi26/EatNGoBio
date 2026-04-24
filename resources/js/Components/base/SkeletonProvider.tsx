import React, { createContext, useContext, useState, type ReactNode } from "react";

interface SkeletonContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const SkeletonContext = createContext<SkeletonContextType | undefined>(undefined);

export const useSkeleton = (): SkeletonContextType => {
    const context = useContext(SkeletonContext);
    if (!context) {
        throw new Error("useSkeleton must be used within a SkeletonProvider");
    }
    return context;
};

export const SkeletonProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Remove unused useTheme as it's not used in this provider

    const value = React.useMemo(
        () => ({ isLoading, setIsLoading }),
        [isLoading]
    );

    return (
        <SkeletonContext.Provider value={value}>
            {children}
        </SkeletonContext.Provider>
    );
};
