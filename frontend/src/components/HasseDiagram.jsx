import React from "react";
import { ArrowUp } from "lucide-react";

export default function HasseDiagram({
  activeStages = [],
  highlightColor = "border-orange-500 bg-orange-50 text-orange-700",
  onNodeClick,
}) {
  // Ordered stages from bottom to top
  const stages = ["raw", "researched", "structured", "drafted", "refined", "published"];
  
  // Node coordinates inside the SVG
  const nodeMap = {
    published: { x: 120, y: 40, label: "published (⊤)" },
    refined: { x: 120, y: 110, label: "refined" },
    drafted: { x: 120, y: 180, label: "drafted" },
    structured: { x: 120, y: 250, label: "structured" },
    researched: { x: 120, y: 320, label: "researched" },
    raw: { x: 120, y: 390, label: "raw (⊥)" },
  };

  const edges = [
    { from: "raw", to: "researched" },
    { from: "researched", to: "structured" },
    { from: "structured", to: "drafted" },
    { from: "drafted", to: "refined" },
    { from: "refined", to: "published" },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-orange-100 rounded-3xl shadow-sm h-full">
      <h3 className="font-semibold text-slate-800 text-sm tracking-wider uppercase mb-1">
        Quantale Hasse Diagram
      </h3>
      <p className="text-[10px] text-slate-500 mb-6 text-center">
        Lattice ordering representation. Click nodes to build custom pipelines.
      </p>

      <div className="relative w-full max-w-[240px] aspect-[2/3]">
        <svg
          className="w-full h-full"
          viewBox="0 0 240 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* SVG Definitions for arrow markers */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fdba74" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
            </marker>
          </defs>

          {/* Draw connecting edges (Hasse covers) */}
          {edges.map((edge, idx) => {
            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];
            const isFromActive = activeStages.includes(edge.from);
            const isToActive = activeStages.includes(edge.to);
            const isEdgeActive = isFromActive && isToActive;

            // Draw line slightly shortened at both ends so it doesn't overlap the node borders
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const offset = 22; // node radius offset
            const x1 = fromNode.x + offset * Math.cos(angle);
            const y1 = fromNode.y + offset * Math.sin(angle);
            const x2 = toNode.x - offset * Math.cos(angle);
            const y2 = toNode.y - offset * Math.sin(angle);

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isEdgeActive ? "#f97316" : "#fed7aa"}
                strokeWidth={isEdgeActive ? 3 : 1.5}
                markerEnd={isEdgeActive ? "url(#arrow-active)" : "url(#arrow)"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Draw interactive node elements */}
          {Object.entries(nodeMap).map(([key, node]) => {
            const isActive = activeStages.includes(key);
            
            return (
              <g
                key={key}
                className="cursor-pointer group"
                onClick={() => onNodeClick && onNodeClick(key)}
              >
                {/* Glow ring on hover/active */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="23"
                  className={`transition-all duration-300 fill-transparent stroke-2 ${
                    isActive
                      ? "stroke-orange-500"
                      : "stroke-transparent group-hover:stroke-orange-200"
                  }`}
                />
                
                {/* Main Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="18"
                  className={`transition-all duration-300 ${
                    isActive
                      ? "fill-orange-500 stroke-orange-600"
                      : "fill-white stroke-orange-200 hover:fill-orange-50 hover:stroke-orange-300"
                  } stroke`}
                />

                {/* Node Label text */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className={`text-[9px] font-bold select-none transition-colors duration-300 ${
                    isActive ? "fill-white" : "fill-slate-700"
                  }`}
                >
                  {key}
                </text>

                {/* Hover Tooltip (SVG text) */}
                <text
                  x={node.x}
                  y={node.y - 25}
                  textAnchor="middle"
                  className="text-[8px] font-medium fill-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="mt-4 flex gap-4 text-[9px] text-slate-500 font-semibold select-none">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-orange-500 border border-orange-600 rounded-full"></div>
          <span>Active In Pipeline</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-white border border-orange-200 rounded-full"></div>
          <span>Inactive Stage</span>
        </div>
      </div>
    </div>
  );
}
