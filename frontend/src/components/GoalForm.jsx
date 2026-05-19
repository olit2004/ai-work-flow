import React from "react";
import { Sparkles } from "lucide-react";

export default function GoalForm({ goal, setGoal, loading, onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (goal.trim() && !loading) {
      onSubmit();
    }
  };

  return (
    <div className="mt-12 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">
        Define Your Objective
      </h2>

      <p className="text-slate-500 mt-2">
        Enter a content goal and generate optimized AI workflows.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-4">
        <div className="flex-1 flex items-center gap-4 border border-orange-200 rounded-2xl px-5 py-5 bg-transparent">
          <Sparkles className="text-orange-500" />

          <input
            type="text"
            placeholder="Write a blog post about operating systems..."
            className="w-full outline-none text-lg bg-transparent text-slate-900 placeholder-slate-400"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          disabled={!goal.trim() || loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition text-white px-8 rounded-2xl font-semibold shadow-lg cursor-pointer"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
    </div>
  );
}
