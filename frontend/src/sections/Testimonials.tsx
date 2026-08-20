import React from 'react';
import { TESTIMONIALS_DATA } from '../data/testimonials';
import { TestimonialCard } from '../components/TestimonialCard';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Member Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Professionals Who Want Better Connections.
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            See how remote builders, founders, and creators find value in niche communities.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

      </div>
    </section>
  );
};
