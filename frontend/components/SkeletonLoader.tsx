"use client";
export default function SkeletonLoader() {
  return (
    <div style={{ background: '#111', borderRadius: '20px', padding: '24px' }}>
      <div style={{ height: '32px', background: '#1e293b', borderRadius: '8px', marginBottom: '20px', width: '200px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', marginBottom: '30px' }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: '100px', background: '#1e293b', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>)}
      </div>
      <div style={{ height: '300px', background: '#1e293b', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
    </div>
  );
}
