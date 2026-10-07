import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Briefcase,
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

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [serviceRequests, setServiceRequests] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        serviceRequestsResponse,
        workOrdersResponse,
        notificationsResponse,
      ] = await Promise.all([
        api.get("/service-requests/my/"),
        api.get("/work-orders/my/"),
        api.get("/notifications/"),
      ]);

      const requests = getArray(
        serviceRequestsResponse.data
      );

      const orders = getArray(
        workOrdersResponse.data
      );

      const notificationList = getArray(
        notificationsResponse.data
      );

      console.log(
        "Customer service requests:",
        requests
      );

      console.log(
        "Customer work orders:",
        orders
      );

      console.log(
        "Customer notifications:",
        notificationList
      );

      setServiceRequests(requests);
      setWorkOrders(orders);
      setNotifications(notificationList);
    } catch (err) {
      console.error("Customer dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load customer dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalRequests = serviceRequests.length;

    const pendingStatuses = [
      "NEW",
      "ASSIGNED",
      "IN_PROGRESS",
    ];

    const pendingRequests = serviceRequests.filter(
      (request) =>
        pendingStatuses.includes(request.status)
    ).length;

    const completedRequests = serviceRequests.filter(
      (request) =>
        request.status === "COMPLETED" ||
        request.status === "CLOSED"
    ).length;

    const activeWorkOrders = workOrders.filter(
      (order) =>
        ![
          "CUSTOMER_CONFIRMED",
          "CLOSED",
        ].includes(order.status)
    ).length;

    return [
      {
        title: "Total Requests",
        value: totalRequests,
        icon: ClipboardList,
      },
      {
        title: "Pending Requests",
        value: pendingRequests,
        icon: Clock,
      },
      {
        title: "Completed Requests",
        value: completedRequests,
        icon: CheckCircle2,
      },
      {
        title: "Active Work Orders",
        value: activeWorkOrders,
        icon: Briefcase,
      },
    ];
  }, [serviceRequests, workOrders]);

  const recentRequests = useMemo(() => {
    return [...serviceRequests]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [serviceRequests]);

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
        <div className="text-center">
          <RefreshCw
            className="mx-auto mb-3 animate-spin text-blue-600"
            size={30}
          />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track your service requests and work progress.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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

                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icon size={23} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() =>
            navigate("/customer/service-requests")
          }
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                My Service Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create and track your service requests.
              </p>
            </div>

            <ArrowRight
              className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
              size={20}
            />
          </div>
        </button>

        <button
          onClick={() =>
            navigate("/customer/work-orders")
          }
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                My Work Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                See assigned work and current progress.
              </p>
            </div>

            <ArrowRight
              className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
              size={20}
            />
          </div>
        </button>
      </div>

      {/* Recent Service Requests */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Recent Service Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest requests
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/customer/service-requests")
            }
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All
            <ArrowRight size={16} />
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList
              className="mx-auto mb-3 text-slate-300"
              size={40}
            />

            <p className="text-sm text-slate-500">
              No service requests yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRequests.map((request) => {
              const isClosed =
                request.status === "CLOSED";

              return (
                <button
                  key={request.id}
                  onClick={() =>
                    navigate(
                      `/customer/service-requests/${request.id}`
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {request.title ||
                        `Service Request #${request.id}`}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        {request.request_number ||
                          `SR-${request.id}`}
                      </span>

                      <span>•</span>

                      <span>
                        {request.created_at
                          ? new Date(
                              request.created_at
                            ).toLocaleString()
                          : "Recently created"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isClosed
                          ? "bg-slate-100 text-slate-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {formatStatus(request.status)}
                    </span>

                    {isClosed ? (
                      <Lock
                        size={16}
                        className="text-slate-400"
                      />
                    ) : (
                      <ArrowRight
                        size={17}
                        className="text-slate-400"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Notifications
              </h2>

              <p className="text-sm text-slate-500">
                {notifications.length} recent notification
                {notifications.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
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
            navigate("/customer/notifications")
          }
          className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Notifications
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;