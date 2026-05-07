"use client";
import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Composant de base pour tous les widgets
export function WidgetContainer({ id, title, icon, children, onRemove, onSettings, size = 'normal' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: size === 'large' ? 'span 2' : 'span 1'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ 
        background: '#111', 
        borderRadius: '20px', 
        border: '1px solid #222',
        overflow: 'hidden',
        height: '100%'
      }}>
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid #222', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'grab'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', cursor: 'grab' }}>⋮⋮</span>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{title}</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onSettings && (
              <button onClick={onSettings} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>⚙️</button>
            )}
            <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Widget Graphique des ventes
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function SalesChartWidget({ data, onDrillDown }) {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (data) {
      setChartData({
        labels: data.labels || ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Ventes',
          data: data.values || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          tension: 0.4,
          fill: true
        }]
      });
    }
  }, [data]);

  const handleClick = (event, elements) => {
    if (elements.length > 0 && onDrillDown) {
      const index = elements[0].index;
      onDrillDown(index);
    }
  };

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      {chartData && (
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: handleClick,
            plugins: {
              tooltip: { mode: 'index', intersect: false },
              legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
              y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
              x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            }
          }}
        />
      )}
    </div>
  );
}

// Widget KPIs avec objectifs
export function KPIWidget({ title, value, target, unit, icon, color, trend }) {
  const progress = target ? (value / target * 100) : 0;
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '28px' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>{title}</div>
          <div style={{ fontSize: '28px', color: color || '#10b981', fontWeight: 'bold' }}>{value.toLocaleString()} {unit}</div>
        </div>
      </div>
      {target && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Objectif: {target.toLocaleString()} {unit}</span>
            <span style={{ fontSize: '12px', color: progress >= 100 ? '#10b981' : '#f59e0b' }}>{progress.toFixed(0)}%</span>
          </div>
          <div style={{ background: '#1a1a1a', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(progress, 100)}%`, background: progress >= 100 ? '#10b981' : '#667eea', height: '6px', borderRadius: '10px' }}></div>
          </div>
        </div>
      )}
      {trend && (
        <div style={{ fontSize: '12px', color: trend >= 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs période précédente
        </div>
      )}
    </div>
  );
}

// Widget Alertes personnalisables
export function AlertsWidget({ alerts, onConfigure }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Alertes actives</span>
        <button onClick={onConfigure} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '12px' }}>⚙️ Configurer</button>
      </div>
      {alerts && alerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ 
              background: alert.severity === 'high' ? 'rgba(239,68,68,0.1)' : alert.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#10b981'}`,
              padding: '12px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'white', fontSize: '13px' }}>{alert.message}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{alert.time}</span>
              </div>
              <div style={{ fontSize: '11px', color: alert.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                {alert.value} {alert.threshold ? `> ${alert.threshold}` : ''}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <p>Aucune alerte</p>
        </div>
      )}
    </div>
  );
}

// Widget Comparaison périodes
export function ComparisonWidget({ current, previous, metric, unit }) {
  const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
  
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Période actuelle</div>
          <div style={{ fontSize: '24px', color: '#10b981', fontWeight: 'bold' }}>{current.toLocaleString()} {unit}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Période précédente</div>
          <div style={{ fontSize: '24px', color: '#94a3b8' }}>{previous.toLocaleString()} {unit}</div>
        </div>
      </div>
      <div style={{ 
        textAlign: 'center', 
        padding: '12px', 
        background: '#1a1a1a', 
        borderRadius: '10px',
        color: change >= 0 ? '#10b981' : '#ef4444'
      }}>
        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% {metric}
      </div>
    </div>
  );
}

// Widget Plein écran
export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>
      {isFullscreen ? '🗗' : '🗖'}
    </button>
  );
}
