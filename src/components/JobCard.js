import React from 'react';

export default function JobCard({ job }) {
  return (
    <div className="group relative rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-white/5">
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
          <p className="text-sm font-medium text-zinc-400">{job.company}</p>
        </div>
        
        <div className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap border border-white/10">
          {job.location}
        </div>
      </div>
      
      <p className="text-gray-400 text-sm mb-6 line-clamp-3">
        {job.descriptionSnippet}
      </p>
      
      <div className="pt-4 border-t border-white/10 flex justify-end">
        <a 
          href={job.applyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-bold py-2 px-6 rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-white/20"
        >
          <span>Apply Now</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
