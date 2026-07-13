import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const LessonsPage: React.FC = () => (
  <div className="flex h-screen bg-white">
    <Sidebar />
    <div className="flex-1 ml-60 flex flex-col">
      <Topbar title="Lessons Learned & Pattern Intelligence" />
      <main className="flex-1 pt-12 px-6 py-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-border-muted block">school</span>
          <p className="text-on-surface text-lg font-semibold">Lessons Learned Engine</p>
          <p className="text-text-muted text-sm max-w-md">
            This pipeline runs as a batch job. Trigger it via the backend API endpoint{' '}
            <code className="font-mono bg-surface px-1 py-0.5 rounded border text-xs border-border-muted">
              POST /api/agents/lessons-learned/run
            </code>{' '}
            and the results will be written to the Neo4j knowledge graph automatically.
          </p>
          <a
            href="http://localhost:8000/docs#/agents"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Open API Docs
          </a>
        </div>
      </main>
    </div>
  </div>
);

export default LessonsPage;
