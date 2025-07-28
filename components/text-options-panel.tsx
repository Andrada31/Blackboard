"use client";

import { useDrawing } from "@/components/drawing-context";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface TextOptionsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  xPosition: number | null;
}

export default function TextOptionsPanel({
  isVisible,
  onClose,
  xPosition,
}: TextOptionsPanelProps) {
  const { fontFamily, setFontFamily, fontSize, setFontSize } = useDrawing();

  const fontFamilies = [
    "Arial",
    "Verdana",
    "Helvetica",
    "Tahoma",
    "Trebuchet MS",
    "Times New Roman",
    "Georgia",
    "Garamond",
    "Courier New",
    "Brush Script MT",
    "Impact",
  ];

  return (
    <AnimatePresence>
      {isVisible && xPosition !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-2 bg-[#171717] backdrop-blur-sm rounded-xl p-4 shadow-2xl w-72"
          style={{ left: xPosition, transform: "translateX(-50%)" }}
          onMouseLeave={onClose}
        >
          <div className="mb-4">
            <span className="text-sm text-slate-300 block mb-2">
              Font Family:
            </span>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="w-full bg-[#262626] text-white border-none focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent className="bg-[#262626] text-white border-none">
                {fontFamilies.map((font) => (
                  <SelectItem
                    key={font}
                    value={font}
                    className="focus:bg-[#333333]"
                  >
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300">Font Size:</span>
              <span className="text-sm text-white font-mono">{fontSize}px</span>
            </div>
            <Slider
              min={10}
              max={72}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="[&>span:first-child]:h-2 [&>span:first-child]:bg-slate-700 [&>span:first-child]:rounded-full [&>span:first-child>span]:bg-blue-500 [&>span:first-child>span]:rounded-full [&>span:first-child>span]:w-4 [&>span:first-child>span]:h-4 [&>span:first-child>span]:-mt-1"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
