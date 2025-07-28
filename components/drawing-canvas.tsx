"use client";

import type React from "react";
import { useDrawing } from "@/components/drawing-context";
import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    currentTool,
    brushSize,
    color,
    fontFamily,
    fontSize,
    isDrawing,
    setIsDrawing,
    shapeSize,
    setFontSize,
    layers,
    setLayers,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    addLayer,
    activeDrawingLayerId,
    setActiveDrawingLayerId,
  } = useDrawing();

  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [smoothPoints, setSmoothPoints] = useState<{ x: number; y: number }[]>(
    []
  );
  const [showPreview, setShowPreview] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState("");

  const [isMovingLayer, setIsMovingLayer] = useState(false);
  const [isResizingLayer, setIsResizingLayer] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [initialLayerRect, setInitialLayerRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    initialFontSize?: number;
  } | null>(null);

  // Offscreen canvas for the base drawing layer
  const offscreenDrawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setHistoryStep(historyStep - 1);
      const imageData = history[historyStep - 1];
      ctx.putImageData(imageData, 0, 0);
      // Note: This undo/redo currently only affects the base drawing layer.
      // A full layer system would require managing history for each layer's state.
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
      // Note: This undo/redo currently only affects the base drawing layer.
    }
  };

  const clearCanvas = () => {
    const canvas = offscreenDrawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Clear all non-drawing layers
    setLayers(layers.filter((layer) => layer.type === "drawing"));
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const ctx = canvas.getContext("2d");
    const previewCtx = previewCanvas.getContext("2d");
    if (!ctx || !previewCtx) return;

    // Set canvas sizes
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    previewCanvas.width = canvas.offsetWidth;
    previewCanvas.height = canvas.offsetHeight;

    // Initialize offscreen canvas for drawing layer
    if (!offscreenDrawingCanvasRef.current) {
      offscreenDrawingCanvasRef.current = document.createElement("canvas");
      offscreenDrawingCanvasRef.current.width = canvas.width;
      offscreenDrawingCanvasRef.current.height = canvas.height;
      const offscreenCtx = offscreenDrawingCanvasRef.current.getContext("2d");
      if (offscreenCtx) {
        offscreenCtx.fillStyle = "#000000";
        offscreenCtx.fillRect(
          0,
          0,
          offscreenDrawingCanvasRef.current.width,
          offscreenDrawingCanvasRef.current.height
        );
      }
    }

    // Set initial canvas background to black
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();

    // Initialize a base drawing layer if none exists
    if (!activeDrawingLayerId) {
      const newDrawingLayerId = uuidv4();
      const newLayer = {
        type: "drawing" as const,
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        data: {}, // ImageData will be managed by the offscreen canvas
      };
      const layerId = addLayer(newLayer);
      setActiveDrawingLayerId(layerId);
    }
  }, []);

  useEffect(() => {
    if (isTyping && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTyping]);

  // Function to draw all layers onto the main canvas
  const drawAllLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000"; // Re-apply background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sort layers by zIndex (array order)
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.globalAlpha = layer.opacity;

      switch (layer.type) {
        case "drawing":
          // Draw content from the offscreen drawing canvas
          if (offscreenDrawingCanvasRef.current) {
            ctx.drawImage(offscreenDrawingCanvasRef.current, 0, 0);
          }
          break;
        case "text":
          ctx.font = `${layer.data.fontSize}px ${layer.data.fontFamily}`;
          ctx.fillStyle = layer.data.color;
          ctx.globalCompositeOperation = "source-over";

          const words = layer.data.text.split(" ");
          let line = "";
          let y = layer.y + layer.data.fontSize; // Start Y for the first line

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > layer.width && n > 0) {
              ctx.fillText(line, layer.x, y);
              line = words[n] + " ";
              y += layer.data.fontSize * 1.2; // Line height
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, layer.x, y);
          break;
        case "shape":
          ctx.strokeStyle = layer.data.color;
          ctx.fillStyle = layer.data.color;
          ctx.lineWidth = layer.data.brushSize;
          ctx.globalCompositeOperation = "source-over";

          const rectX = layer.x;
          const rectY = layer.y;
          const rectWidth = layer.width;
          const rectHeight = layer.height;

          switch (layer.data.shapeType) {
            case "circle":
              const circleRadius = Math.min(rectWidth, rectHeight) / 2;
              const circleCenterX = rectX + rectWidth / 2;
              const circleCenterY = rectY + rectHeight / 2;
              ctx.beginPath();
              ctx.arc(
                circleCenterX,
                circleCenterY,
                circleRadius,
                0,
                2 * Math.PI
              );
              // Use filled property to determine if shape should be filled or stroked
              if (layer.data.filled) {
                ctx.fill();
              } else {
                ctx.stroke();
              }
              break;
            case "square":
              const squareSide = Math.min(rectWidth, rectHeight);
              const squareX = rectX + (rectWidth - squareSide) / 2; // Center horizontally
              const squareY = rectY + (rectHeight - squareSide) / 2; // Center vertically
              ctx.beginPath();
              ctx.rect(squareX, squareY, squareSide, squareSide);
              // Use filled property to determine if shape should be filled or stroked
              if (layer.data.filled) {
                ctx.fill();
              } else {
                ctx.stroke();
              }
              break;
            case "triangle":
              const triangleSide = Math.min(rectWidth, rectHeight / 0.866); // Calculate side to fit height
              const triangleHeight = triangleSide * 0.866;
              const triangleCenterX = rectX + rectWidth / 2;
              const triangleTopY = rectY + (rectHeight - triangleHeight) / 2;

              ctx.beginPath();
              ctx.moveTo(triangleCenterX, triangleTopY);
              ctx.lineTo(
                triangleCenterX - triangleSide / 2,
                triangleTopY + triangleHeight
              );
              ctx.lineTo(
                triangleCenterX + triangleSide / 2,
                triangleTopY + triangleHeight
              );
              ctx.closePath();
              // Use filled property to determine if shape should be filled or stroked
              if (layer.data.filled) {
                ctx.fill();
              } else {
                ctx.stroke();
              }
              break;
          }
          break;
      }
    });
    ctx.globalAlpha = 1; // Reset alpha
  }, [layers, activeDrawingLayerId]);

  useEffect(() => {
    drawAllLayers();
  }, [layers, drawAllLayers]);

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

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawPreview = (currentPoint: { x: number; y: number }) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !startPoint) return;

    const previewCtx = previewCanvas.getContext("2d");
    if (!previewCtx) return;

    // Clear preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (["circle", "square", "triangle"].includes(currentTool)) {
      const rectX = Math.min(startPoint.x, currentPoint.x);
      const rectY = Math.min(startPoint.y, currentPoint.y);
      const rectWidth = Math.abs(currentPoint.x - startPoint.x);
      const rectHeight = Math.abs(currentPoint.y - startPoint.y);

      // Set preview style
      previewCtx.strokeStyle = color;
      previewCtx.lineWidth = brushSize;
      previewCtx.globalAlpha = 0.7;
      previewCtx.setLineDash([5, 5]); // Dashed line for preview

      switch (currentTool) {
        case "circle":
          const circleRadius = Math.min(rectWidth, rectHeight) / 2;
          const circleCenterX = rectX + rectWidth / 2;
          const circleCenterY = rectY + rectHeight / 2;
          previewCtx.beginPath();
          previewCtx.arc(
            circleCenterX,
            circleCenterY,
            circleRadius,
            0,
            2 * Math.PI
          );
          previewCtx.stroke();
          break;

        case "square":
          const squareSide = Math.min(rectWidth, rectHeight);
          const squareX = rectX + (rectWidth - squareSide) / 2; // Center horizontally
          const squareY = rectY + (rectHeight - squareSide) / 2; // Center vertically
          previewCtx.beginPath();
          previewCtx.rect(squareX, squareY, squareSide, squareSide);
          previewCtx.stroke();
          break;

        case "triangle":
          const triangleSide = Math.min(rectWidth, rectHeight / 0.866); // Calculate side to fit height
          const triangleHeight = triangleSide * 0.866;
          const triangleCenterX = rectX + rectWidth / 2;
          const triangleTopY = rectY + (rectHeight - triangleHeight) / 2;

          previewCtx.beginPath();
          previewCtx.moveTo(triangleCenterX, triangleTopY);
          previewCtx.lineTo(
            triangleCenterX - triangleSide / 2,
            triangleTopY + triangleHeight
          );
          previewCtx.lineTo(
            triangleCenterX + triangleSide / 2,
            triangleTopY + triangleHeight
          );
          previewCtx.closePath();
          previewCtx.stroke();
          break;
      }

      // Draw size indicator (show width x height of the bounding box)
      previewCtx.setLineDash([]); // Reset line dash
      previewCtx.globalAlpha = 0.8;
      previewCtx.fillStyle = color;
      previewCtx.font = "14px monospace";
      previewCtx.fillText(
        `${Math.round(rectWidth)}x${Math.round(rectHeight)}px`,
        currentPoint.x + 10,
        currentPoint.y - 10
      );

      // Draw connection line from start to current point (diagonal of the bounding box)
      previewCtx.globalAlpha = 0.5;
      previewCtx.strokeStyle = color;
      previewCtx.lineWidth = 1;
      previewCtx.setLineDash([2, 2]);
      previewCtx.beginPath();
      previewCtx.moveTo(startPoint.x, startPoint.y);
      previewCtx.lineTo(currentPoint.x, currentPoint.y);
      previewCtx.stroke();
    } else if (currentTool === "text") {
      // Draw text container preview
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);

      previewCtx.strokeStyle = color;
      previewCtx.lineWidth = 1;
      previewCtx.globalAlpha = 0.7;
      previewCtx.setLineDash([5, 5]);
      previewCtx.strokeRect(x, y, width, height);
    }
  };

  // Flood fill algorithm for fill tool
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = offscreenDrawingCanvasRef.current; // Apply fill to offscreen canvas
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Convert fill color to RGB
    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    // Don't fill if the color is the same
    if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b)
      return;

    const stack = [{ x: startX, y: startY }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height)
        continue;
      visited.add(key);

      const pos = (y * width + x) * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      if (r === startR && g === startG && b === startB && a === startA) {
        data[pos] = fillRGB.r;
        data[pos + 1] = fillRGB.g;
        data[pos + 2] = fillRGB.b;
        data[pos + 3] = 255;

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    }

    ctx.putImageData(imageData, 0, 0);
    drawAllLayers(); // Redraw main canvas after fill
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isTyping) return; // Prevent drawing while typing

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getMousePos(e);

    // Handle selection of existing layers
    if (
      ![
        "pencil",
        "brush",
        "eraser",
        "text",
        "circle",
        "square",
        "triangle",
        "fill",
      ].includes(currentTool)
    ) {
      setSelectedLayerId(null); // Deselect previous
      // Iterate layers in reverse order (top-most first) to find a hit
      const clickedLayer = [...layers]
        .sort((a, b) => b.zIndex - a.zIndex) // Sort descending zIndex
        .find((layer) => {
          if (!layer.visible) return false;
          // Simple bounding box hit test
          return (
            point.x >= layer.x &&
            point.x <= layer.x + layer.width &&
            point.y >= layer.y &&
            point.y <= layer.y + layer.height
          );
        });

      if (clickedLayer) {
        setSelectedLayerId(clickedLayer.id);
        setIsMovingLayer(true);
        setInitialMousePos({ x: e.clientX, y: e.clientY });
        setInitialLayerRect({
          x: clickedLayer.x,
          y: clickedLayer.y,
          width: clickedLayer.width,
          height: clickedLayer.height,
          initialFontSize:
            clickedLayer.type === "text"
              ? clickedLayer.data.fontSize
              : undefined,
        });
        if (clickedLayer.type === "text") {
          setTextInput(clickedLayer.data.text);
          setIsTyping(true);
        }
      }
      return; // Stop here if we're in selection mode
    }

    // Handle fill tool
    if (currentTool === "fill") {
      // Check if we clicked on a shape layer to fill it
      const clickedLayer = [...layers]
        .sort((a, b) => b.zIndex - a.zIndex) // Sort descending zIndex (top-most first)
        .find((layer) => {
          if (!layer.visible || layer.type !== "shape") return false;
          // Simple bounding box hit test
          return (
            point.x >= layer.x &&
            point.x <= layer.x + layer.width &&
            point.y >= layer.y &&
            point.y <= layer.y + layer.height
          );
        });

      if (clickedLayer) {
        // Toggle fill state and update color
        updateLayer(clickedLayer.id, {
          data: {
            ...clickedLayer.data,
            filled: !clickedLayer.data.filled,
            color: color, // Update to current color when filling
          }
        });
        saveState();
      } else {
        // If no shape was clicked, use flood fill on the drawing layer
        floodFill(Math.floor(point.x), Math.floor(point.y), color);
        saveState(); // Save overall canvas state
      }
      return;
    }

    // Handle new text or shape creation
    setIsDrawing(true);
    setLastPoint(point);
    setStartPoint(point);
    setSmoothPoints([point]);
    setShowPreview(true); // Show preview for new shapes/text boxes
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMovingLayer || isResizingLayer) return; // Prevent drawing if manipulating a layer

    if (!isDrawing) return;

    const canvas = offscreenDrawingCanvasRef.current; // Draw on offscreen canvas for strokes
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getMousePos(e);

    // Update preview for shape tools or text tool
    if (
      ["circle", "square", "triangle", "text"].includes(currentTool) &&
      showPreview
    ) {
      drawPreview(currentPoint);
      setLastPoint(currentPoint);
      return;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (currentTool) {
      case "pencil":
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;

        // Smooth drawing using quadratic curves
        setSmoothPoints((prev) => {
          const newPoints = [...prev, currentPoint];
          if (newPoints.length >= 3) {
            const len = newPoints.length;
            const p1 = newPoints[len - 3];
            const p2 = newPoints[len - 2];
            const p3 = newPoints[len - 1];

            // Create smooth curve between points
            const midPoint1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const midPoint2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

            ctx.beginPath();
            ctx.moveTo(midPoint1.x, midPoint1.y);
            ctx.quadraticCurveTo(p2.x, p2.y, midPoint2.x, midPoint2.y);
            ctx.stroke();
          }
          return newPoints;
        });
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
    drawAllLayers(); // Redraw main canvas to show strokes
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const previewCtx = previewCanvas.getContext("2d");
    if (!previewCtx) return;

    setIsDrawing(false);
    setSmoothPoints([]);
    setShowPreview(false);

    // Clear preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Handle shape drawing with dynamic sizing
    if (
      ["circle", "square", "triangle"].includes(currentTool) &&
      startPoint &&
      lastPoint
    ) {
      const x = Math.min(startPoint.x, lastPoint.x);
      const y = Math.min(startPoint.y, lastPoint.y);
      const width = Math.abs(lastPoint.x - startPoint.x);
      const height = Math.abs(lastPoint.y - startPoint.y);

      // Ensure minimum size for shapes
      const minShapeDim = 20;
      const finalWidth = Math.max(minShapeDim, width);
      const finalHeight = Math.max(minShapeDim, height);

      const newLayerId = addLayer({
        type: "shape",
        x: x, // Store bounding box top-left
        y: y,
        width: finalWidth, // Store bounding box dimensions
        height: finalHeight,
        data: {
          shapeType: currentTool,
          color: color,
          brushSize: brushSize,
          filled: false, // Shapes start as outlines
        },
      });
      setSelectedLayerId(newLayerId);
      saveState();
    } else if (currentTool === "text" && startPoint && lastPoint) {
      // Finalize text box drawing and activate input
      const x = Math.min(startPoint.x, lastPoint.x);
      const y = Math.min(startPoint.y, lastPoint.y);
      const width = Math.abs(lastPoint.x - startPoint.x);
      const height = Math.abs(lastPoint.y - startPoint.y);

      // Ensure minimum size for the text box
      const minWidth = 100; // Minimum width for text box
      const minHeight = 50; // Minimum height for text box

      const newLayerId = addLayer({
        type: "text",
        x,
        y,
        width: Math.max(minWidth, width),
        height: Math.max(minHeight, height),
        data: {
          text: "",
          fontFamily: fontFamily,
          fontSize: fontSize, // Initial font size
          color: color,
        },
      });
      setSelectedLayerId(newLayerId); // Select the newly created text layer
      setIsTyping(true); // Activate typing for the new layer
    } else if (["pencil", "brush", "eraser"].includes(currentTool)) {
      // For drawing tools, save the overall canvas state after drawing
      saveState();
    }

    setLastPoint(null);
    setStartPoint(null);
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!selectedLayerId) return;

    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.type !== "text") return;

    updateLayer(selectedLayerId, {
      data: {
        ...selectedLayer.data,
        text: textInput,
      },
    });
    saveState(); // Save overall canvas state after text is finalized

    setIsTyping(false);
    setTextInput("");
    setSelectedLayerId(null); // Deselect text layer after blur
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textInputRef.current?.blur(); // Trigger blur to finalize text
    }
  };

  // This handler is for the textarea itself (for moving)
  const handleLayerMouseDown = (
    e: React.MouseEvent<HTMLTextAreaElement | HTMLDivElement>
  ) => {
    e.stopPropagation(); // Prevent canvas drawing events
    if (!selectedLayerId) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (!selectedLayer) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Check if clicking on resize handle (bottom-right corner)
    const resizeHandleSize = 15; // Size of the interactive resize area
    if (
      mouseX > rect.right - resizeHandleSize &&
      mouseY > rect.bottom - resizeHandleSize &&
      mouseX < rect.right &&
      mouseY < rect.bottom
    ) {
      setIsResizingLayer(true);
      setInitialMousePos({ x: mouseX, y: mouseY });
      setInitialLayerRect({
        x: selectedLayer.x,
        y: selectedLayer.y,
        width: selectedLayer.width,
        height: selectedLayer.height,
        initialFontSize:
          selectedLayer.type === "text"
            ? selectedLayer.data.fontSize
            : undefined,
      });
    } else {
      // Otherwise, assume moving the layer
      setIsMovingLayer(true);
      setInitialMousePos({ x: mouseX, y: mouseY });
      setInitialLayerRect({
        x: selectedLayer.x,
        y: selectedLayer.y,
        width: selectedLayer.width,
        height: selectedLayer.height,
        initialFontSize:
          selectedLayer.type === "text"
            ? selectedLayer.data.fontSize
            : undefined,
      });
    }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!initialMousePos || !initialLayerRect || !selectedLayerId) return;

    const deltaX = e.clientX - initialMousePos.x;
    const deltaY = e.clientY - initialMousePos.y;

    if (isMovingLayer) {
      updateLayer(selectedLayerId, {
        x: initialLayerRect.x + deltaX,
        y: initialLayerRect.y + deltaY,
      });
    } else if (isResizingLayer) {
      const newWidth = Math.max(50, initialLayerRect.width + deltaX); // Min width
      const newHeight = Math.max(30, initialLayerRect.height + deltaY); // Min height

      updateLayer(selectedLayerId, {
        width: newWidth,
        height: newHeight,
      });

      // Dynamic font sizing for text layers
      const selectedLayer = layers.find((l) => l.id === selectedLayerId);
      if (
        selectedLayer?.type === "text" &&
        initialLayerRect.initialFontSize !== undefined
      ) {
        const minFontSize = 10;
        const maxFontSize = 72;
        const scaleFactor = newHeight / initialLayerRect.height; // Use initial height as the base for scaling
        const newCalculatedFontSize = Math.max(
          minFontSize,
          Math.min(maxFontSize, initialLayerRect.initialFontSize * scaleFactor)
        );
        updateLayer(selectedLayerId, {
          data: {
            ...selectedLayer.data,
            fontSize: Math.round(newCalculatedFontSize),
          },
        });
        setFontSize(Math.round(newCalculatedFontSize)); // Also update global font size for new text
      }
    }
  };

  const handleGlobalMouseUp = () => {
    if (isMovingLayer || isResizingLayer) {
      saveState(); // Save overall canvas state after manipulation
    }
    setIsMovingLayer(false);
    setIsResizingLayer(false);
    setInitialMousePos(null);
    setInitialLayerRect(null);
  };

  useEffect(() => {
    // Add global mouse move/up listeners for layer interaction
    if (isMovingLayer || isResizingLayer) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    } else {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isMovingLayer,
    isResizingLayer,
    initialMousePos,
    initialLayerRect,
    layers,
    selectedLayerId,
    updateLayer,
    setFontSize,
    saveState,
  ]);

  // Expose functions to parent components
  useEffect(() => {
    (window as any).canvasActions = {
      undo,
      redo,
      clearCanvas,
      downloadCanvas,
    };
  }, []);

  const currentSelectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="relative w-full h-full">
      {/* Main drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full bg-black"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          cursor:
            currentTool === "fill"
              ? "crosshair"
              : currentTool === "eraser"
              ? "grab"
              : ["circle", "square", "triangle"].includes(currentTool)
              ? "copy"
              : currentTool === "text"
              ? "text"
              : "crosshair",
        }}
      />

      {/* Preview canvas for shape helpers and selected layer bounding box */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Text input overlay for selected text layer */}
      {isTyping &&
        currentSelectedLayer &&
        currentSelectedLayer.type === "text" && (
          <div
            className="absolute"
            style={{
              left: currentSelectedLayer.x,
              top: currentSelectedLayer.y,
              width: currentSelectedLayer.width,
              height: currentSelectedLayer.height,
              zIndex: 2,
            }}
          >
            <textarea
              ref={textInputRef}
              className="w-full h-full bg-transparent resize-none outline-none overflow-hidden"
              style={{
                fontFamily: currentSelectedLayer.data.fontFamily,
                fontSize: `${currentSelectedLayer.data.fontSize}px`,
                color: currentSelectedLayer.data.color,
                lineHeight: 1.2,
                padding: 0,
                margin: 0,
                border: "1px dashed rgba(255,255,255,0.5)",
                cursor: isMovingLayer ? "grabbing" : "text",
              }}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              onMouseDown={handleLayerMouseDown} // Handles moving the text area
            />
            {/* Resize handle */}
            <div
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation(); // Crucial: Prevent textarea's onMouseDown
                setIsResizingLayer(true);
                setInitialMousePos({ x: e.clientX, y: e.clientY });
                setInitialLayerRect({
                  x: currentSelectedLayer.x,
                  y: currentSelectedLayer.y,
                  width: currentSelectedLayer.width,
                  height: currentSelectedLayer.height,
                  initialFontSize: currentSelectedLayer.data.fontSize,
                });
              }}
            />
          </div>
        )}

      {/* Bounding box and resize handle for selected non-text layers */}
      {!isTyping &&
        currentSelectedLayer &&
        currentSelectedLayer.type !== "drawing" && (
          <div
            className="absolute border-2 border-dashed border-blue-500"
            style={{
              left: currentSelectedLayer.x,
              top: currentSelectedLayer.y,
              width: currentSelectedLayer.width,
              height: currentSelectedLayer.height,
              zIndex: 2,
              cursor: isMovingLayer ? "grabbing" : "grab",
            }}
            onMouseDown={handleLayerMouseDown} // Handles moving the shape/image
          >
            {/* Resize handle */}
            <div
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-sm cursor-nwse-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizingLayer(true);
                setInitialMousePos({ x: e.clientX, y: e.clientY });
                setInitialLayerRect({
                  x: currentSelectedLayer.x,
                  y: currentSelectedLayer.y,
                  width: currentSelectedLayer.width,
                  height: currentSelectedLayer.height,
                });
              }}
            />
          </div>
        )}
    </div>
  );
}
