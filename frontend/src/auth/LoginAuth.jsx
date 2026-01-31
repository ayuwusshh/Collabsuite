import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginAuth = ({ setIsOpen }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen w-screen bg-[#0f141e]/80 z-50 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-[#071226] rounded-2xl p-8 shadow-xl border border-[#15202b]">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#1b1b1b] transition"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        <h2 className="text-center text-2xl font-semibold text-white">
          Sign In
        </h2>
        <p className="text-center text-sm text-gray-400 mt-2 mb-6">
          Enter your information to access your account
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="m@example.com"
              required
              className="w-full bg-transparent border border-[#24303b] rounded-md px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-transparent border border-[#24303b] rounded-md px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/forgot-password');
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-md font-medium shadow-lg transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-2 inline-block underline text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
          >
            Create one
          </button>
        </p>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            navigate("/");
          }}
          className="w-full mt-4 text-gray-300 hover:text-white underline"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default LoginAuth;
