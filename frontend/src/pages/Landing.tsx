import React from 'react';
import { CinematicVideoBackground } from '../components/CinematicVideoBackground';
import { HeroSection } from '../sections/Hero';
import { SocialProofSection } from '../sections/SocialProof';
import { HowItWorksSection } from '../sections/HowItWorks';
import { FeaturesSection } from '../sections/Features';
import { PricingSection } from '../sections/Pricing';
import { TestimonialsSection } from '../sections/Testimonials';
import { FAQSection } from '../sections/FAQ';
import { FinalCTASection } from '../sections/FinalCTA';

export const LandingPage: React.FC = () => {
  return (
    <main className="relative w-full overflow-hidden bg-slate-50">
      {/* Standalone Top Hero Cinematic Animated Looping Video Background Layer */}
      <CinematicVideoBackground className="w-full h-[780px] sm:h-[880px]" />

      {/* Hero Section & Landing Presentation Sections */}
      <div className="relative z-10">
        {/* 1. Hero Section with Sign Up / Sign In buttons and preview mockup */}
        <HeroSection />

        {/* 2. Visual Transition & Trust Proof */}
        <SocialProofSection />

        {/* 3. How It Works (Discover -> Connect -> Collaborate) */}
        <HowItWorksSection />

        {/* 4. Core Features & Capabilities */}
        <FeaturesSection />

        {/* 5. Free vs Pro Pricing Tier Preview */}
        <PricingSection />

        {/* 6. Testimonials */}
        <TestimonialsSection />

        {/* 7. Frequently Asked Questions */}
        <FAQSection />

        {/* 8. Final CTA with Sign Up and Sign In */}
        <FinalCTASection />
      </div>
    </main>
  );
};

