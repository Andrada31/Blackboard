"use client";

import { useDrawing } from "@/components/drawing-context";
import { motion, AnimatePresence } from "framer-motion";

interface ColorPaletteProps {
  isVisible: boolean;
  onClose: () => void;
  xPosition: number | null;
}

export default function ColorPalette({
  isVisible,
  onClose,
  xPosition,
}: ColorPaletteProps) {
  const { color, setColor } = useDrawing();

  const colors = [
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Lime", value: "#84cc16" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Gray", value: "#6b7280" },
    { name: "Brown", value: "#a3a3a3" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Rose", value: "#f43f5e" },
  ];

  const handleColorSelect = (colorValue: string) => {
    setColor(colorValue);
  };

  return (
    <AnimatePresence>
      {isVisible && xPosition !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-2 bg-[#171717] backdrop-blur-sm rounded-xl p-4 shadow-2xl"
          style={{ left: xPosition, transform: "translateX(-50%)" }}
          onMouseLeave={onClose}
        >
          <div className="grid grid-cols-4 gap-3">
            {colors.map((colorOption) => (
              <motion.button
                key={colorOption.value}
                onClick={() => handleColorSelect(colorOption.value)}
                className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                  color === colorOption.value
                    ? "ring-2 ring-white shadow-lg shadow-white/30"
                    : "hover:ring-1 hover:ring-slate-300"
                }`}
                style={{ backgroundColor: colorOption.value }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={colorOption.name}
              >
                {color === colorOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-full h-full rounded-full ring-2 ring-white/50"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Current color indicator */}
          <div className="mt-4 pt-3 border-t border-slate-600">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-300">Current:</span>
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-300 font-mono">{color}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
