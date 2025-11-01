import React from "react";
import { X } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
const RegisterAuth = ({setIsOpen}) => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center min-h-screen w-screen bg-[#0f141e]/80 z-50 backdrop-blur-2xl"
    >
      <div className="relative w-full max-w-md bg-[#071226] rounded-2xl p-8 shadow-xl border border-[#15202b]">
        {/* Close Button */}
        <button onClick={()=>setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#1b1b1b] transition"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        <h2 className="text-center text-2xl font-semibold text-white">
          Create an account
        </h2>
        <p className="text-center text-sm text-gray-400 mt-2 mb-6">
          Enter your information to create an account
        </p>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-300 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              className="w-full bg-transparent border border-[#24303b] rounded-md px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="m@example.com"
              className="w-full bg-transparent border border-[#24303b] rounded-md px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full bg-transparent border border-[#24303b] rounded-md px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 cursor-pointer text-white py-3 rounded-md font-medium shadow-inner"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="ml-2 inline-block underline px-3 py-1 rounded-md text-white text-sm cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterAuth;
