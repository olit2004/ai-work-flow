import React from "react";

export default function ResultViewer({ finalResult }) {
  return (
    <div className="mt-12 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm text-slate-900">
      <h2 className="text-2xl font-semibold text-slate-900">
        Generated Result
      </h2>

      <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-6 leading-8 text-slate-700">
        {finalResult ? (
          <p>{finalResult}</p>
        ) : (
          <p className="text-slate-400">
            Execute a workflow to see the generated result here...
          </p>
        )}
      </div>
    </div>
  );
}
