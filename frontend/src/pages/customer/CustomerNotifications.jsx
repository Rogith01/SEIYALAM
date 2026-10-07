import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import api from "../../services/api";

const getArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

const CustomerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications/");

      setNotifications(getArray(response.data));
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

  const isRead = (item) =>
    item.is_read === true || item.read === true;

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);

      setNotifications((previous) =>
        previous.map((item) =>
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
      (item) => !isRead(item)
    );

    try {
      await Promise.all(
        unread.map((item) =>
          api.post(`/notifications/${item.id}/read/`)
        )
      );

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
          read: true,
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Unable to mark all notifications as read.");
    }
  };

  const unreadCount = notifications.filter(
    (item) => !isRead(item)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated about your service requests.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadNotifications}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw
              className="mx-auto mb-3 animate-spin text-blue-600"
              size={28}
            />

            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell
              className="mx-auto mb-3 text-slate-300"
              size={42}
            />

            <p className="font-medium text-slate-700">
              No notifications
            </p>

            <p className="mt-1 text-sm text-slate-500">
              You are all caught up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const read = isRead(notification);

              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-5 ${
                    !read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div
                    className={`mt-1 rounded-full p-2 ${
                      read
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Bell size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <h2 className="font-medium text-slate-900">
                          {notification.title ||
                            notification.message ||
                            "Notification"}
                        </h2>

                        {notification.title &&
                          notification.message && (
                            <p className="mt-1 text-sm text-slate-600">
                              {notification.message}
                            </p>
                          )}
                      </div>

                      {!read && (
                        <span className="h-fit rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                          New
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ""}
                      </span>

                      {!read && (
                        <button
                          onClick={() =>
                            markRead(notification.id)
                          }
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;