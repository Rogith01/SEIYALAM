import {
  Bell,
  Check,
  RefreshCw,
  CheckCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import api from "../../services/api";

function WorkerNotifications() {
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setNotifications(data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
                read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(
      (item) =>
        item.is_read === false ||
        item.is_read === undefined && item.read === false ||
        item.read === false
    );

    for (const item of unread) {
      try {
        await api.post(
          `/notifications/${item.id}/read/`
        );
      } catch (err) {
        console.error(err);
      }
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read: true,
      }))
    );
  };

  const isUnread = (notification) => {
    if (notification.is_read !== undefined) {
      return !notification.is_read;
    }

    return notification.read === false;
  };

  const unreadCount = notifications.filter(
    isUnread
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated about your work.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadNotifications}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Unread count */}
      {unreadCount > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          You have{" "}
          <strong>{unreadCount}</strong>{" "}
          unread notification
          {unreadCount !== 1 ? "s" : ""}.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notifications */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <RefreshCw
                size={20}
                className="animate-spin"
              />
              Loading notifications...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell
              size={42}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 font-semibold text-slate-800">
              No notifications
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              You're all caught up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const unread = isUnread(notification);

              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-5 transition ${
                    unread
                      ? "bg-blue-50/40"
                      : "bg-white"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      unread
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Bell size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <h3 className="font-medium text-slate-900">
                        {notification.title ||
                          notification.notification_type ||
                          "Notification"}
                      </h3>

                      <span className="text-xs text-slate-400">
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ""}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {notification.message ||
                        notification.description ||
                        ""}
                    </p>

                    {unread && (
                      <button
                        onClick={() =>
                          markRead(notification.id)
                        }
                        className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                      >
                        <Check size={14} />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkerNotifications;