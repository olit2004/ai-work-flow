import React, { useState, useMemo } from "react";
import { Plus, Trash2, Link, Link2Off, HelpCircle, ToggleLeft, ToggleRight, Check, AlertTriangle } from "lucide-react";

export default function HasseDiagram({
  customPoset,
  onUpdatePoset,
  quantale,
  activeStages = [],
  onNodeClick,
  editMode = false,
  proofMode = "none", // "none" | "distributivity" | "adjunction"
  proofNodes = { a: "", b: "", c: "" }
}) {
  const { nodes, edges } = customPoset;

  // Selected node for edge creation in edit mode
  const [selectedSrc, setSelectedSrc] = useState(null);
  const [newNodeName, setNewNodeName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState("");

  // 1. Dynamic Coordinate Layout Engine (Bellman-Ford layering for DAG Hasse diagrams)
  const nodeMap = useMemo(() => {
    if (nodes.length === 0) return {};

    // Determine incoming relations to compute ranks
    const nodeRank = {};
    for (const n of nodes) {
      nodeRank[n] = 0;
    }

    // Bellman-Ford style longest path rank-layering
    // Run N iterations to find longest chain height for each node
    for (let iter = 0; iter < nodes.length; iter++) {
      for (const [u, v] of edges) {
        if (nodeRank[u] !== undefined && nodeRank[v] !== undefined) {
          if (nodeRank[u] + 1 > nodeRank[v]) {
            nodeRank[v] = nodeRank[u] + 1;
          }
        }
      }
    }

    // Group nodes by rank
    const ranks = {};
    for (const n of nodes) {
      const r = nodeRank[n];
      if (!ranks[r]) ranks[r] = [];
      ranks[r].push(n);
    }

    const positions = {};
    const maxRank = Math.max(...Object.values(nodeRank), 0);
    
    const svgWidth = 240;
    const svgHeight = 430;
    const paddingY = 45;
    const paddingX = 35;

    for (const rStr in ranks) {
      const r = parseInt(rStr);
      const levelNodes = ranks[r].sort(); // Sort to preserve deterministic ordering
      
      // Compute Y: bottom rank at the bottom of SVG, top rank at the top
      const y = maxRank > 0 
        ? svgHeight - paddingY - (r * (svgHeight - paddingY * 2) / maxRank)
        : svgHeight / 2;

      const levelCount = levelNodes.length;
      for (let idx = 0; idx < levelCount; idx++) {
        const node = levelNodes[idx];
        // Compute X: symmetrically spread across SVG width
        let x = svgWidth / 2;
        if (levelCount > 1) {
          x = paddingX + (idx * (svgWidth - paddingX * 2) / (levelCount - 1));
        }
        positions[node] = { x, y, label: node };
      }
    }

    return positions;
  }, [nodes, edges]);

  // 2. Direct Cover Edges (Compute Hasse edges dynamically from poset)
  const hasseCoverEdges = useMemo(() => {
    if (!quantale) return [];
    try {
      return quantale.hasseEdges();
    } catch (e) {
      // Fallback if relation checks fail during edits
      return edges;
    }
  }, [quantale, edges]);

  // 3. Mathematical Overlays for Proofs
  const proofOverlays = useMemo(() => {
    if (!quantale || proofMode === "none") return null;

    const { a, b, c } = proofNodes;
    
    if (proofMode === "distributivity") {
      if (!a || !b || !c) return null;
      try {
        const join_bc = quantale.join(b, c);
        const lhs = quantale.mul(a, join_bc); // a ⊗ (b \/ c)
        
        const ab = quantale.mul(a, b);
        const ac = quantale.mul(a, c);
        const rhs = quantale.join(ab, ac); // (a ⊗ b) \/ (a ⊗ c)
        
        return {
          type: "distributivity",
          inputs: { a, b, c },
          join_bc,
          ab,
          ac,
          lhs,
          rhs,
          verified: lhs === rhs
        };
      } catch (err) {
        return null;
      }
    }

    if (proofMode === "adjunction") {
      if (!a || !c) return null;
      try {
        const residual = quantale.rightResidual(a, c); // a -> c
        
        // Find all b such that a ⊗ b <= c
        const safeSubsteps = nodes.filter(b => {
          const ab = quantale.mul(a, b);
          return quantale.le(ab, c);
        });

        return {
          type: "adjunction",
          inputs: { a, c },
          residual,
          safeSubsteps
        };
      } catch (err) {
        return null;
      }
    }

    return null;
  }, [quantale, proofMode, proofNodes, nodes]);

  // Handlers for edit actions
  const handleNodeClickInternal = (node) => {
    if (editMode) {
      if (selectedSrc === null) {
        setSelectedSrc(node);
      } else {
        if (selectedSrc !== node) {
          // Check if edge already exists
          const edgeExists = edges.some(([u, v]) => u === selectedSrc && v === node);
          if (!edgeExists) {
            onUpdatePoset({
              ...customPoset,
              edges: [...edges, [selectedSrc, node]]
            });
          }
        }
        setSelectedSrc(null);
      }
    } else {
      if (onNodeClick) onNodeClick(node);
    }
  };

  const handleAddNode = () => {
    const name = newNodeName.trim().toLowerCase();
    setAddError("");
    if (!name) return;
    if (nodes.includes(name)) {
      setAddError("Stage name already exists.");
      return;
    }
    onUpdatePoset({
      ...customPoset,
      nodes: [...nodes, name]
    });
    setNewNodeName("");
    setShowAddModal(false);
  };

  const handleDeleteNode = (nodeToDelete) => {
    const updatedNodes = nodes.filter(n => n !== nodeToDelete);
    const updatedEdges = edges.filter(([u, v]) => u !== nodeToDelete && v !== nodeToDelete);
    onUpdatePoset({
      nodes: updatedNodes,
      edges: updatedEdges
    });
    if (selectedSrc === nodeToDelete) setSelectedSrc(null);
  };

  const handleDeleteEdge = (src, dest) => {
    const updatedEdges = edges.filter(([u, v]) => !(u === src && v === dest));
    onUpdatePoset({
      ...customPoset,
      edges: updatedEdges
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm h-full w-full relative">
      
      {/* Edit controls overlay */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Quantale Hasse Diagram
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {editMode ? "Graph Editor: Add/delete nodes and draw edges." : "Lattice representation of refinement degrees."}
          </p>
        </div>

        {editMode && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 transition text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Stage</span>
          </button>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[245px] aspect-[2/3.5] border border-slate-50 rounded-2xl bg-slate-50/20 p-2">
        <svg
          className="w-full h-full"
          viewBox="0 0 240 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arrow markers */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
            </marker>
          </defs>

          {/* Draw connecting edges */}
          {hasseCoverEdges.map(([u, v], idx) => {
            const fromNode = nodeMap[u];
            const toNode = nodeMap[v];
            if (!fromNode || !toNode) return null;

            const isFromActive = activeStages.includes(u);
            const isToActive = activeStages.includes(v);
            const isEdgeActive = isFromActive && isToActive;

            // Compute line offset slightly shortened from circle boundaries
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const offset = 21;
            const x1 = fromNode.x + offset * Math.cos(angle);
            const y1 = fromNode.y + offset * Math.sin(angle);
            const x2 = toNode.x - offset * Math.cos(angle);
            const y2 = toNode.y - offset * Math.sin(angle);

            // Compute edge deletion trigger coordinate
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`edge-${idx}`} className="group/edge">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isEdgeActive ? "#f97316" : "#cbd5e1"}
                  strokeWidth={isEdgeActive ? 3 : 1.5}
                  markerEnd={isEdgeActive ? "url(#arrow-active)" : "url(#arrow)"}
                  className="transition-all duration-300"
                />

                {/* Edge Delete Trigger */}
                {editMode && (
                  <g 
                    className="cursor-pointer opacity-0 group-hover/edge:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEdge(u, v);
                    }}
                  >
                    <circle cx={midX} cy={midY} r="7" className="fill-red-500 hover:fill-red-600 stroke-none" />
                    <line x1={midX - 3} y1={midY} x2={midX + 3} y2={midY} stroke="white" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw node coordinates */}
          {Object.entries(nodeMap).map(([key, node]) => {
            const isActive = activeStages.includes(key);
            const isSrcNode = selectedSrc === key;

            // Highlight state depending on proof modes
            let nodeRingColor = "stroke-transparent";
            let nodeFillColor = isActive ? "fill-orange-500 stroke-orange-600" : "fill-white stroke-slate-200 hover:fill-orange-50/50";
            let textColor = isActive ? "fill-white" : "fill-slate-700";

            if (isSrcNode) {
              nodeRingColor = "stroke-orange-500 animate-pulse stroke-2";
            }

            // Distributivity proof formatting
            if (proofOverlays && proofOverlays.type === "distributivity") {
              const { a, b, c, lhs, join_bc, ab, ac } = proofOverlays;
              
              if (key === a) {
                nodeRingColor = "stroke-indigo-500 stroke-2";
                nodeFillColor = "fill-indigo-50 stroke-indigo-400";
                textColor = "fill-indigo-900";
              } else if (key === b || key === c) {
                nodeRingColor = "stroke-sky-500 stroke-2";
                nodeFillColor = "fill-sky-50 stroke-sky-400";
                textColor = "fill-sky-900";
              } else if (key === join_bc) {
                nodeRingColor = "stroke-emerald-400 stroke-2";
              } else if (key === lhs) {
                // Since LHS = RHS, we highlight this node as the final target
                nodeRingColor = "stroke-amber-500 stroke-2 scale-110";
                nodeFillColor = "fill-amber-500 stroke-amber-600";
                textColor = "fill-white font-bold";
              }
            }

            // Galois residual Adjunction formatting
            if (proofOverlays && proofOverlays.type === "adjunction") {
              const { a, c, residual, safeSubsteps } = proofOverlays;

              if (key === a) {
                // Manager/Operator node
                nodeRingColor = "stroke-indigo-500 stroke-2";
                nodeFillColor = "fill-indigo-50 stroke-indigo-400";
                textColor = "fill-indigo-900";
              } else if (key === c) {
                // Ceiling/Target limit
                nodeRingColor = "stroke-red-500 stroke-2";
                nodeFillColor = "fill-red-50 stroke-red-400";
                textColor = "fill-red-900";
              } else if (key === residual) {
                // Max safe residual boundary node
                nodeRingColor = "stroke-amber-500 stroke-[3px] animate-pulse";
                nodeFillColor = "fill-amber-100 stroke-amber-500";
                textColor = "fill-amber-950 font-bold";
              } else if (safeSubsteps.includes(key)) {
                // Feasible sub-agent step (green highlight)
                nodeFillColor = "fill-emerald-50 stroke-emerald-400";
                textColor = "fill-emerald-900";
              } else {
                // Unfeasible sub-agent step (red warning color)
                nodeFillColor = "fill-red-50/20 stroke-red-200";
                textColor = "fill-slate-300";
              }
            }

            return (
              <g
                key={`node-${key}`}
                className="cursor-pointer group/node"
                onClick={() => handleNodeClickInternal(key)}
              >
                {/* Glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="21"
                  className={`transition-all duration-300 fill-transparent ${nodeRingColor}`}
                />

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="16"
                  className={`transition-all duration-300 stroke ${nodeFillColor}`}
                />

                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y + 3.5}
                  textAnchor="middle"
                  className={`text-[8.5px] font-semibold select-none transition-colors duration-300 ${textColor}`}
                >
                  {key}
                </text>

                {/* Node delete trigger on hover (only in Edit Mode) */}
                {editMode && (
                  <g 
                    className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(key);
                    }}
                  >
                    <circle cx={node.x + 13} cy={node.y - 13} r="7" className="fill-red-500 hover:fill-red-600 stroke-none" />
                    <line x1={node.x + 10} y1={node.y - 13} x2={node.x + 16} y2={node.y - 13} stroke="white" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Editor instructions / proof legend */}
      <div className="mt-4 w-full text-center">
        {editMode ? (
          <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
            {selectedSrc ? (
              <p className="font-semibold text-orange-600 animate-pulse">
                Click another stage to add edge: {selectedSrc} → ?
              </p>
            ) : (
              <p className="leading-relaxed">
                Click a stage, then click a higher stage to add order link.<br />
                Hover and click red "-" trigger to delete.
              </p>
            )}
          </div>
        ) : proofMode === "distributivity" ? (
          <div className="text-[10px] text-indigo-900 bg-indigo-50/70 border border-indigo-100/50 rounded-xl p-2.5 text-left leading-relaxed">
            <span className="font-bold text-indigo-700 block mb-1">Distributivity Proof Legend:</span>
            * <strong className="text-indigo-600 font-semibold">Indigo Ring:</strong> Operator ($a$)<br />
            * <strong className="text-sky-600 font-semibold">Sky Blue Rings:</strong> Join terms ($b$, $c$)<br />
            * <strong className="text-amber-600 font-bold">Gold Node:</strong> Distributive Convergence ($LHS = RHS$)
          </div>
        ) : proofMode === "adjunction" ? (
          <div className="text-[10px] text-emerald-950 bg-emerald-50/70 border border-emerald-100/50 rounded-xl p-2.5 text-left leading-relaxed">
            <span className="font-bold text-emerald-800 block mb-1">Galois Adjunction Legend:</span>
            * <strong className="text-indigo-600 font-semibold">Indigo:</strong> Manager ($a$)<br />
            * <strong className="text-red-600 font-semibold">Red:</strong> Ceiling ($c$)<br />
            * <strong className="text-amber-600 font-bold">Gold:</strong> Right Residual boundary ($a \to c$)<br />
            * <strong className="text-emerald-700 font-semibold">Green Nodes:</strong> Safe delegation steps ($b \le a \to c$)
          </div>
        ) : (
          <div className="flex gap-4 justify-center text-[9px] text-slate-400 font-semibold select-none">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Active in Workflow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white border border-slate-200 rounded-full"></div>
              <span>Inactive Stage</span>
            </div>
          </div>
        )}
      </div>

      {/* Add node modal overlay */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-3xl flex items-center justify-center p-4 z-40">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xl w-full max-w-[200px]">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">New Stage</h4>
            <input
              type="text"
              placeholder="e.g. reviewed"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs px-2 py-1.5 rounded-lg outline-none text-slate-700 mb-2"
              onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
            />
            {addError && <p className="text-[9px] text-red-500 mb-2 font-medium">{addError}</p>}
            <div className="flex justify-end gap-1.5 text-[10px]">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewNodeName("");
                  setAddError("");
                }}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNode}
                className="px-2.5 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
