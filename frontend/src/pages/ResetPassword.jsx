import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = () => {
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePassword()) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(`/auth/reset-password/${token}`, { password });

            // Auto-login after successful password reset
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setSuccess(true);

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    login(response.data.token, response.data.user);
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)] p-4">
                <div className="max-w-md w-full bg-[#1a2332]/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h2>
                    <p className="text-gray-400 mb-6">
                        Your password has been updated. Redirecting you to the dashboard...
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-full animate-[progress_2s_ease-in-out]"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)] p-4">
            <div className="max-w-md w-full bg-[#1a2332]/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-purple-400" />
                </div>

                <h2 className="text-3xl font-bold text-white text-center mb-3">Reset Password</h2>
                <p className="text-gray-400 text-center mb-8">
                    Enter your new password below
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                className="w-full bg-[#0B1220] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Must be at least 6 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                className="w-full bg-[#0B1220] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Remember your password?{' '}
                    <button
                        onClick={() => navigate('/')}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;
