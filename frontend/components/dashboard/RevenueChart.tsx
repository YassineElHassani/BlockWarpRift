/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        fill: true,
        label: "Revenue",
        data: data.map((d) => d.revenue),
        borderColor: "#2563eb",
        backgroundColor: "rgba(108, 71, 255, 0.1)",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "#0a0a0f",
        titleFont: { size: 13 },
        bodyFont: { size: 14, weight: "bold" as const },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": $";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { maxTicksLimit: 7, color: "#6b7280" },
      },
      y: {
        grid: { color: "#f4f4f8", borderDash: [4, 4], drawBorder: false },
        ticks: { color: "#6b7280" },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return <Line options={options} data={chartData} />;
}
