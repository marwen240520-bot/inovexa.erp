"use client";
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export function GanttChart({ projects }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const formatted = projects.map(p => ({
      id: p.id,
      title: p.name,
      start: p.startDate,
      end: p.endDate,
      backgroundColor: p.status === 'completed' ? '#10b981' : p.status === 'in_progress' ? '#f59e0b' : '#667eea',
      borderColor: 'transparent',
      extendedProps: { progress: p.progress, budget: p.budget }
    }));
    setEvents(formatted);
  }, [projects]);

  return (
    <div style={{ background: '#111', borderRadius: '20px', padding: '24px', border: '1px solid #222' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        eventClick={(info) => {
          alert(`Projet: ${info.event.title}\nAvancement: ${info.event.extendedProps.progress}%\nBudget: ${info.event.extendedProps.budget}€`);
        }}
      />
    </div>
  );
}
