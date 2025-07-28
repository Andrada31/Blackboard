"use client";

import type React from "react";

import { FloatingDock } from "@/components/ui/floating-dock";
import { useDrawing } from "@/components/drawing-context";
import ColorPalette from "@/components/color-palette";
import { useState } from "react";
import {
  Pencil,
  Eraser,
  Paintbrush,
  Circle,
  Square,
  Triangle,
  Type,
  Palette,
  Undo,
  Redo,
  Download,
  Trash2,
} from "lucide-react";

export default function DrawingToolsDock() {
  const { currentTool, setCurrentTool, color } = useDrawing();
  const [showColorPalette, setShowColorPalette] = useState(false);

  const handleToolClick = (tool: string, e: React.MouseEvent) => {
    e.preventDefault();

    switch (tool) {
      case "pencil":
      case "brush":
      case "eraser":
      case "circle":
      case "square":
      case "triangle":
      case "text":
        setCurrentTool(tool as any);
        break;
      case "colors":
        setShowColorPalette(!showColorPalette);
        break;
      case "undo":
        (window as any).canvasActions?.undo();
        break;
      case "redo":
        (window as any).canvasActions?.redo();
        break;
      case "save":
        (window as any).canvasActions?.downloadCanvas();
        break;
      case "clear":
        (window as any).canvasActions?.clearCanvas();
        break;
    }
  };

  const drawingTools = [
    {
      title: "Pencil",
      icon: (
        <Pencil
          className={`h-full w-full ${
            currentTool === "pencil" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("pencil", e),
    },
    {
      title: "Brush",
      icon: (
        <Paintbrush
          className={`h-full w-full ${
            currentTool === "brush" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("brush", e),
    },
    {
      title: "Eraser",
      icon: (
        <Eraser
          className={`h-full w-full ${
            currentTool === "eraser" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("eraser", e),
    },
    {
      title: "Circle",
      icon: (
        <Circle
          className={`h-full w-full ${
            currentTool === "circle" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("circle", e),
    },
    {
      title: "Square",
      icon: (
        <Square
          className={`h-full w-full ${
            currentTool === "square" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("square", e),
    },
    {
      title: "Triangle",
      icon: (
        <Triangle
          className={`h-full w-full ${
            currentTool === "triangle" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("triangle", e),
    },
    {
      title: "Text",
      icon: (
        <Type
          className={`h-full w-full ${
            currentTool === "text" ? "text-blue-400" : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("text", e),
    },
    {
      title: "Colors",
      icon: (
        <div className="relative h-full w-full">
          <Palette className="h-full w-full text-neutral-300" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-400"
            style={{ backgroundColor: color }}
          />
        </div>
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("colors", e),
      onMouseEnter: () => setShowColorPalette(true),
    },
    {
      title: "Undo",
      icon: <Undo className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("undo", e),
    },
    {
      title: "Redo",
      icon: <Redo className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("redo", e),
    },
    {
      title: "Save",
      icon: <Download className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("save", e),
    },
    {
      title: "Clear",
      icon: <Trash2 className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("clear", e),
    },
  ];

  return (
    <div className="relative">
      <ColorPalette
        isVisible={showColorPalette}
        onClose={() => setShowColorPalette(false)}
      />
      <FloatingDock
        items={drawingTools}
        desktopClassName="bg-[#171717] backdrop-blur-sm"
        mobileClassName="translate-y-0"
      />
    </div>
  );
}
