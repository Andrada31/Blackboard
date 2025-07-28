"use client";

import type React from "react";

import { useDrawing } from "@/components/drawing-context";
import { useEffect, useRef, useState } from "react";

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTool, brushSize, color, isDrawing, setIsDrawing } =
    useDrawing();
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial canvas background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const point = getMousePos(e);
    setLastPoint(point);

    if (currentTool === "pencil" || currentTool === "brush") {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getMousePos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (currentTool) {
      case "pencil":
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        break;

      case "brush":
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 2;
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        break;

      case "eraser":
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = brushSize * 3;
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        break;
    }

    setLastPoint(currentPoint);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(false);
    setLastPoint(null);

    // Handle shape drawing
    if (["circle", "square", "triangle"].includes(currentTool) && lastPoint) {
      const currentPoint = lastPoint;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = "source-over";

      switch (currentTool) {
        case "circle":
          const radius = 50;
          ctx.beginPath();
          ctx.arc(currentPoint.x, currentPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case "square":
          const size = 100;
          ctx.beginPath();
          ctx.rect(
            currentPoint.x - size / 2,
            currentPoint.y - size / 2,
            size,
            size
          );
          ctx.stroke();
          break;

        case "triangle":
          const height = 80;
          ctx.beginPath();
          ctx.moveTo(currentPoint.x, currentPoint.y - height / 2);
          ctx.lineTo(currentPoint.x - height / 2, currentPoint.y + height / 2);
          ctx.lineTo(currentPoint.x + height / 2, currentPoint.y + height / 2);
          ctx.closePath();
          ctx.stroke();
          break;
      }
    }

    saveState();
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setHistoryStep(historyStep - 1);
      const imageData = history[historyStep - 1];
      ctx.putImageData(imageData, 0, 0);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setHistoryStep(historyStep + 1);
      const imageData = history[historyStep + 1];
      ctx.putImageData(imageData, 0, 0);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "blackboard-drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Expose functions to parent components
  useEffect(() => {
    (window as any).canvasActions = {
      undo,
      redo,
      clearCanvas,
      downloadCanvas,
    };
  }, [historyStep, history]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair bg-slate-800"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{
        cursor:
          currentTool === "eraser"
            ? "grab"
            : ["circle", "square", "triangle"].includes(currentTool)
            ? "copy"
            : "crosshair",
      }}
    />
  );
}
