import React, { useState } from 'react';
import Navbar from '../ui/Navbar';
import Hero from '../ui/Hero';
import HowItWorks from '../ui/HowItWorks';
import TestimonialCard from '../ui/TestimonialCard';
import Footer from '../ui/Footer';
import RegisterAuth from '../auth/RegisterAuth';
import LoginAuth from '../auth/LoginAuth';

const LandingPage = () => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)]">
            <Navbar
                onLoginClick={() => setIsLoginOpen(true)}
                onRegisterClick={() => setIsRegisterOpen(true)}
            />
            <Hero
                onLoginClick={() => setIsLoginOpen(true)}
                onRegisterClick={() => setIsRegisterOpen(true)}
            />
            <HowItWorks />
            <TestimonialCard />
            <Footer />

            {/* Auth Modals */}
            {isRegisterOpen && <RegisterAuth setIsOpen={setIsRegisterOpen} />}
            {isLoginOpen && <LoginAuth setIsOpen={setIsLoginOpen} />}
        </div>
    );
};

export default LandingPage;
