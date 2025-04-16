"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Resource Allocation by Project",
    },
  },
}

const data = {
  labels: ["Website Redesign", "CRM Implementation", "Q2 Marketing Campaign", "Mobile App Development"],
  datasets: [
    {
      label: "Human Resources",
      data: [12, 19, 3, 5],
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
    {
      label: "Material Resources",
      data: [2, 3, 20, 5],
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
    {
      label: "Financial Resources",
      data: [3, 10, 13, 15],
      backgroundColor: "rgba(75, 192, 192, 0.5)",
    },
  ],
}

export function ResourceAllocationChart() {
  return <Bar options={options} data={data} />
}
