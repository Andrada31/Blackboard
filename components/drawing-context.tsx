"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export type DrawingTool =
  | "pencil"
  | "brush"
  | "eraser"
  | "circle"
  | "square"
  | "triangle"
  | "text"
  | "fill"
  | "select";

export type LayerType = "drawing" | "text" | "shape";

export interface Layer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number; // For explicit ordering
  visible: boolean;
  opacity: number;
  data: any; // Specific data for each layer type
  // For drawing layers: data: {} (content managed by offscreen canvas)
  // For text layers: data: { text: string, fontFamily: string, fontSize: number, color: string }
  // For shape layers: data: { shapeType: "circle" | "square" | "triangle", color: string, brushSize: number }
}

interface DrawingContextType {
  currentTool: DrawingTool;
  setCurrentTool: (tool: DrawingTool) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  color: string;
  setColor: (color: string) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  shapeSize: number;
  setShapeSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  layers: Layer[];
  setLayers: (layers: Layer[]) => void; // For direct reordering
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  activeDrawingLayerId: string | null; // For pencil/brush/eraser
  setActiveDrawingLayerId: (id: string | null) => void;
  addLayer: (
    layer: Omit<Layer, "id" | "zIndex" | "visible" | "opacity">
  ) => string; // Returns new ID
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export function DrawingProvider({ children }: { children: ReactNode }) {
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pencil");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState("#ffffff");
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapeSize, setShapeSize] = useState(50);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(24);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeDrawingLayerId, setActiveDrawingLayerId] = useState<
    string | null
  >(null);

  const addLayer = (
    newLayer: Omit<Layer, "id" | "zIndex" | "visible" | "opacity">
  ) => {
    const id = uuidv4();
    const layerToAdd: Layer = {
      ...newLayer,
      id,
      zIndex: layers.length, // New layers go on top by default
      visible: true,
      opacity: 1,
    };
    setLayers((prevLayers) => [...prevLayers, layerToAdd]);
    return id;
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  };

  const deleteLayer = (id: string) => {
    setLayers((prevLayers) => prevLayers.filter((layer) => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
    if (activeDrawingLayerId === id) {
      setActiveDrawingLayerId(null);
    }
  };

  const reorderLayers = (startIndex: number, endIndex: number) => {
    const result = Array.from(layers);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Reassign zIndex based on new array order
    const reindexedResult = result.map((layer, index) => ({
      ...layer,
      zIndex: index,
    }));
    setLayers(reindexedResult);
  };

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
        shapeSize,
        setShapeSize,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        layers,
        setLayers,
        selectedLayerId,
        setSelectedLayerId,
        activeDrawingLayerId,
        setActiveDrawingLayerId,
        addLayer,
        updateLayer,
        deleteLayer,
        reorderLayers,
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
