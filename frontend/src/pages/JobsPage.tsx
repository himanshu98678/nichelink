import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsSection } from '../components/JobsSection';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <JobsSection onOpenAuth={(mode) => navigate(mode === 'login' ? '/login' : '/signup')} />
    </div>
  );
};
