import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./ui/Hero";
import Navbar from "./ui/Navbar";
import HowItWorks from "./ui/HowItWorks";
import RegisterAuth from "./auth/RegisterAuth";
import LoginAuth from "./auth/LoginAuth";
import TestimonialCard from './ui/TestimonialCard'
import Footer from "./ui/Footer";


export default function App() {
  return (
  
      <Router>
      <div className="min-h-screen bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)]">
        <Navbar />
        <Hero />
        <HowItWorks />
  <TestimonialCard/>
  <Footer/>
      </div>
    </Router>
  );
}
