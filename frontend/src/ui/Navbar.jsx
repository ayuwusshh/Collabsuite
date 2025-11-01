import React, { useState } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import RegisterAuth from '../auth/RegisterAuth';
import LoginAuth from '../auth/LoginAuth';

const Navbar = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStartedClick = () => {
    setIsRegisterOpen(true);
  };

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  return (
    <div className="w-full sm:p-2 flex justify-between items-center p-4 fixed top-0 left-0 bg-[#0f141e]/80 backdrop-blur-sm border-b gap-2 border-gray-700 rounded-b-xl z-50 text-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Globe className="text-blue-900" />
        <span className="text-white font-semibold text-sm md:text-lg lg:text-xl 2xl:text-2xl">
          CollabSuite
        </span>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex space-x-6">
        <span className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer">Features</span>
        <span className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer">Testimonials</span>
        <span className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer">FAQs</span>
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex space-x-3">
        <button
          onClick={handleLoginClick}
          className="ml-3 mr-3 rounded-xl border border-gray-700 px-3 text-base font-medium bg-[#1a1a1a] text-white cursor-pointer transition-colors duration-200 hover:border-[#4A90E2]"
        >
          Login
        </button>
        <button
          onClick={handleGetStartedClick}
          className="rounded-xl border border-gray-700 px-3 text-base font-medium bg-[#1a1a1a] text-white cursor-pointer transition-colors duration-200 hover:border-[#4A90E2]"
        >
          Get Started
        </button>
      </div>

      {/* Hamburger Icon (Mobile) */}
      <div className="md:hidden">
        {isMenuOpen ? (
          <X className="text-white cursor-pointer" onClick={() => setIsMenuOpen(false)} />
        ) : (
          <Menu className="text-white cursor-pointer" onClick={() => setIsMenuOpen(true)} />
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`absolute top-16 left-0 w-full bg-[#0f141e] border-t border-gray-700 flex flex-col items-center py-4 space-y-4 md:hidden transition-all duration-300 ease-in-out transform ${
          isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <span
          onClick={() => setIsMenuOpen(false)}
          className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer"
        >
          Features
        </span>
        <span
          onClick={() => setIsMenuOpen(false)}
          className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer"
        >
          Testimonials
        </span>
        <span
          onClick={() => setIsMenuOpen(false)}
          className="text-blue-500 hover:text-blue-300 m-2 cursor-pointer"
        >
          FAQs
        </span>

        <div className="flex space-x-3 items-center">
          <button
            onClick={() => {
              handleLoginClick();
              setIsMenuOpen(false);
            }}
            className="ml-3 mr-3 rounded-xl border border-gray-700 px-3 text-base font-medium bg-[#1a1a1a] text-white cursor-pointer transition-colors duration-200 hover:border-[#4A90E2]"
          >
            Login
          </button>
          <button
            onClick={() => {
              handleGetStartedClick();
              setIsMenuOpen(false);
            }}
            className="rounded-xl border border-gray-700 px-3 text-base font-medium bg-[#1a1a1a] text-white cursor-pointer transition-colors duration-200 hover:border-[#4A90E2]"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Auth Modals */}
      {isRegisterOpen && <RegisterAuth setIsOpen={setIsRegisterOpen} />}
      {isLoginOpen && <LoginAuth setIsOpen={setIsLoginOpen} />}
    </div>
  );
};

export default Navbar;
