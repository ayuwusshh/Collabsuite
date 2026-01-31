import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pen, Trash2, Download } from 'lucide-react';
import { io } from 'socket.io-client';

const Whiteboard = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3B82F6');
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen');
    const socketRef = useRef(null);
    const roomId = 'whiteboard_main'; // In production, this would be dynamic

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Set default styles
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Initialize socket
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-room', roomId);
        });

        socket.on('receive-line', (lineData) => {
            drawLine(ctx, lineData, false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const drawLine = (ctx, lineData, emit = true) => {
        const { x0, y0, x1, y1, color, lineWidth, tool } = lineData;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = tool === 'eraser' ? '#0B1220' : color;
        ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
        ctx.stroke();
        ctx.closePath();

        if (emit && socketRef.current) {
            socketRef.current.emit('draw-line', { roomId, lineData });
        }
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        canvas.dataset.lastX = x;
        canvas.dataset.lastY = y;
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const lineData = {
            x0: parseFloat(canvas.dataset.lastX),
            y0: parseFloat(canvas.dataset.lastY),
            x1: x,
            y1: y,
            color,
            lineWidth,
            tool
        };

        drawLine(ctx, lineData);

        canvas.dataset.lastX = x;
        canvas.dataset.lastY = y;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = url;
        link.click();
    };

    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#000000'];

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Whiteboard</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={downloadCanvas}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4 p-4 bg-[#1a2332]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <Pen className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2">
                    {colors.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Size:</span>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-32"
                    />
                    <span className="text-sm text-white w-8">{lineWidth}</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-[#0B1220] rounded-xl border border-gray-700 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                />
            </div>
        </div>
    );
};

export default Whiteboard;
