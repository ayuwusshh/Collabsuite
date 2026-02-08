import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pen, Trash2, Download, Square, Circle, Minus, ArrowRight, Palette } from 'lucide-react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

const Whiteboard = () => {
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspace');

    const canvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const colorPickerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3B82F6');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const socketRef = useRef(null);
    const animationFrameRef = useRef(null);
    const pendingDrawRef = useRef(null);
    const shapeStartRef = useRef(null);

    const presetColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'];

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
                setShowColorPicker(false);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker]);

    useEffect(() => {
        if (!workspaceId) {
            console.error('No workspace selected');
            return;
        }

        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const previewCtx = previewCanvas.getContext('2d');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        previewCanvas.width = previewCanvas.offsetWidth;
        previewCanvas.height = previewCanvas.offsetHeight;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        previewCtx.lineCap = 'round';
        previewCtx.lineJoin = 'round';

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current = socket;

        socket.on('connect', () => {
            const roomId = `whiteboard_${workspaceId}`;
            socket.emit('join-room', roomId);
            console.log(`Joined whiteboard room: ${roomId}`);
        });

        socket.on('draw-data', (lineData) => {
            drawLine(ctx, lineData, false);
        });

        socket.on('shape-data', (shapeData) => {
            drawShape(ctx, shapeData, false);
        });

        socket.on('canvas-cleared', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            socket.disconnect();
        };
    }, [workspaceId]);

    const drawLine = (ctx, lineData, emit = true) => {
        const canvas = canvasRef.current;
        const { x0, y0, x1, y1, color, lineWidth, tool } = lineData;

        const actualX0 = x0 * canvas.width;
        const actualY0 = y0 * canvas.height;
        const actualX1 = x1 * canvas.width;
        const actualY1 = y1 * canvas.height;

        ctx.beginPath();
        ctx.moveTo(actualX0, actualY0);
        ctx.lineTo(actualX1, actualY1);
        ctx.strokeStyle = tool === 'eraser' ? '#0B1220' : color;
        ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
        ctx.stroke();
        ctx.closePath();

        if (emit && socketRef.current) {
            const roomId = `whiteboard_${workspaceId}`;
            socketRef.current.emit('draw', { roomId, data: lineData });
        }
    };

    const drawShape = (ctx, shapeData, emit = true) => {
        const canvas = canvasRef.current;
        const { type, x0, y0, x1, y1, color, lineWidth } = shapeData;

        const actualX0 = x0 * canvas.width;
        const actualY0 = y0 * canvas.height;
        const actualX1 = x1 * canvas.width;
        const actualY1 = y1 * canvas.height;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        if (type === 'rectangle') {
            ctx.strokeRect(actualX0, actualY0, actualX1 - actualX0, actualY1 - actualY0);
        } else if (type === 'circle') {
            const centerX = (actualX0 + actualX1) / 2;
            const centerY = (actualY0 + actualY1) / 2;
            const radius = Math.sqrt(Math.pow(actualX1 - actualX0, 2) + Math.pow(actualY1 - actualY0, 2)) / 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (type === 'line') {
            ctx.beginPath();
            ctx.moveTo(actualX0, actualY0);
            ctx.lineTo(actualX1, actualY1);
            ctx.stroke();
        } else if (type === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(actualX0, actualY0);
            ctx.lineTo(actualX1, actualY1);
            ctx.stroke();

            const angle = Math.atan2(actualY1 - actualY0, actualX1 - actualX0);
            const arrowLength = 15;
            ctx.beginPath();
            ctx.moveTo(actualX1, actualY1);
            ctx.lineTo(
                actualX1 - arrowLength * Math.cos(angle - Math.PI / 6),
                actualY1 - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(actualX1, actualY1);
            ctx.lineTo(
                actualX1 - arrowLength * Math.cos(angle + Math.PI / 6),
                actualY1 - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }

        if (emit && socketRef.current) {
            const roomId = `whiteboard_${workspaceId}`;
            socketRef.current.emit('draw-shape', { roomId, data: shapeData });
        }
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
            shapeStartRef.current = { x, y };
        } else {
            canvas.dataset.lastX = x;
            canvas.dataset.lastY = y;
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

            const shapeData = {
                type: tool,
                x0: shapeStartRef.current.x / canvas.width,
                y0: shapeStartRef.current.y / canvas.height,
                x1: x / canvas.width,
                y1: y / canvas.height,
                color,
                lineWidth
            };

            drawShape(previewCtx, shapeData, false);
        } else {
            const normalizedLineData = {
                x0: parseFloat(canvas.dataset.lastX) / canvas.width,
                y0: parseFloat(canvas.dataset.lastY) / canvas.height,
                x1: x / canvas.width,
                y1: y / canvas.height,
                color,
                lineWidth,
                tool
            };

            pendingDrawRef.current = normalizedLineData;

            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(() => {
                    const ctx = canvas.getContext('2d');
                    if (pendingDrawRef.current) {
                        drawLine(ctx, pendingDrawRef.current);
                        pendingDrawRef.current = null;
                    }
                    animationFrameRef.current = null;
                });
            }

            canvas.dataset.lastX = x;
            canvas.dataset.lastY = y;
        }
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (['rectangle', 'circle', 'line', 'arrow'].includes(tool) && shapeStartRef.current) {
            const canvas = canvasRef.current;
            const previewCanvas = previewCanvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);

            const ctx = canvas.getContext('2d');
            const shapeData = {
                type: tool,
                x0: shapeStartRef.current.x / canvas.width,
                y0: shapeStartRef.current.y / canvas.height,
                x1: x / canvas.width,
                y1: y / canvas.height,
                color,
                lineWidth
            };

            drawShape(ctx, shapeData);

            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            shapeStartRef.current = null;
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (socketRef.current && workspaceId) {
            const roomId = `whiteboard_${workspaceId}`;
            socketRef.current.emit('clear-canvas', roomId);
        }
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `whiteboard-${workspaceId}-${Date.now()}.png`;
        link.href = url;
        link.click();
    };

    if (!workspaceId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">No Workspace Selected</h2>
                    <p className="text-gray-400">Please select a workspace to use the whiteboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Whiteboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadCanvas}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                </div>
            </div>

            {/* Compact Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#1a2332]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl relative z-10">
                {/* Drawing Tools */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Pen"
                    >
                        <Pen className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Eraser"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>

                {/* Shape Tools */}
                <div className="flex gap-1 pl-2 border-l border-gray-600">
                    <button
                        onClick={() => setTool('rectangle')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Rectangle"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('circle')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Circle"
                    >
                        <Circle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('line')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Line"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('arrow')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="Arrow"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Color Picker */}
                <div className="relative pl-2 border-l border-gray-600" ref={colorPickerRef}>
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        title="Color"
                    >
                        <div className="w-5 h-5 rounded border-2 border-white" style={{ backgroundColor: color }}></div>
                        <Palette className="w-4 h-4" />
                    </button>

                    {/* Color Picker Dropdown */}
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-4 bg-[#1a2332] border border-gray-700 rounded-xl shadow-xl z-[100] min-w-[280px]">
                            <div className="mb-3">
                                <label className="text-xs text-gray-400 mb-2 block">Preset Colors</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {presetColors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setColor(c);
                                                setShowColorPicker(false);
                                            }}
                                            className={`w-full h-10 rounded-lg border-2 transition-all ${color === c ? 'border-white scale-105' : 'border-gray-600 hover:border-gray-400'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">Custom Color (RGB/Hex)</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full h-10 rounded-lg bg-gray-700 border border-gray-600 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    placeholder="#3B82F6"
                                    className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Brush Size */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-600">
                    <span className="text-xs text-gray-400 hidden sm:inline">Size:</span>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-20 sm:w-32"
                    />
                    <span className="text-xs text-white w-6">{lineWidth}</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-[#0B1220] rounded-xl border border-gray-700 overflow-hidden relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full cursor-crosshair absolute top-0 left-0"
                />
                <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full cursor-crosshair absolute top-0 left-0 pointer-events-none"
                />
            </div>


        </div>
    );
};

export default Whiteboard;
