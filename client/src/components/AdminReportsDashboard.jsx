import { useEffect, useState } from "react";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const chartPalette = {
  bg: [
    "rgba(255, 193, 7, 0.75)",
    "rgba(13, 202, 240, 0.75)",
    "rgba(13, 110, 253, 0.75)",
    "rgba(25, 135, 84, 0.75)",
  ],
  border: [
    "rgb(255, 193, 7)",
    "rgb(13, 202, 240)",
    "rgb(13, 110, 253)",
    "rgb(25, 135, 84)",
  ],
};

const barColors = {
  backgroundColor: "rgba(13, 110, 253, 0.6)",
  borderColor: "rgb(13, 110, 253)",
  borderWidth: 1,
};

const lineColors = {
  borderColor: "rgb(25, 135, 84)",
  backgroundColor: "rgba(25, 135, 84, 0.1)",
  fill: true,
};

function labelForStatus(status) {
  if (status === "InProgress") return "In Progress";
  return status;
}

export default function AdminReportsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusData, setStatusData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [s, a, d, m] = await Promise.all([
          axios.get("/reports/status-summary"),
          axios.get("/reports/area-summary"),
          axios.get("/reports/driver-performance"),
          axios.get("/reports/monthly-trend"),
        ]);
        if (!cancelled) {
          setStatusData(s.data);
          setAreaData(a.data);
          setDriverData(d.data);
          setMonthlyData(m.data);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Could not load report data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = {
    labels: statusData.map((x) => labelForStatus(x.status)),
    datasets: [
      {
        data: statusData.map((x) => x.count),
        backgroundColor: chartPalette.bg,
        borderColor: chartPalette.border,
        borderWidth: 1,
      },
    ],
  };

  const areaChartData = {
    labels:
      areaData.length > 0 ? areaData.map((x) => x.areaName) : ["No data"],
    datasets: [
      {
        label: "Requests",
        data:
          areaData.length > 0 ? areaData.map((x) => x.count) : [0],
        ...barColors,
      },
    ],
  };

  const driverChartData = {
    labels:
      driverData.length > 0
        ? driverData.map((x) => x.driverName)
        : ["No data"],
    datasets: [
      {
        label: "Completed",
        data:
          driverData.length > 0 ? driverData.map((x) => x.count) : [0],
        ...barColors,
      },
    ],
  };

  const monthlyChartData = {
    labels:
      monthlyData.length > 0
        ? monthlyData.map((x) => x.period)
        : ["No data"],
    datasets: [
      {
        label: "Requests",
        data:
          monthlyData.length > 0
            ? monthlyData.map((x) => x.count)
            : [0],
        ...lineColors,
        tension: 0.25,
      },
    ],
  };

  const axisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
    scales: {
      x: {
        ticks: { maxRotation: 45, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="container-fluid py-4 px-3">
      <h4 className="mb-4 text-secondary">Reports &amp; Analytics</h4>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <h6 className="text-muted mb-2">Pickup status distribution</h6>
          <div style={{ height: 320 }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <h6 className="text-muted mb-2">Area-wise pickup requests</h6>
          <div style={{ height: 320 }}>
            <Bar data={areaChartData} options={axisOptions} />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <h6 className="text-muted mb-2">Driver performance (completed pickups)</h6>
          <div style={{ height: 320 }}>
            <Bar data={driverChartData} options={axisOptions} />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <h6 className="text-muted mb-2">Monthly pickup trend (by request date)</h6>
          <div style={{ height: 320 }}>
            <Line data={monthlyChartData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
