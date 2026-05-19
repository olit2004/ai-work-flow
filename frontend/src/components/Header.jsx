import React from "react";

export default function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-5xl font-bold text-orange-500">
          QuantFlow
        </h1>

        <p className="text-slate-600 mt-3 text-lg">
          AI Content Pipeline Planner powered by quantale reasoning.
        </p>
      </div>

      <div className="bg-white border border-orange-200 px-5 py-3 rounded-2xl shadow-sm">
        <p className="text-sm text-slate-500">
          Quantale Engine
        </p>

        <p className="font-semibold text-orange-600">
          Active
        </p>
      </div>
    </div>
  );
}
