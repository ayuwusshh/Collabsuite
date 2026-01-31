import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)] p-4">
                <div className="max-w-md w-full bg-[#1a2332]/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
                    <p className="text-gray-400 mb-6">
                        If an account exists with <strong className="text-white">{email}</strong>,
                        you will receive a password reset link shortly.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        The link will expire in 1 hour. Check your spam folder if you don't see it.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)] p-4">
            <div className="max-w-md w-full bg-[#1a2332]/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                </button>

                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-blue-400" />
                </div>

                <h2 className="text-3xl font-bold text-white text-center mb-3">Forgot Password?</h2>
                <p className="text-gray-400 text-center mb-8">
                    No worries! Enter your email and we'll send you reset instructions.
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full bg-[#0B1220] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Remember your password?{' '}
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
