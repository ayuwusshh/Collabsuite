import React from "react";
import Herro from "../photos/herro.jpg";
import { ArrowRight } from "lucide-react";

/**
 * Hero Component
 * @param {Object} props
 * @param {Function} props.onRegisterClick - Handler for "Get Started" button
 * @param {Function} props.onLoginClick - Handler for "Sign In" button
 */
const Hero = ({ onRegisterClick, onLoginClick }) => {
  return (
    <div className="relative pt-20 flex flex-col-reverse md:flex-row items-center px-4 sm:px-10 gap-5 md:gap-16 h-auto md:h-screen">
      {/* Left: Text Content */}
      <div className="flex flex-col items-center md:items-start justify-center flex-1 max-w-2xl text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-snug flex flex-col">
          <span>
            <span className="text-gray-100">The Complete </span>
            <span className="text-indigo-500 font-extrabold italic">Remote Work</span>
            <span className="text-gray-100"> Collaboration Suite</span>
          </span>
        </h1>

        <p className="font-medium mt-4 sm:mt-6 text-base sm:text-lg text-gray-400">
          Everything your distributed team needs to communicate, coordinate,
          and collaborate in real time all in one browser-based platform.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center sm:justify-start items-center mt-8 gap-4">
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onLoginClick}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all border border-gray-700 hover:border-gray-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In
          </button>
        </div>

        {/* Trust Batch */}
        <div className="mt-10 flex items-center gap-4 text-gray-500 text-xs sm:text-sm font-medium">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#0B1220] bg-gray-800 flex items-center justify-center`}>
                <span className="text-[10px]">U{i}</span>
              </div>
            ))}
          </div>
          <p>Trusted by 5,000+ remote workers</p>
        </div>
      </div>

      {/* Right: Illustration/Image */}
      <div className="flex-1 w-full md:w-auto flex justify-center items-center group relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
        <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 h-64 sm:h-80 md:h-[450px] w-full max-w-lg">
          <img
            src={Herro}
            alt="Collaboration Suite dashboard"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/60 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
