import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  MapPin,
  Bell,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const WorkerDashboard = () => {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [workOrdersResponse, notificationsResponse] =
        await Promise.all([
          api.get("/work-orders/my/"),
          api.get("/notifications/"),
        ]);

      const orders = getArray(workOrdersResponse.data);
      const notificationList = getArray(
        notificationsResponse.data
      );

      console.log("Worker work orders:", orders);
      console.log("Worker notifications:", notificationList);

      setWorkOrders(orders);
      setNotifications(notificationList);
    } catch (err) {
      console.error("Worker dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load worker dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const total = workOrders.length;

    const pendingStatuses = [
      "ASSIGNED",
      "ACCEPTED",
      "ON_THE_WAY",
    ];

    const pending = workOrders.filter((order) =>
      pendingStatuses.includes(order.status)
    ).length;

    const inProgress = workOrders.filter(
      (order) => order.status === "IN_PROGRESS"
    ).length;

    const completedStatuses = [
      "COMPLETED",
      "CUSTOMER_CONFIRMED",
      "CLOSED",
    ];

    const completed = workOrders.filter((order) =>
      completedStatuses.includes(order.status)
    ).length;

    return [
      {
        title: "Total Jobs",
        value: total,
        icon: Briefcase,
      },
      {
        title: "Pending Jobs",
        value: pending,
        icon: Clock,
      },
      {
        title: "In Progress",
        value: inProgress,
        icon: MapPin,
      },
      {
        title: "Completed",
        value: completed,
        icon: CheckCircle2,
      },
    ];
  }, [workOrders]);

  const recentOrders = useMemo(() => {
    return [...workOrders]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [workOrders]);

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            className="animate-spin"
            size={20}
          />
          Loading dashboard...
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

        <button
          onClick={loadDashboard}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Worker Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your assigned service work.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Work Orders */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Work Orders
              </h2>

              <p className="text-xs text-slate-500">
                Your latest assigned jobs
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/worker/work-orders")
              }
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View All
              <ArrowRight size={16} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                No work orders assigned yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const serviceRequest =
                  order.service_request_details || {};

                const title =
                  serviceRequest.title ||
                  "Work Order";

                const requestNumber =
                  serviceRequest.request_number ||
                  "Service Request";

                const isClosed =
                  order.status === "CLOSED";

                return (
                  <button
                    key={order.id}
                    onClick={() =>
                      navigate(
                        `/worker/work-orders/${order.id}`
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          {order.work_order_number ||
                            `WO-${order.id}`}
                        </span>

                        <span>•</span>

                        <span>
                          {requestNumber}
                        </span>

                        <span>•</span>

                        <span
                          className={
                            isClosed
                              ? "font-medium text-slate-600"
                              : "font-medium text-blue-600"
                          }
                        >
                          {formatStatus(order.status)}
                        </span>
                      </div>
                    </div>

                    {isClosed ? (
                      <Lock
                        size={17}
                        className="shrink-0 text-slate-400"
                      />
                    ) : (
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-slate-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell
                size={18}
                className="text-slate-600"
              />

              <h2 className="font-semibold text-slate-900">
                Notifications
              </h2>
            </div>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                No recent notifications.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentNotifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className="px-5 py-4"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {notification.title ||
                        "Notification"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {notification.message ||
                        notification.description ||
                        ""}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          <button
            onClick={() =>
              navigate("/worker/notifications")
            }
            className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Notifications
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;