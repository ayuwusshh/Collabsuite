import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import api from '../services/api';

const TaskCard = ({ task, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[#0B1220] border border-gray-700 rounded-lg p-4 mb-3 hover:border-gray-600 transition-colors group"
        >
            <div className="flex items-start gap-3">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{task.title}</h4>
                    {task.description && (
                        <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                        <p className="text-sm text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                </div>
                <button
                    onClick={() => onDelete(task._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                    title="Delete task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const TaskColumn = ({ title, tasks, status, onDeleteTask }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-[#1a2332]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex flex-col transition-colors ${isOver ? 'border-blue-500 bg-blue-500/10' : ''
                }`}
        >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between flex-shrink-0">
                {title}
                <span className="text-sm text-gray-400 font-normal">({tasks.length})</span>
            </h3>
            <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {tasks.map((task) => (
                        <TaskCard key={task._id} task={task} onDelete={onDeleteTask} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

const TaskBoard = () => {
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspace');
    const [tasks, setTasks] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceId || '');
    const [showCreate, setShowCreate] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const pendingOperationsRef = React.useRef(new Set());
    const isMountedRef = React.useRef(true);
    const socketReconnectTimeoutRef = React.useRef(null);

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        isMountedRef.current = true;
        fetchWorkspaces();
        return () => {
            isMountedRef.current = false;
            if (socketReconnectTimeoutRef.current) {
                clearTimeout(socketReconnectTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            setIsLoading(true);
            fetchTasks().finally(() => {
                if (isMountedRef.current) setIsLoading(false);
            });
        }
    }, [selectedWorkspace]);

    // Socket connection for real-time updates
    useEffect(() => {
        if (!selectedWorkspace) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        let newSocket = null;
        let reconnectAttempts = 0;
        const MAX_RECONNECT_ATTEMPTS = 3;

        try {
            newSocket = io(API_URL, {
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
                reconnectionDelay: 1000,
                timeout: 10000
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log(`🔌 Joining workspace room: workspace_${selectedWorkspace}`);
                newSocket.emit('join-room', `workspace_${selectedWorkspace}`);
                if (isMountedRef.current) setError(null);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                reconnectAttempts++;
                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && isMountedRef.current) {
                    setError('Real-time updates unavailable. Changes will sync when connection is restored.');
                }
            });

            // Listen for task updates from other users
            newSocket.on('task-created', (newTask) => {
                if (!isMountedRef.current || !newTask?._id) return;
                console.log('📥 Received task-created event:', newTask);
                setTasks(prev => {
                    if (prev.some(t => t._id === newTask._id)) return prev;
                    return [...prev, newTask];
                });
            });

            newSocket.on('task-status-updated', (updatedTask) => {
                if (!isMountedRef.current || !updatedTask?._id) return;
                console.log('📥 Received task-status-updated event:', updatedTask);
                // Ignore if this is our own operation
                if (pendingOperationsRef.current.has(`status-${updatedTask._id}`)) {
                    console.log('⏭️ Ignoring own status update');
                    pendingOperationsRef.current.delete(`status-${updatedTask._id}`);
                    return;
                }
                setTasks(prev => prev.map(task =>
                    task._id === updatedTask._id ? updatedTask : task
                ));
            });

            newSocket.on('task-deleted', ({ taskId }) => {
                if (!isMountedRef.current || !taskId) return;
                console.log('📥 Received task-deleted event:', taskId);
                // Ignore if this is our own operation
                if (pendingOperationsRef.current.has(`delete-${taskId}`)) {
                    console.log('⏭️ Ignoring own delete');
                    pendingOperationsRef.current.delete(`delete-${taskId}`);
                    return;
                }
                setTasks(prev => prev.filter(task => task._id !== taskId));
            });
        } catch (err) {
            console.error('Socket initialization error:', err);
            if (isMountedRef.current) {
                setError('Failed to connect to real-time updates');
            }
        }

        return () => {
            if (newSocket) {
                newSocket.off('connect');
                newSocket.off('connect_error');
                newSocket.off('task-created');
                newSocket.off('task-status-updated');
                newSocket.off('task-deleted');
                newSocket.emit('leave-room', `workspace_${selectedWorkspace}`);
                newSocket.disconnect();
            }
            setSocket(null);
        };
    }, [selectedWorkspace]);

    const fetchWorkspaces = async () => {
        try {
            const response = await api.get('/workspaces');
            if (!isMountedRef.current) return;

            if (Array.isArray(response.data)) {
                setWorkspaces(response.data);
                if (!selectedWorkspace && response.data.length > 0) {
                    setSelectedWorkspace(response.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Fetch workspaces error:', error);
            if (isMountedRef.current) {
                setError('Failed to load workspaces. Please refresh.');
            }
        }
    };

    const fetchTasks = async () => {
        if (!selectedWorkspace) return;

        try {
            const response = await api.get(`/tasks/workspace/${selectedWorkspace}`);
            if (!isMountedRef.current) return;

            if (Array.isArray(response.data)) {
                setTasks(response.data);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error('Fetch tasks error:', error);
            if (isMountedRef.current) {
                setError(error.response?.data?.error || 'Failed to load tasks');
                setTasks([]);
            }
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        // Mark this as a pending local operation
        pendingOperationsRef.current.add(`delete-${taskId}`);

        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(task => task._id !== taskId));
        } catch (error) {
            console.error('Delete task error:', error);
            // Remove from pending if failed
            pendingOperationsRef.current.delete(`delete-${taskId}`);
            alert('Failed to delete task. Please try again.');
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        const trimmedTitle = newTaskTitle.trim();

        if (!trimmedTitle) return;
        if (!selectedWorkspace) {
            alert('Please select a workspace first');
            return;
        }

        try {
            await api.post('/tasks', {
                title: trimmedTitle,
                description: newTaskDescription.trim(),
                workspaceId: selectedWorkspace
            });

            if (!isMountedRef.current) return;

            setNewTaskTitle('');
            setNewTaskDescription('');
            setShowCreate(false);
            await fetchTasks();
        } catch (error) {
            console.error('Create task error:', error);
            if (isMountedRef.current) {
                const errorMsg = error.response?.data?.error || 'Failed to create task. Please try again.';
                alert(errorMsg);
            }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = tasks.find(t => t._id === active.id);

        // Determine the new status
        // over.id can be either a column status ("todo", "in_progress", "done")
        // or a task ID if dropped on top of another task
        let newStatus;
        const validStatuses = ['todo', 'in_progress', 'done'];

        if (validStatuses.includes(over.id)) {
            // Dropped directly on column
            newStatus = over.id;
        } else {
            // Dropped on top of another task - find that task's status
            const targetTask = tasks.find(t => t._id === over.id);
            newStatus = targetTask?.status;
        }

        console.log('🔄 Drag end event:', {
            activeId: active.id,
            overId: over.id,
            activeTask: activeTask,
            newStatus: newStatus,
            currentStatus: activeTask?.status,
            isDroppedOnTask: !validStatuses.includes(over.id)
        });

        if (!activeTask || !newStatus || activeTask.status === newStatus) {
            console.log('⏭️ Skipping update - no change or invalid task');
            return;
        }

        // Mark this as a pending local operation
        const operationId = `status-${activeTask._id}`;
        pendingOperationsRef.current.add(operationId);

        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(task =>
            task._id === activeTask._id ? { ...task, status: newStatus } : task
        ));

        try {
            console.log(`📤 Sending PATCH request to /tasks/${activeTask._id}/status with status:`, newStatus);
            await api.patch(`/tasks/${activeTask._id}/status`, { status: newStatus });
            console.log('✅ Status update successful');
            // Success - remove from pending after a delay to avoid race conditions
            setTimeout(() => {
                pendingOperationsRef.current.delete(operationId);
            }, 500);
        } catch (error) {
            console.error('❌ Update task status error:', error);
            console.error('Error response:', error.response?.data);
            // Remove from pending immediately on error
            pendingOperationsRef.current.delete(operationId);

            if (isMountedRef.current) {
                // Rollback on error
                setTasks(previousTasks);
                const errorMsg = error.response?.data?.error || 'Failed to update task status. Please try again.';
                alert(errorMsg);
            }
        }
    };

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        ×
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Task Board</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    disabled={!selectedWorkspace || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Task</span>
                </button>
            </div>

            {workspaces.length > 0 && (
                <select
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                    className="w-full md:w-64 bg-[#1a2332] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {workspaces.map((ws) => (
                        <option key={ws._id} value={ws._id}>{ws.name}</option>
                    ))}
                </select>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] md:h-auto md:min-h-[500px]">
                    <TaskColumn title="To Do" tasks={todoTasks} status="todo" onDeleteTask={handleDeleteTask} />
                    <TaskColumn title="In Progress" tasks={inProgressTasks} status="in_progress" onDeleteTask={handleDeleteTask} />
                    <TaskColumn title="Done" tasks={doneTasks} status="done" onDeleteTask={handleDeleteTask} />
                </div>
            </DndContext>

            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a2332] border border-gray-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold text-white mb-4">Create New Task</h3>
                        <form onSubmit={handleCreateTask}>
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Task title"
                                required
                                className="w-full bg-[#0B1220] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                            />
                            <textarea
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Task description (optional)"
                                rows="3"
                                className="w-full bg-[#0B1220] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;
