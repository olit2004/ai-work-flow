import React from "react";

export default function ConstraintPanel({
  quality,
  setQuality,
  speed,
  setSpeed,
  cost,
  setCost,
}) {
  return (
    <div className="mt-10 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">
        Workflow Constraints
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
        <SliderBlock
          title="Quality"
          value={`${Math.round((quality / 5) * 100)}%`}
          description="Prioritize refinement and depth"
          sliderValue={quality}
          onChange={setQuality}
        />

        <SliderBlock
          title="Speed"
          value={`${Math.round((speed / 5) * 100)}%`}
          description="Optimize faster execution"
          sliderValue={speed}
          onChange={setSpeed}
        />

        <SliderBlock
          title="Cost"
          value={`${Math.round((cost / 5) * 100)}%`}
          description="Reduce API and token usage"
          sliderValue={cost}
          onChange={setCost}
        />
      </div>
    </div>
  );
}

function SliderBlock({
  title,
  value,
  description,
  sliderValue,
  onChange,
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-slate-900">
          {title}
        </h3>

        <span className="text-orange-600 font-semibold">
          {value}
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="5"
        value={sliderValue}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full mt-4 accent-orange-500 cursor-pointer"
      />

      <p className="text-sm text-slate-500 mt-3">
        {description}
      </p>
    </div>
  );
}
