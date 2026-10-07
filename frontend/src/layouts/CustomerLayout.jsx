import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Check,
  CheckCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PlatformAnnouncement from "../components/PlatformAnnouncement";

const menuItems = [
  {
    label: "Dashboard",
    path: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Requests",
    path: "/customer/service-requests",
    icon: ClipboardList,
  },
  {
    label: "My Work Orders",
    path: "/customer/work-orders",
    icon: Briefcase,
  },
  {
    label: "Notifications",
    path: "/customer/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    path: "/customer/profile",
    icon: User,
  },
  {
    label: "Help & Support",
    path: "/customer/support",
    icon: ExternalLink,
  },
];

const CustomerLayout = ({ children }) => {
  const {
    user,
    logout,
    platformSettings,
  } = useAuth();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(
        (notification) => !notification.is_read
      ).length
    : 0;

  /*
   * ---------------------------------------------------------
   * LOAD EXISTING NOTIFICATIONS
   * ---------------------------------------------------------
   */
  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const response = await api.get("/notifications/");

      const data = response.data;

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (Array.isArray(data?.results)) {
        setNotifications(data.results);
      } else {
        console.error(
          "Unexpected notifications response:",
          data
        );

        setNotifications([]);
      }
    } catch (error) {
      console.error(
        "Failed to load customer notifications:",
        error
      );

      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * WEBSOCKET CONNECTION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let stopped = false;

    const connectWebSocket = async () => {
      try {
        const tokenResponse = await api.post(
          "/ws-ticket/"
        );

        const ticket = tokenResponse.data.ticket;

        if (!ticket || stopped) {
          return;
        }

        const protocol =
          window.location.protocol === "https:"
            ? "wss:"
            : "ws:";

        const host =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
            ? `${window.location.hostname}:8000`
            : window.location.host;

        const wsUrl =
          `${protocol}//${host}` +
          `/ws/notifications/?ticket=${encodeURIComponent(
            ticket
          )}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log(
            "Customer notification WebSocket connected."
          );

          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const notification = JSON.parse(
              event.data
            );

            setNotifications((previous) => {
              if (!Array.isArray(previous)) {
                return [notification];
              }

              const exists = previous.some(
                (item) =>
                  item.id === notification.id
              );

              if (exists) {
                return previous;
              }

              return [
                notification,
                ...previous,
              ];
            });
          } catch (error) {
            console.error(
              "Invalid notification WebSocket message:",
              error
            );
          }
        };

        socket.onerror = (error) => {
          console.error(
            "Customer notification WebSocket error:",
            error
          );
        };

        socket.onclose = () => {
          setWsConnected(false);

          if (!stopped) {
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, 5000);
          }
        };
      } catch (error) {
        console.error(
          "Failed to create WebSocket ticket:",
          error
        );

        setWsConnected(false);

        if (!stopped) {
          reconnectTimer = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      }
    };

    loadNotifications();
    connectWebSocket();

    return () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }

      setWsConnected(false);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * MARK ONE NOTIFICATION AS READ
   * ---------------------------------------------------------
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await api.post(
        `/notifications/${notificationId}/read/`
      );

      const updatedNotification =
        response.data;

      setNotifications((previous) => {
        if (!Array.isArray(previous)) {
          return [updatedNotification];
        }

        return previous.map((notification) =>
          notification.id === notificationId
            ? updatedNotification
            : notification
        );
      });
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * MARK ALL NOTIFICATIONS AS READ
   * ---------------------------------------------------------
   */
  const markAllAsRead = async () => {
    if (!Array.isArray(notifications)) {
      return;
    }

    const unreadNotifications =
      notifications.filter(
        (notification) => !notification.is_read
      );

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map(
          (notification) =>
            api.post(
              `/notifications/${notification.id}/read/`
            )
        )
      );

      setNotifications((previous) => {
        if (!Array.isArray(previous)) {
          return [];
        }

        return previous.map((notification) => ({
          ...notification,
          is_read: true,
        }));
      });
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );

      loadNotifications();
    }
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /*
   * ---------------------------------------------------------
   * FORMAT NOTIFICATION TIME
   * ---------------------------------------------------------
   */
  const formatNotificationTime = (createdAt) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Mobile overlay */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-950 text-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">

          <div>

            <h1 className="text-xl font-bold tracking-wide">
              {platformSettings?.platform?.name ||
                "SEIYALAM"}
            </h1>

            <p className="text-xs text-slate-400">
              Customer Portal
            </p>

          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 p-4">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() =>
                  setSidebarOpen(false)
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >

                <Icon size={19} />

                <span>
                  {item.label}
                </span>

                {item.label ===
                  "Notifications" &&
                  unreadCount > 0 && (
                    <span className="ml-auto flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}

              </NavLink>
            );

          })}

        </nav>

        {/* User section */}

        <div className="border-t border-slate-800 p-4">

          <div className="mb-3 rounded-lg bg-slate-900 p-3">

            <p className="truncate text-sm font-semibold">
              {user?.username ||
                "Customer"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {user?.email ||
                "Customer account"}
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >

            <LogOut size={19} />

            Logout

          </button>

        </div>

      </aside>

      {/* Main */}

      <div className="lg:ml-64">

        {/* Top navbar */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">

          {/* Mobile menu */}

          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="ml-auto flex items-center gap-3">

            {/* Notification button */}

            <div className="relative">

              <button
                onClick={() =>
                  setNotificationOpen(
                    (previous) =>
                      !previous
                  )
                }
                className="relative rounded-lg p-2.5 text-slate-600 transition hover:bg-slate-100"
                title="Notifications"
              >

                <Bell size={21} />

                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}

              </button>

              {/* Notification dropdown */}

              {notificationOpen && (
                <div className="fixed left-4 right-4 top-16 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-[380px]">

                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

                    <div>

                      <h3 className="text-sm font-bold text-slate-800">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>

                    </div>

                    <div className="flex items-center gap-1">

                      <button
                        onClick={loadNotifications}
                        disabled={
                          notificationLoading
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                        title="Refresh"
                      >

                        <RefreshCw
                          size={16}
                          className={
                            notificationLoading
                              ? "animate-spin"
                              : ""
                          }
                        />

                      </button>

                      {unreadCount > 0 && (
                        <button
                          onClick={
                            markAllAsRead
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                          title="Mark all as read"
                        >
                          <CheckCheck size={17} />
                        </button>
                      )}

                    </div>

                  </div>

                  {/* Notification list */}

                  <div className="max-h-[420px] overflow-y-auto">

                    {notificationLoading &&
                      notifications.length ===
                        0 && (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          Loading notifications...
                        </div>
                      )}

                    {!notificationLoading &&
                      notifications.length ===
                        0 && (
                        <div className="px-4 py-10 text-center">

                          <Bell
                            size={28}
                            className="mx-auto mb-2 text-slate-300"
                          />

                          <p className="text-sm font-medium text-slate-600">
                            No notifications
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            You are all caught up.
                          </p>

                        </div>
                      )}

                    {notifications.map(
                      (notification) => (
                        <div
                          key={notification.id}
                          className={`border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${
                            !notification.is_read
                              ? "bg-blue-50/60"
                              : "bg-white"
                          }`}
                        >

                          <div className="flex gap-3">

                            <div
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                notification.is_read
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              <Bell size={17} />
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <p
                                  className={`text-sm ${
                                    notification.is_read
                                      ? "font-medium text-slate-700"
                                      : "font-bold text-slate-900"
                                  }`}
                                >
                                  {notification.title}
                                </p>

                                {!notification.is_read && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                )}

                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {notification.message}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">

                                <p className="text-[11px] text-slate-400">
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </p>

                                {!notification.is_read && (
                                  <button
                                    onClick={() =>
                                      markAsRead(
                                        notification.id
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                                  >

                                    <Check size={13} />

                                    Mark read

                                  </button>
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                  {/* Footer */}

                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">

                    <button
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate(
                          "/customer/notifications"
                        );
                      }}
                      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      View All Notifications
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* User */}

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-800">
                {user?.username ||
                  "Customer"}
              </p>

              <p className="text-xs text-slate-500">
                Customer
              </p>

            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <User size={18} />
            </div>

          </div>

        </header>

        {/* Breadcrumb */}

        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <span>
              {platformSettings?.platform?.name ||
                "SEIYALAM"}
            </span>

            <ChevronRight size={15} />

            <span className="font-medium text-slate-800">
              Customer Portal
            </span>

            <span
              className={`ml-auto hidden items-center gap-1.5 text-xs sm:flex ${
                wsConnected
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >

              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              {wsConnected
                ? "Live notifications"
                : "Connecting..."}

            </span>

          </div>

        </div>

        {/* Page */}

<main className="p-4 sm:p-6">

  <PlatformAnnouncement />

  {children}

</main>

      </div>

      {/* Notification backdrop */}

      {notificationOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() =>
            setNotificationOpen(false)
          }
        />
      )}

    </div>
  );
};

export default CustomerLayout;