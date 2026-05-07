"use client";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export function SalesChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    if (chartRef.current && data) {
      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels: data.labels || ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"],
          datasets: [
            {
              label: "Ventes",
              data: data.sales || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              borderColor: "#10b981",
              backgroundColor: "rgba(16,185,129,0.1)",
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#94a3b8" }
            }
          },
          scales: {
            y: {
              grid: { color: "#1e293b" },
              ticks: { color: "#94a3b8" }
            },
            x: {
              grid: { color: "#1e293b" },
              ticks: { color: "#94a3b8" }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} style={{ width: "100%", height: "300px" }} />;
}

export function PieChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    if (chartRef.current && data) {
      chartInstance.current = new Chart(chartRef.current, {
        type: "doughnut",
        data: {
          labels: data.labels || ["Ventes", "Achats", "Frais"],
          datasets: [{
            data: data.values || [0, 0, 0],
            backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#94a3b8" }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} style={{ width: "100%", height: "250px" }} />;
}

export function BarChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    if (chartRef.current && data) {
      chartInstance.current = new Chart(chartRef.current, {
        type: "bar",
        data: {
          labels: data.labels || ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
          datasets: [{
            label: "Ventes",
            data: data.values || [0, 0, 0, 0, 0, 0],
            backgroundColor: "#667eea",
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#94a3b8" }
            }
          },
          scales: {
            y: {
              grid: { color: "#1e293b" },
              ticks: { color: "#94a3b8" }
            },
            x: {
              grid: { color: "#1e293b" },
              ticks: { color: "#94a3b8" }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} style={{ width: "100%", height: "300px" }} />;
}
