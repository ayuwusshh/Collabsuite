import React, { useState } from 'react';
import { Globe, Menu, X } from 'lucide-react';

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-full px-4 sm:px-6 py-3 sm:py-4 fixed top-0 left-0 bg-[#0f141e]/90 backdrop-blur-md border-b border-gray-800/50 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CollabSuite
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Testimonials
            </a>
            <a href="#faqs" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              FAQs
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all border border-transparent hover:border-gray-700"
            >
              Login
            </button>
            <button
              onClick={onRegisterClick}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              Get Started
            </button>
          </div>

          {/* Hamburger Icon (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-[60px] right-0 h-[calc(100vh-60px)] w-72 bg-[#0f141e] border-l border-gray-800 z-40 md:hidden transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Menu Links */}
          <div className="flex flex-col space-y-4 mb-8">
            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-300 hover:text-white transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/5"
            >
              Features
            </a>
            <a
              href="#testimonials"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-300 hover:text-white transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/5"
            >
              Testimonials
            </a>
            <a
              href="#faqs"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-300 hover:text-white transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/5"
            >
              FAQs
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 mb-6"></div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onLoginClick();
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-all border border-gray-700"
            >
              Login
            </button>
            <button
              onClick={() => {
                onRegisterClick();
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-lg shadow-blue-500/20"
            >
              Get Started
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-auto pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              © 2026 CollabSuite. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
