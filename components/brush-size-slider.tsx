"use client";

import { useDrawing } from "@/components/drawing-context";
import { Slider } from "./ui/slider";
import { motion, AnimatePresence } from "framer-motion";

interface BrushSizeSliderProps {
  isVisible: boolean;
  onClose: () => void;
  xPosition: number | null;
}

export default function BrushSizeSlider({
  isVisible,
  onClose,
  xPosition,
}: BrushSizeSliderProps) {
  const { brushSize, setBrushSize, currentTool } = useDrawing();

  const min = currentTool === "eraser" ? 10 : 1;
  const max = currentTool === "eraser" ? 50 : 20;

  return (
    <AnimatePresence>
      {isVisible && xPosition !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-2 bg-[#171717] backdrop-blur-sm rounded-xl p-4 shadow-2xl w-64"
          style={{ left: xPosition, transform: "translateX(-50%)" }}
          onMouseLeave={onClose}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">Size:</span>
            <span className="text-sm text-white font-mono">{brushSize}px</span>
          </div>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            className="[&>span:first-child]:h-2 [&>span:first-child]:bg-slate-700 [&>span:first-child]:rounded-full [&>span:first-child>span]:bg-blue-500 [&>span:first-child>span]:rounded-full [&>span:first-child>span]:w-4 [&>span:first-child>span]:h-4 [&>span:first-child>span]:-mt-1"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
