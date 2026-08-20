import React from 'react';
import { Quote } from 'lucide-react';
import { Testimonial } from '../data/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <Quote className="w-8 h-8 text-indigo-200 mb-4 stroke-1" />
        <p className="text-base font-medium text-slate-800 leading-relaxed italic">
          "{testimonial.quote}"
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={testimonial.avatar}
            alt={testimonial.author}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{testimonial.author}</h4>
            <p className="text-xs text-slate-500">{testimonial.role}</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
          {testimonial.community}
        </span>
      </div>
    </div>
  );
};
