import React, { useEffect, useState } from 'react';

interface AlertMessage {
  id: number;
  title: string;
  message: string;
  severity: string;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/api/alerts/stream');

    eventSource.addEventListener('proactive_warning', (e) => {
      try {
        const data = JSON.parse(e.data);
        const newAlert: AlertMessage = {
          id: Date.now(),
          title: data.title,
          message: data.message,
          severity: data.severity
        };
        setAlerts((prev) => [...prev, newAlert]);
        
        // Auto dismiss after 10s
        setTimeout(() => {
          setAlerts((prev) => prev.filter(a => a.id !== newAlert.id));
        }, 10000);
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    });

    return () => eventSource.close();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {alerts.map(alert => (
        <div key={alert.id} className="bg-white border-l-4 border-[#D32F2F] shadow-lg rounded p-4 w-80 pointer-events-auto flex gap-3 items-start animate-fade-in-up">
          <span className="material-symbols-outlined text-[#D32F2F] mt-0.5">warning</span>
          <div className="flex-1">
            <h4 className="text-[14px] font-bold text-[#212121]">{alert.title}</h4>
            <p className="text-[12px] text-[#616161] mt-1">{alert.message}</p>
          </div>
          <button onClick={() => setAlerts(p => p.filter(a => a.id !== alert.id))} className="text-[#616161] hover:text-[#212121]">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default Alerts;
