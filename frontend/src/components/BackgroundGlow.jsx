import React from "react";

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-slate-50">
      {/* Ambient glassmorphic glowing orbs */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-200/40 blur-[120px] animate-pulse" 
        style={{ animationDuration: '8s' }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-200/30 blur-[150px] animate-pulse" 
        style={{ animationDuration: '12s' }}
      ></div>
      <div 
        className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-orange-150/20 blur-[100px] animate-pulse" 
        style={{ animationDuration: '10s' }}
      ></div>
      <div 
        className="absolute bottom-[20%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-rose-100/30 blur-[110px] animate-pulse" 
        style={{ animationDuration: '9s' }}
      ></div>

      {/* Grid overlay representing a coordinate plane for graph theory */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f9731608_1px,transparent_1px),linear-gradient(to_bottom,#f9731608_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
