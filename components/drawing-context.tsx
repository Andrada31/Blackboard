"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DrawingTool =
  | "pencil"
  | "brush"
  | "eraser"
  | "circle"
  | "square"
  | "triangle"
  | "text";

interface DrawingContextType {
  currentTool: DrawingTool;
  setCurrentTool: (tool: DrawingTool) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  color: string;
  setColor: (color: string) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export function DrawingProvider({ children }: { children: ReactNode }) {
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pencil");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState("#ffffff");
  const [isDrawing, setIsDrawing] = useState(false);

  return (
    <DrawingContext.Provider
      value={{
        currentTool,
        setCurrentTool,
        brushSize,
        setBrushSize,
        color,
        setColor,
        isDrawing,
        setIsDrawing,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
}

export function useDrawing() {
  const context = useContext(DrawingContext);
  if (context === undefined) {
    throw new Error("useDrawing must be used within a DrawingProvider");
  }
  return context;
}
