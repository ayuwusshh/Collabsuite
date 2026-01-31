import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Clock, Copy, ArrowRight, User } from 'lucide-react';
import api from '../services/api';

const Meetings = () => {
    const navigate = useNavigate();
    const [meetingId, setMeetingId] = useState('');
    const [recentMeetings, setRecentMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/meetings');
            setRecentMeetings(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateMeetingId = () => {
        return Math.random().toString(36).substring(2, 10);
    };

    const handleCreateMeeting = async () => {
        const newId = generateMeetingId();
        try {
            await api.post('/meetings', { meetingId: newId });
            navigate(`/dashboard/meet/${newId}`);
        } catch (err) {
            console.error("Failed to create meeting session:", err);
            // Still navigate as fallback
            navigate(`/dashboard/meet/${newId}`);
        }
    };

    const handleJoinMeeting = (e) => {
        e.preventDefault();
        if (meetingId.trim()) {
            navigate(`/dashboard/meet/${meetingId}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white mb-1.5">Video Conferences</h1>
                <p className="text-sm text-gray-400">Connect with your team anywhere, anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Create Meeting */}
                <div className="relative group bg-[#1a2332]/30 backdrop-blur-md border border-gray-700/40 rounded-2xl p-8 overflow-hidden transition-all hover:border-blue-500/40 hover:bg-[#1a2332]/50">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-105 transition-transform">
                        <Video className="w-24 h-24 text-blue-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-medium text-white mb-2">Instant Meeting</h2>
                        <p className="text-sm text-gray-400 mb-6 max-w-xs">
                            Generate a fresh meeting link and jump right into collaboration.
                        </p>
                        <button
                            onClick={handleCreateMeeting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600/90 hover:bg-blue-600 text-white text-sm rounded-xl font-medium transition-all shadow-lg shadow-blue-500/10"
                        >
                            <span>Start Private Meeting</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Join Meeting */}
                <div className="bg-[#1a2332]/30 backdrop-blur-md border border-gray-700/40 rounded-2xl p-8 hover:border-emerald-500/40 hover:bg-[#1a2332]/50 transition-all">
                    <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
                        <Video className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-lg font-medium text-white mb-2">Join Existing</h2>
                    <p className="text-sm text-gray-400 mb-6 max-w-xs">
                        Enter a code or link provided by your teammate to join their room.
                    </p>
                    <form onSubmit={handleJoinMeeting} className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={meetingId}
                                onChange={(e) => setMeetingId(e.target.value)}
                                placeholder="Enter meeting ID (e.g. x2k8j3n9)"
                                className="w-full bg-[#0B1220]/80 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-6 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-sm rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/10"
                        >
                            Join Session
                        </button>
                    </form>
                </div>
            </div>

            {/* Meeting History */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-medium text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Recent Activity
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800/10 animate-pulse rounded-xl border border-white/5"></div>)}
                    </div>
                ) : recentMeetings.length === 0 ? (
                    <div className="bg-[#1a2332]/20 border border-dashed border-gray-700/40 rounded-2xl p-12 text-center">
                        <div className="w-12 h-12 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">No previous meetings found.</p>
                        <p className="text-slate-500 text-xs mt-1">Your meeting history will appear here once you start one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentMeetings.map((m) => (
                            <div
                                key={m._id}
                                className="bg-[#1a2332]/30 backdrop-blur-sm border border-gray-800/40 p-5 rounded-xl hover:bg-slate-800/30 hover:border-gray-700/60 transition-all cursor-pointer group"
                                onClick={() => navigate(`/dashboard/meet/${m.meetingId}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{m.meetingId}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                        {new Date(m.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <h3 className="text-white text-sm font-medium flex items-center gap-2 mb-1">
                                    Room Session
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 group-hover:text-blue-400 transition-all" />
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <User className="w-3 h-3" />
                                    <span>Hosted by {m.host?.name || 'You'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Meetings;
