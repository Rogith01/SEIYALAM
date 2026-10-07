import { useEffect, useState } from "react";
import {
  ClipboardList,
  Briefcase,
  Users,
  UserCheck,
  Bell,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

import api from "../../services/api";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/dashboard/admin/");
        setDashboard(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle
            size={22}
            className="text-red-600"
          />

          <p className="font-medium text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Service Requests",
      value: dashboard.service_requests.total,
      description: `${dashboard.service_requests.new} new request(s)`,
      icon: ClipboardList,
    },
    {
      title: "Work Orders",
      value: dashboard.work_orders.total,
      description: `${dashboard.work_orders.in_progress} in progress`,
      icon: Briefcase,
    },
    {
      title: "Total Workers",
      value: dashboard.workers.total,
      description: `${dashboard.workers.available} available`,
      icon: Users,
    },
    {
      title: "Available Workers",
      value: dashboard.workers.available,
      description: `${dashboard.workers.busy} currently busy`,
      icon: UserCheck,
    },
    {
      title: "Notifications",
      value: dashboard.notifications,
      description: "System notifications",
      icon: Bell,
    },
    {
      title: "Audit Logs",
      value: dashboard.audit_logs,
      description: "Recorded activities",
      icon: FileText,
    },
  ];

  const activeWorkOrders =
    dashboard.work_orders.assigned +
    dashboard.work_orders.accepted +
    dashboard.work_orders.on_the_way +
    dashboard.work_orders.in_progress;

  const pendingRequests =
    dashboard.service_requests.new +
    dashboard.service_requests.assigned;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor your organization's service operations and workforce.
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-700">
          {dashboard.company}
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Summary */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <SummaryCard
          title="Pending Requests"
          value={pendingRequests}
          description="Requests waiting for assignment"
          icon={Clock}
        />

        <SummaryCard
          title="Active Work"
          value={activeWorkOrders}
          description="Work orders currently being handled"
          icon={Activity}
        />

        <SummaryCard
          title="Completed Work"
          value={dashboard.work_orders.completed}
          description="Work orders awaiting confirmation"
          icon={CheckCircle2}
        />

      </div>

      {/* Status Sections */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Service Requests */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Service Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current request status
            </p>
          </div>

          <div className="space-y-4">

            <StatusRow
              label="New"
              value={dashboard.service_requests.new}
            />

            <StatusRow
              label="Assigned"
              value={dashboard.service_requests.assigned}
            />

            <StatusRow
              label="In Progress"
              value={dashboard.service_requests.in_progress}
            />

            <StatusRow
              label="Completed"
              value={dashboard.service_requests.completed}
            />

            <StatusRow
              label="Closed"
              value={dashboard.service_requests.closed}
            />

          </div>
        </div>

        {/* Work Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Work Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current work order status
            </p>
          </div>

          <div className="space-y-4">

            <StatusRow
              label="Assigned"
              value={dashboard.work_orders.assigned}
            />

            <StatusRow
              label="Accepted"
              value={dashboard.work_orders.accepted}
            />

            <StatusRow
              label="On the Way"
              value={dashboard.work_orders.on_the_way}
            />

            <StatusRow
              label="In Progress"
              value={dashboard.work_orders.in_progress}
            />

            <StatusRow
              label="Completed"
              value={dashboard.work_orders.completed}
            />

            <StatusRow
              label="Closed"
              value={dashboard.work_orders.closed}
            />

          </div>
        </div>

      </div>

      {/* Worker Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Workforce Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current worker availability
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <WorkerStatusCard
            label="Total Workers"
            value={dashboard.workers.total}
            icon={Users}
          />

          <WorkerStatusCard
            label="Available"
            value={dashboard.workers.available}
            icon={UserCheck}
          />

          <WorkerStatusCard
            label="Busy"
            value={dashboard.workers.busy}
            icon={Briefcase}
          />

        </div>

      </div>

    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">

      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-slate-400" />

        <span className="text-sm text-slate-600">
          {label}
        </span>
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
          <Icon size={21} />
        </div>

      </div>

    </div>
  );
}

function WorkerStatusCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-white p-3 text-slate-600 shadow-sm">
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;