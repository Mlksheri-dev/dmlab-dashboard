import React, { useMemo, useState, useEffect } from 'react';

interface MiniWaveChartProps {
    color?: string;
    height?: number;
    width?: number;
    animate?: boolean;
    intensity?: number;
    showGrid?: boolean;
    isOnline?: boolean;
}

export function MiniWaveChart({
    color = "#3b82f6",
    height = 40,
    width = 120,
    animate = true,
    intensity = 0.5,
    showGrid = true,
    isOnline = true
}: MiniWaveChartProps) {
    const [currentColor, setCurrentColor] = useState(isOnline ? "#10b981" : "#ef4444");

    useEffect(() => {
        setCurrentColor(isOnline ? "#10b981" : "#ef4444");
    }, [isOnline]);

    // Generate Path Logic
    const generatePath = (isWave: boolean) => {
        if (!isWave) {
            // Straight Line for Offline
            const midY = height / 2;
            return `M 0 ${midY} L ${width * 2} ${midY}`;
        }

        const pointsCount = 10;
        const step = width / (pointsCount - 1);
        const baseHeight = height * 0.5;
        // Use fixed intensity for beauty
        const amplitude = (height * 0.35) * 0.8;

        // Beautiful organic data points
        const data = [0, -0.8, 1.2, -0.5, 1.0, -0.9, 0.4, -1.3, 0.6, 0];

        let path = "";
        const generateSegment = (xOffset: number) => {
            let segPath = "";
            for (let i = 0; i < data.length; i++) {
                const x = (i * step) + xOffset;
                const y = baseHeight + (data[i] * amplitude);

                if (i === 0 && xOffset === 0) {
                    segPath += `M ${x} ${y}`;
                } else if (i === 0) {
                    segPath += ` L ${x} ${y}`;
                } else {
                    const prevX = ((i - 1) * step) + xOffset;
                    const prevY = baseHeight + (data[i - 1] * amplitude);
                    const cp1x = prevX + step / 2;
                    const cp2x = prevX + step / 2;
                    segPath += ` C ${cp1x} ${prevY}, ${cp2x} ${y}, ${x} ${y}`;
                }
            }
            return segPath;
        };

        return generateSegment(0) + generateSegment(width);
    };

    // Memoize paths based on status
    const primaryPath = useMemo(() => generatePath(isOnline), [width, height, isOnline]);
    const secondaryPath = useMemo(() => generatePath(isOnline), [width, height, isOnline]);

    return (
        <div className="relative overflow-hidden shrink-0" style={{ width, height }}>
            <svg width={width * 2} height={height} viewBox={`0 0 ${width * 2} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                {/* Secondary Ghost Wave (Only visible if online) */}
                {isOnline && (
                    <path
                        d={secondaryPath}
                        stroke={currentColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.15"
                        strokeLinecap="round"
                        className="animate-wave-flow"
                        style={{ animationDuration: '5s', transition: 'stroke 0.5s ease-in-out' }}
                    />
                )}

                {/* Main Path */}
                <path
                    d={primaryPath}
                    stroke={currentColor}
                    strokeWidth={isOnline ? "3" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isOnline ? "animate-wave-flow" : ""}
                    style={{
                        filter: isOnline ? `drop-shadow(0 0 12px ${currentColor})` : 'none',
                        transition: 'stroke 0.5s ease-in-out, filter 0.5s ease-in-out',
                        animationDuration: '3s'
                    }}
                />
            </svg>

            {/* Shine effect only if online */}
            {isOnline && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            )}
        </div>
    );
}
