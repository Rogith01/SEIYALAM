import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  RefreshCw,
  CheckCheck,
} from "lucide-react";

import api from "../../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications/");

      setNotifications(
        response.data.results || response.data
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(
      (notification) => !notification.is_read
    );

    for (const notification of unread) {
      try {
        await api.post(
          `/notifications/${notification.id}/read/`
        );
      } catch (err) {
        console.error(err);
      }
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <Bell size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Notifications
            </h1>

            <p className="text-sm text-slate-500">
              Stay updated with system activity
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              <CheckCheck size={17} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Unread notifications
        </p>

        <p className="mt-1 text-3xl font-bold text-slate-800">
          {unreadCount}
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notifications */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <Bell
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No notifications
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-5 transition hover:bg-slate-50 ${
                  !notification.is_read
                    ? "bg-blue-50/40"
                    : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.is_read
                      ? "bg-slate-100 text-slate-500"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Bell size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-slate-800">
                      {notification.title}
                    </h3>

                    <span className="text-xs text-slate-400">
                      {notification.created_at
                        ? new Date(
                            notification.created_at
                          ).toLocaleString()
                        : "-"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {notification.notification_type}
                    </span>

                    {!notification.is_read && (
                      <button
                        onClick={() =>
                          markAsRead(notification.id)
                        }
                        className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        <Check size={14} />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;