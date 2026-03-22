'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/components/JobCard';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState('microsoft'); // Default

  useEffect(() => {
    fetchJobs(company);
  }, [company]);

  const fetchJobs = async (selectedCompany) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs?company=${selectedCompany}`);
      if (!res.ok) {
        throw new Error('Failed to fetch jobs. Please try again later.');
      }
      const data = await res.json();
      setJobs(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a] text-white selection:bg-indigo-500/30 font-sans">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Career Radar
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Discover top opportunities across the tech industry. Updated in real-time right from the company careers pages.
          </p>
        </div>

        {/* Filters/Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            <span className="text-gray-400 font-medium whitespace-nowrap shrink-0 ml-2">Company:</span>
            
            {['Microsoft', 'Google', 'Amazon', 'Apple', 'Netflix'].map(c => {
               const id = c.toLowerCase();
               return (
                 <button 
                  key={id}
                  onClick={() => setCompany(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${company === id ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                 >
                  {c}
                 </button>
               );
            })}
          </div>
          
          <div className="text-sm text-gray-400 mt-4 md:mt-0 font-medium">
            Location: <span className="text-indigo-400">India</span> | Role: <span className="text-indigo-400">Software Engineering</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-indigo-400 font-medium animate-pulse">Scraping latest opportunities...</p>
            </div>
          )}
          
          {error && !loading && (
            <div className="text-center p-12 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
              <span className="text-4xl block mb-4">⚠️</span>
              <p className="text-xl text-red-400 font-medium">{error}</p>
              <button 
                onClick={() => fetchJobs(company)}
                className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg transition-colors border border-red-500/30"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-center p-12 text-gray-400">
              <span className="text-4xl block mb-4">🔍</span>
              <p className="text-lg">No job listings found for the current criteria.</p>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
               {jobs.map(job => (
                 <JobCard key={job.id} job={job} />
               ))}
             </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
