"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useDrawing } from "@/components/drawing-context";
import {
  Eye,
  EyeOff,
  Trash2,
  Text,
  Circle,
  Square,
  Triangle,
  Pencil,
} from "lucide-react";

export default function LayersPanel() {
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    deleteLayer,
    reorderLayers,
  } = useDrawing();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Text className="h-4 w-4" />;
      case "circle":
        return <Circle className="h-4 w-4" />;
      case "square":
        return <Square className="h-4 w-4" />;
      case "triangle":
        return <Triangle className="h-4 w-4" />;
      case "drawing":
        return <Pencil className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetId || !draggingId) return;

    const draggedIndex = layers.findIndex((layer) => layer.id === draggedId);
    const targetIndex = layers.findIndex((layer) => layer.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      reorderLayers(draggedIndex, targetIndex);
    }
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const toggleVisibility = (id: string, currentVisibility: boolean) => {
    updateLayer(id, { visible: !currentVisibility });
  };

  const handleDelete = (id: string) => {
    deleteLayer(id);
  };

  // Sort layers by zIndex for display
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-white">Layers</h2>
      <div className="flex-grow overflow-y-auto pr-2">
        {sortedLayers.length === 0 && (
          <p className="text-neutral-400 text-sm">
            No layers yet. Draw something!
          </p>
        )}
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            draggable={layer.type !== "drawing"} // Allow dragging all except the base drawing layer for now
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
            onDragEnd={handleDragEnd}
            onClick={() =>
              setSelectedLayerId(layer.id === selectedLayerId ? null : layer.id)
            }
            className={`
              flex items-center justify-between p-2 mb-2 rounded-md cursor-pointer transition-colors duration-200
              ${
                selectedLayerId === layer.id
                  ? "bg-white text-black"
                  : "bg-[#262626] hover:bg-[#333333] text-white"
              }
              ${
                draggingId === layer.id
                  ? "opacity-50 border border-dashed border-white"
                  : ""
              }
              ${!layer.visible ? "opacity-50" : ""}
            `}
          >
            <div className="flex items-center gap-2 flex-grow">
              {getLayerIcon(layer.type)}
              <span
                className={`text-sm truncate ${
                  selectedLayerId === layer.id ? "text-black" : "text-white"
                }`}
              >
                {layer.type === "text" && layer.data.text
                  ? layer.data.text
                  : `Layer ${layer.zIndex + 1} (${layer.type})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(layer.id, layer.visible);
                }}
                className={`p-1 rounded-full hover:bg-neutral-700 ${
                  selectedLayerId === layer.id
                    ? "text-black"
                    : "text-neutral-300"
                }`}
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
              {layer.type !== "drawing" && ( // Prevent deleting the base drawing layer for now
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(layer.id);
                  }}
                  className={`p-1 rounded-full hover:bg-red-700 ${
                    selectedLayerId === layer.id
                      ? "text-black"
                      : "text-neutral-300"
                  }`}
                  title="Delete layer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
