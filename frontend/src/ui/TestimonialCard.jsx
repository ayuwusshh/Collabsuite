import React from "react";
import { Data } from "../data/TestimonialData";

const TestimonialCard = () => {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {Data.map((testimonial) => (
        <div
          key={testimonial.id}
          className="rounded-lg border border-gray-700 p-5 w-80 bg-[#0f141e]/80 backdrop-blur-sm text-gray-50 transition-all duration-200 hover:border-blue-500 hover:scale-[1.02]"
        >
          {/* Avatar */}
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border border-gray-600"
          />

          {/* Name & Role */}
          <h3 className="text-lg font-semibold text-center">{testimonial.name}</h3>
          <p className="text-sm text-center text-gray-400">
            {testimonial.role} - {testimonial.company}
          </p>

          {/* Content */}
          <p className="mt-3 text-sm text-gray-300 text-center italic">
            "{testimonial.content}"
          </p>
        </div>
      ))}
    </div>
  );
};

export default TestimonialCard;
