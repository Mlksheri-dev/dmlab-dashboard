import React, { useMemo, useState, useEffect } from 'react';

interface MiniWaveChartProps {
    color?: string;
    height?: number;
    width?: number;
    animate?: boolean;
    intensity?: number;
    showGrid?: boolean;
}

export function MiniWaveChart({
    color = "#3b82f6",
    height = 40,
    width = 120,
    animate = true,
    intensity = 0.5,
    showGrid = true
}: MiniWaveChartProps) {
    const [currentColor, setCurrentColor] = useState(color);

    useEffect(() => {
        if (!animate) return;
        const colors = [
            '#3b82f6', // Electric Blue
            '#00d4ff', // Cyber Cyan
            '#10b981', // Emerald Sync
            '#a3e635', // Acid Lime
            '#fbbf24', // Tech Gold
            '#f97316', // Core Orange
            '#ef4444', // Alert Red
            '#f43f5e', // Rose Pulse
            '#ec4899', // Neon Pink
            '#a855f7', // Quantum Purple
            '#8b5cf6', // Deep Violet
            '#6366f1', // Plasma Indigo
            '#2dd4bf'  // Bio Teal
        ];
        let colorIndex = colors.indexOf(color);
        if (colorIndex === -1) colorIndex = 0;

        const interval = setInterval(() => {
            colorIndex = (colorIndex + 1) % colors.length;
            setCurrentColor(colors[colorIndex]);
        }, 2000);

        return () => clearInterval(interval);
    }, [color, animate]);

    // Use a fixed beauty intensity so Online/Offline look exactly the same
    const displayIntensity = 0.8;

    const generateOrganicSeamlessPath = (scale: number) => {
        const pointsCount = 10;
        const step = width / (pointsCount - 1);
        const baseHeight = height * 0.5;
        const amplitude = (height * 0.35) * displayIntensity * scale;

        // Beautiful organic data points (the one you liked)
        // Note: First and last points are baseHeight to ensure seamless connection
        const data = [
            baseHeight,
            baseHeight - amplitude * 0.8,
            baseHeight + amplitude * 1.2,
            baseHeight - amplitude * 0.5,
            baseHeight + amplitude * 1.0,
            baseHeight - amplitude * 0.9,
            baseHeight + amplitude * 0.4,
            baseHeight - amplitude * 1.3,
            baseHeight + amplitude * 0.6,
            baseHeight // Matches start
        ];

        const generateSegment = (xOffset: number) => {
            let path = "";
            for (let i = 0; i < data.length; i++) {
                const x = (i * step) + xOffset;
                if (i === 0 && xOffset === 0) {
                    path += `M ${x} ${data[i]}`;
                } else if (i === 0) {
                    path += ` L ${x} ${data[i]}`;
                } else {
                    const prevX = ((i - 1) * step) + xOffset;
                    const prevY = data[i - 1];
                    const cp1x = prevX + step / 2;
                    const cp2x = prevX + step / 2;
                    path += ` C ${cp1x} ${prevY}, ${cp2x} ${data[i]}, ${x} ${data[i]}`;
                }
            }
            return path;
        };

        // Tile twice for seamless scroll
        return generateSegment(0) + generateSegment(width);
    };

    const primaryPath = useMemo(() => generateOrganicSeamlessPath(1), [width, height]);
    const secondaryPath = useMemo(() => generateOrganicSeamlessPath(0.7), [width, height]);

    return (
        <div className="relative overflow-hidden shrink-0" style={{ width, height }}>
            <svg width={width * 2} height={height} viewBox={`0 0 ${width * 2} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                {/* Secondary Ghost Wave */}
                <path
                    d={secondaryPath}
                    stroke={currentColor}
                    strokeWidth="1.5"
                    strokeOpacity="0.15"
                    strokeLinecap="round"
                    className="animate-wave-flow"
                    style={{ animationDuration: '5s', transition: 'stroke 1.5s ease-in-out' }}
                />

                {/* Main Premium Wave */}
                <path
                    d={primaryPath}
                    stroke={currentColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-wave-flow"
                    style={{
                        filter: `drop-shadow(0 0 12px ${currentColor})`,
                        transition: 'stroke 1.5s ease-in-out, filter 1.5s ease-in-out',
                        animationDuration: '3s'
                    }}
                />
            </svg>

            {/* Liquid Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        </div>
    );
}
