"use client";

import DrawingCanvas from "@/components/drawing-canvas";
import DrawingToolsDock from "@/components/drawing-tools-dock";
import LayersPanel from "@/components/layers-panel";
import { DrawingProvider } from "@/components/drawing-context";

export default function Home() {
  return (
    <DrawingProvider>
      <main className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black relative overflow-hidden">
        {/* Blackboard texture overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>

        {/* Chalk dust effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-30"></div>

        {/* Layers panel positioned at left side - full height */}
        <div className="fixed top-0 left-0 z-20 w-64 h-screen bg-[#1a1a1a]/95 backdrop-blur-sm border-r border-slate-700 p-4 shadow-xl">
          <LayersPanel />
        </div>

        {/* Full screen drawing canvas with left margin for layers panel */}
        <div className="relative z-10 w-full h-screen pl-64">
          <DrawingCanvas />
        </div>

        {/* Floating dock positioned at bottom */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <DrawingToolsDock />
        </div>
      </main>
    </DrawingProvider>
  );
}
