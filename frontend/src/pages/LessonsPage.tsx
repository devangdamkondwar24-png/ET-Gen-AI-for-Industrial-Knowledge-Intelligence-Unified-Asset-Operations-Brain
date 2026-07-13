import React from 'react';

const LessonsPage: React.FC = () => (
  <div className="flex-1 relative overflow-y-auto hide-scrollbar h-full">
    <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-32 space-y-8">
      <div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
          Lessons Learned
        </h1>
        <p className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest mt-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">school</span>
          Pattern Intelligence Engine
        </p>
      </div>

      <div className="bg-surface-container-low technical-border p-12 flex flex-col items-center gap-6 text-center">
        <span className="material-symbols-outlined text-[64px] text-outline">school</span>
        <p className="font-headline-md text-headline-md text-on-surface">Lessons Learned Engine</p>
        <p className="font-body-md text-on-surface-variant max-w-md">
          This pipeline runs as a batch job. Trigger it via the backend API endpoint{' '}
          <code className="font-label-sm text-label-sm bg-surface px-2 py-0.5 border border-outline-variant text-primary-container">
            POST /api/agents/lessons-learned/run
          </code>{' '}
          and the results will be written to the Neo4j knowledge graph automatically.
        </p>
        <a
          href="http://localhost:8000/docs#/agents"
          target="_blank"
          rel="noopener noreferrer"
          className="h-touch-target px-8 bg-primary-container text-on-primary-container font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Open API Docs
        </a>
      </div>
    </main>
  </div>
);

export default LessonsPage;
