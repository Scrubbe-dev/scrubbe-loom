'use client';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export function LineChart({ data }: { data: any }) {
  return <Line data={data} options={{ responsive: true }} />;
}
export function BarChart({ data }: { data: any }) {
  return <Bar data={data} options={{ responsive: true }} />;
}