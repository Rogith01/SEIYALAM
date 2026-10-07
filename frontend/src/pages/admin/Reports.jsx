import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  ClipboardList,
  Briefcase,
  Users,
} from "lucide-react";

import api from "../../services/api";

function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/admin/");

      setDashboard(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

          <p className="text-sm text-slate-500">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <BarChart3 size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Reports
            </h1>

            <p className="text-sm text-slate-500">
              Organization activity overview
            </p>
          </div>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <ReportCard
          icon={ClipboardList}
          title="Service Requests"
          total={dashboard.service_requests.total}
          description={`${dashboard.service_requests.new} new`}
        />

        <ReportCard
          icon={Briefcase}
          title="Work Orders"
          total={dashboard.work_orders.total}
          description={`${dashboard.work_orders.in_progress} in progress`}
        />

        <ReportCard
          icon={Users}
          title="Workers"
          total={dashboard.workers.total}
          description={`${dashboard.workers.available} available`}
        />
      </div>

      {/* Service Request Report */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Service Request Report
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current distribution of service requests
        </p>

        <div className="mt-6 space-y-4">
          <ReportRow
            label="New"
            value={dashboard.service_requests.new}
            total={dashboard.service_requests.total}
          />

          <ReportRow
            label="Assigned"
            value={dashboard.service_requests.assigned}
            total={dashboard.service_requests.total}
          />

          <ReportRow
            label="In Progress"
            value={dashboard.service_requests.in_progress}
            total={dashboard.service_requests.total}
          />

          <ReportRow
            label="Completed"
            value={dashboard.service_requests.completed}
            total={dashboard.service_requests.total}
          />

          <ReportRow
            label="Closed"
            value={dashboard.service_requests.closed}
            total={dashboard.service_requests.total}
          />
        </div>
      </div>

      {/* Work Order Report */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Work Order Report
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current distribution of work orders
        </p>

        <div className="mt-6 space-y-4">
          <ReportRow
            label="Assigned"
            value={dashboard.work_orders.assigned}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="Accepted"
            value={dashboard.work_orders.accepted}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="On the Way"
            value={dashboard.work_orders.on_the_way}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="In Progress"
            value={dashboard.work_orders.in_progress}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="Completed"
            value={dashboard.work_orders.completed}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="Customer Confirmed"
            value={dashboard.work_orders.customer_confirmed}
            total={dashboard.work_orders.total}
          />

          <ReportRow
            label="Closed"
            value={dashboard.work_orders.closed}
            total={dashboard.work_orders.total}
          />
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  total,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {total}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value, total }) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-800">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-700 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

export default Reports;