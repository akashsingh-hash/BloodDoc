import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { BedInfo } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BedOccupancyChartProps {
  beds: BedInfo[];
}

const BedOccupancyChart: React.FC<BedOccupancyChartProps> = ({ beds }) => {
  const wardStats = beds.reduce((acc, bed) => {
    if (!acc[bed.ward]) {
      acc[bed.ward] = { total: 0, occupied: 0 };
    }
    acc[bed.ward].total++;
    if (bed.occupied) acc[bed.ward].occupied++;
    return acc;
  }, {} as Record<string, { total: number; occupied: number }>);

  const data = {
    labels: Object.keys(wardStats),
    datasets: [
      {
        label: 'Occupied Beds',
        data: Object.values(wardStats).map(stat => stat.occupied),
        backgroundColor: [
          '#710014',
          '#838F6F',
          '#f59e0b',
          '#10b981',
        ],
        borderColor: '#F2F1ED',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#F2F1ED',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: '#161616',
        titleColor: '#F2F1ED',
        bodyColor: '#F2F1ED',
        borderColor: '#710014',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default BedOccupancyChart;