import React from "react";
import Herro from "../photos/herro.jpg";
import { ArrowRight } from "lucide-react";
import TestimonialCard from './TestimonialCard'
const Hero = () => {
  return (
    <div className="relative pt-20 flex flex-col-reverse md:flex-row items-center px-4 sm:px-10 gap-5 md:gap-16 h-auto md:h-screen">

      {/* Left: Text Content */}
      <div className="flex flex-col items-center md:items-start justify-center flex-1 max-w-2xl text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-snug flex flex-col">
          <span>
            <span className="text-gray-100">The Complete </span>
            <span className="text-indigo-500">Remote Work</span>
            <span className="text-gray-100"> Collaboration Suite</span>
          </span>
        </h1>

        <p className="font-medium mt-4 sm:mt-6 text-base sm:text-lg text-gray-300">
          Everything your distributed team needs to communicate, coordinate,
          and collaborate in real time all in one browser-based platform.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center sm:justify-start items-center mt-6 gap-3">
          <button className="w-full sm:w-auto rounded-lg border px-5 py-2 text-base font-medium bg-[#121A2B] text-white cursor-pointer transition-colors duration-200 hover:border-blue-500 flex items-center justify-center border-[#2B3652]">
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <button className="w-full sm:w-auto rounded-lg border border-[#2B3652] px-5 py-2 text-base font-medium bg-[#121A2B] text-white cursor-pointer transition-colors duration-200 hover:border-blue-500">
            Sign In
          </button>
        </div>
      </div>

      {/* Right: Image */}
      <div className="flex-1 w-full md:w-auto flex justify-center items-center group overflow-hidden rounded-xl shadow-lg ring-1 ring-[#2B3652] h-64 sm:h-80 md:h-auto">
        <img
          src={Herro}
          alt="Collaboration Suite dashboard"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
};

export default Hero;
