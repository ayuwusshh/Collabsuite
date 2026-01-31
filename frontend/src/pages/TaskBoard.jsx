import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical } from 'lucide-react';
import api from '../services/api';

const TaskCard = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[#0B1220] border border-gray-700 rounded-lg p-4 mb-3 hover:border-gray-600 transition-colors"
        >
            <div className="flex items-start gap-3">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{task.title}</h4>
                    {task.dueDate && (
                        <p className="text-sm text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TaskColumn = ({ title, tasks, status }) => {
    return (
        <div className="bg-[#1a2332]/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 min-h-[500px]">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                {title}
                <span className="text-sm text-gray-400 font-normal">({tasks.length})</span>
            </h3>
            <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
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

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchTasks();
        }
    }, [selectedWorkspace]);

    const fetchWorkspaces = async () => {
        try {
            const response = await api.get('/workspaces');
            setWorkspaces(response.data);
            if (!selectedWorkspace && response.data.length > 0) {
                setSelectedWorkspace(response.data[0]._id);
            }
        } catch (error) {
            console.error('Fetch workspaces error:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get(`/tasks/workspace/${selectedWorkspace}`);
            setTasks(response.data);
        } catch (error) {
            console.error('Fetch tasks error:', error);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                title: newTaskTitle,
                workspaceId: selectedWorkspace
            });
            setNewTaskTitle('');
            setShowCreate(false);
            fetchTasks();
        } catch (error) {
            console.error('Create task error:', error);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = tasks.find(t => t._id === active.id);
        const overColumn = over.id.split('-')[0]; // Extract status from droppable id

        if (activeTask && overColumn && activeTask.status !== overColumn) {
            try {
                await api.patch(`/tasks/${activeTask._id}/status`, { status: overColumn });
                fetchTasks();
            } catch (error) {
                console.error('Update task status error:', error);
            }
        }
    };

    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Task Board</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    disabled={!selectedWorkspace}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg transition-all"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TaskColumn title="To Do" tasks={todoTasks} status="todo" />
                    <TaskColumn title="In Progress" tasks={inProgressTasks} status="in-progress" />
                    <TaskColumn title="Done" tasks={doneTasks} status="done" />
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
