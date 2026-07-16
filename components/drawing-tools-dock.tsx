"use client";

import type React from "react";

import { FloatingDock } from "@/components/ui/floating-dock";
import { useDrawing } from "@/components/drawing-context";
import ColorPalette from "@/components/color-palette";
import BrushSizeSlider from "@/components/brush-size-slider";
import TextOptionsPanel from "@/components/text-options-panel";
import { useState, useRef } from "react";
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
  PaintBucket,
  Hand,
} from "lucide-react";

export default function DrawingToolsDock() {
  const { currentTool, setCurrentTool, color, setSelectedLayerId } =
    useDrawing();
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showBrushSizeSlider, setShowBrushSizeSlider] = useState(false);
  const [showTextOptions, setShowTextOptions] = useState(false);

  const [colorPaletteX, setColorPaletteX] = useState<number | null>(null);
  const [brushSizeSliderX, setBrushSizeSliderX] = useState<number | null>(null);
  const [textOptionsX, setTextOptionsX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: string, e: React.MouseEvent) => {
    e.preventDefault();

    // Close all panels first
    setShowColorPalette(false);
    setShowBrushSizeSlider(false);
    setShowTextOptions(false);

    // Deselect any layer when a new tool is picked, unless it's the select tool
    if (tool !== "select") {
      setSelectedLayerId(null);
    }

    switch (tool) {
      case "colors":
        setShowColorPalette(true);
        break;
      case "pencil":
      case "brush":
      case "eraser":
        setCurrentTool(tool as any);
        setShowBrushSizeSlider(true);
        break;
      case "text":
        setCurrentTool(tool as any);
        setShowTextOptions(true);
        break;
      case "circle":
      case "square":
      case "triangle":
      case "fill":
      case "select": // New select tool
        setCurrentTool(tool as any);
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

  const handleMouseEnter = (
    toolType: "colors" | "brushSize" | "textOptions" | "none",
    index: number,
    e?: React.MouseEvent<HTMLDivElement>
  ) => {
    let centerX = 0;

    if (e && e.currentTarget && dockRef.current) {
      const iconRect = e.currentTarget.getBoundingClientRect();
      const dockRect = dockRef.current.getBoundingClientRect();
      centerX = iconRect.x - dockRect.x + iconRect.width / 2;
    } else {
      // Calculate position based on dock item index
      // Using more accurate dimensions based on the FloatingDock component
      const itemWidth = 40; // Base width from FloatingDock
      const gap = 16; // Gap between items
      const expandedWidth = 80; // Width when hovered (from FloatingDock transforms)

      // Calculate the total dock width
      const totalDockWidth =
        drawingTools.length * itemWidth + (drawingTools.length - 1) * gap;

      // Get the dock's starting position (center of screen minus half dock width)
      const dockStartX = (window.innerWidth - totalDockWidth) / 2;

      // Calculate the center X position for this specific tool
      centerX = dockStartX + index * (itemWidth + gap) + itemWidth / 2;
    }

    // Close all panels
    setShowColorPalette(false);
    setShowBrushSizeSlider(false);
    setShowTextOptions(false);

    // Set position for the hovered panel
    if (toolType === "colors") {
      setColorPaletteX(centerX);
      setShowColorPalette(true);
    } else if (toolType === "brushSize") {
      setBrushSizeSliderX(centerX);
      setShowBrushSizeSlider(true);
    } else if (toolType === "textOptions") {
      setTextOptionsX(centerX);
      setShowTextOptions(true);
    }
  };

  const handleMouseLeaveDock = () => {
    // This will be called when leaving the entire dock,
    // but individual panel's onMouseLeave will handle their closing
    // if the mouse moves directly from the icon to the panel.
    // We can keep panels open if the mouse is over them.
  };

  const drawingTools = [
    {
      title: "Colors",
      icon: (
        <div className="relative h-full w-full">
          <Palette className="h-full w-full text-neutral-300" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("colors", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("colors", 0, e),
    },
    {
      title: "Select",
      icon: (
        <Hand
          className={`h-full w-full ${
            currentTool === ("select" as typeof currentTool)
              ? "text-blue-400"
              : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("select", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("none", 1, e),
    },
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 2, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 3, e),
    },
    {
      title: "Fill",
      icon: (
        <PaintBucket
          className={`h-full w-full ${
            currentTool === ("fill" as typeof currentTool)
              ? "text-blue-400"
              : "text-neutral-300"
          }`}
        />
      ),
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("fill", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("colors", 4, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 5, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 6, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 7, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("brushSize", 8, e),
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
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("textOptions", 9, e),
    },
    {
      title: "Undo",
      icon: <Undo className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("undo", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("none", 10, e),
    },
    {
      title: "Redo",
      icon: <Redo className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("redo", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("none", 11, e),
    },
    {
      title: "Save",
      icon: <Download className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("save", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("none", 12, e),
    },
    {
      title: "Clear",
      icon: <Trash2 className="h-full w-full text-neutral-300" />,
      href: "#",
      onClick: (e: React.MouseEvent) => handleToolClick("clear", e),
      onMouseEnter: (e?: React.MouseEvent<HTMLDivElement>) => handleMouseEnter("none", 13, e),
    },
  ];

  return (
    <div className="relative" onMouseLeave={handleMouseLeaveDock} ref={dockRef}>
      <ColorPalette
        isVisible={showColorPalette}
        onClose={() => setShowColorPalette(false)}
        xPosition={colorPaletteX}
      />
      <BrushSizeSlider
        isVisible={showBrushSizeSlider}
        onClose={() => setShowBrushSizeSlider(false)}
        xPosition={brushSizeSliderX}
      />
      <TextOptionsPanel
        isVisible={showTextOptions}
        onClose={() => setShowTextOptions(false)}
        xPosition={textOptionsX}
      />
      <FloatingDock
        items={drawingTools}
        desktopClassName=""
        mobileClassName="translate-y-0"
      />
    </div>
  );
}
