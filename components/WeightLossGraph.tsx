
import React from 'react';

const WeightLossGraph: React.FC<{ startWeight: number; endWeight: number; unit: 'kg' | 'lbs' }> = ({ startWeight, endWeight, unit }) => {
    // The SVG path for a smooth downward curve.
    // M = moveto, C = curveto. Start (0,10), Control1 (150,15), Control2 (150,75), End (300,80)
    const linePath = "M 0,10 C 150,15 150,75 300,80";
    // Path for the filled area under the curve.
    const fillPath = `${linePath} L 300,100 L 0,100 Z`;

    const totalLoss = startWeight - endWeight;
    
    // Calculate projected weights at different milestones assuming a more realistic curve
    // (faster loss at the beginning).
    const weightAt3Months = startWeight - totalLoss * 0.40;
    const weightAt6Months = startWeight - totalLoss * 0.70;

    const milestones = [
        { 
            month: 3, 
            weight: Math.round(weightAt3Months), 
            // Coordinates on the Bezier curve for t=0.25 -> (89, 22.3)
            x: 89, 
            y: 22.3 
        },
        { 
            month: 6, 
            weight: Math.round(weightAt6Months), 
            // Coordinates on the Bezier curve for t=0.5 -> (150, 45)
            x: 150, 
            y: 45 
        },
        { 
            month: 12, 
            weight: Math.round(endWeight), 
            // Coordinates on the Bezier curve for t=1 -> (300, 80)
            x: 295, // a little off the edge for better visibility
            y: 80 
        },
    ];

    return (
        <div className="w-full h-full font-sans">
            <div className="w-full aspect-[2/1] relative">
                <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={fillPath}
                        fill="url(#fillGradient)"
                        className="opacity-0 animate-fade-in"
                        style={{ animationDelay: '1s' }}
                    />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-draw"
                        style={{ strokeDasharray: 500, strokeDashoffset: 500 }}
                    />
                    {/* Milestones markers and labels */}
                    {milestones.map((milestone, index) => (
                        <g 
                            key={milestone.month} 
                            className="opacity-0 animate-fade-in" 
                            style={{ animationDelay: `${1.5 + index * 0.2}s`}}
                        >
                            <circle cx={milestone.x} cy={milestone.y} r="4" fill="white" stroke="#22C55E" strokeWidth="2" />
                             <text
                                x={milestone.x}
                                y={milestone.y - 10}
                                textAnchor="middle"
                                className="font-bold text-[10px] fill-white"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                            >
                                {`${milestone.weight} ${unit}`}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
            <div className="relative flex justify-between text-xs text-white/70 font-semibold -mt-2 px-1">
                <span>Today</span>
                <div className="absolute left-[30%] -translate-x-1/2 text-center">
                    <span>3 Mo</span>
                </div>
                 <div className="absolute left-1/2 -translate-x-1/2 text-center">
                    <span>6 Mo</span>
                </div>
                <span>12 Mo</span>
            </div>
        </div>
    );
};

export default WeightLossGraph;
