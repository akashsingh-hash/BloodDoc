import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BloodInventory } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BloodInventoryChartProps {
  bloodInventory: BloodInventory[];
}

const BloodInventoryChart: React.FC<BloodInventoryChartProps> = ({ bloodInventory }) => {
  const data = {
    labels: bloodInventory.map(blood => blood.bloodType),
    datasets: [
      {
        label: 'Units Available',
        data: bloodInventory.map(blood => blood.units),
        backgroundColor: bloodInventory.map(blood => {
          if (blood.units < 10) return '#ef4444'; // Red for low stock
          if (blood.units < 20) return '#f59e0b'; // Yellow for medium stock
          return '#10b981'; // Green for good stock
        }),
        borderColor: '#710014',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#161616',
        titleColor: '#F2F1ED',
        bodyColor: '#F2F1ED',
        borderColor: '#710014',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#838F6F20',
        },
        ticks: {
          color: '#838F6F',
        },
      },
      x: {
        grid: {
          color: '#838F6F20',
        },
        ticks: {
          color: '#838F6F',
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BloodInventoryChart;