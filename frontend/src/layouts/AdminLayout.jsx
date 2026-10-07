import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Users,
  UserRound,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  FileText,
  Check,
  ExternalLink,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";
import PlatformAnnouncement from "../components/PlatformAnnouncement";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";


function AdminLayout({ children }) {

  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    logout,
    platformSettings,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // ========================================================
  // NOTIFICATION STATE
  // ========================================================

  const [notifications, setNotifications] =
    useState([]);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const websocketRef = useRef(null);

  const reconnectTimeoutRef =
    useRef(null);

  const notificationRef =
    useRef(null);

  // ========================================================
  // WEBSOCKET STATUS
  // ========================================================

  const [websocketStatus, setWebsocketStatus] =
    useState("connecting");


  // ========================================================
  // MENU ITEMS
  // ========================================================

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Service Requests",
      path: "/admin/service-requests",
      icon: ClipboardList,
    },
    {
      name: "Work Orders",
      path: "/admin/work-orders",
      icon: Briefcase,
    },
    {
      name: "Workers",
      path: "/admin/workers",
      icon: Users,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: UserRound,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: BarChart3,
    },
    {
      name: "Skills",
      path: "/admin/skills",
      icon: Wrench,
    },
    {
      name: "Audit Logs",
      path: "/admin/audit-logs",
      icon: FileText,
    },
    {
      name: "Notifications",
      path: "/admin/notifications",
      icon: Bell,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
    {
      name: "Help & Support",
      path: "/admin/support",
      icon: ExternalLink,
    },
  ];


  // ========================================================
  // NAVIGATION
  // ========================================================

  const handleNavigation = (path) => {

    navigate(path);

    setSidebarOpen(false);

    setNotificationOpen(false);

  };


  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout = () => {

    if (websocketRef.current) {

      websocketRef.current.close();

      websocketRef.current = null;

    }

    if (reconnectTimeoutRef.current) {

      clearTimeout(
        reconnectTimeoutRef.current
      );

      reconnectTimeoutRef.current = null;

    }

    setWebsocketStatus("disconnected");

    logout();

    navigate("/login");

  };


  // ========================================================
  // ACTIVE MENU
  // ========================================================

  const isActive = (path) => {

    return location.pathname === path;

  };


  // ========================================================
  // LOAD NOTIFICATIONS
  // ========================================================

  const loadNotifications = async () => {

    try {

      setNotificationLoading(true);

      const response = await api.get(
        "/notifications/"
      );

      setNotifications(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );

    } catch (error) {

      console.error(
        "Failed to load notifications:",
        error
      );

    } finally {

      setNotificationLoading(false);

    }

  };


  // ========================================================
  // REQUEST WEBSOCKET TICKET
  // ========================================================

  const getWebSocketTicket = async () => {

    const response = await api.post(
      "/ws-ticket/"
    );

    return response.data.ticket;

  };


  // ========================================================
  // CREATE WEBSOCKET URL
  // ========================================================

  const getWebSocketUrl = (ticket) => {

    const apiBaseUrl =
      api.defaults.baseURL ||
      "http://127.0.0.1:8000/api";

    const parsedUrl =
      new URL(apiBaseUrl);

    const protocol =
      parsedUrl.protocol === "https:"
        ? "wss:"
        : "ws:";

    return (
      `${protocol}//${parsedUrl.host}` +
      `/ws/notifications/?ticket=${encodeURIComponent(ticket)}`
    );

  };


  // ========================================================
  // CONNECT WEBSOCKET
  // ========================================================

  const connectWebSocket = async () => {

    try {

      if (
        !localStorage.getItem(
          "access_token"
        )
      ) {

        setWebsocketStatus(
          "disconnected"
        );

        return;

      }

      setWebsocketStatus("connecting");


      // Close previous connection if necessary

      if (
        websocketRef.current &&
        (
          websocketRef.current.readyState ===
            WebSocket.OPEN ||
          websocketRef.current.readyState ===
            WebSocket.CONNECTING
        )
      ) {

        return;

      }


      const ticket =
        await getWebSocketTicket();

      const websocketUrl =
        getWebSocketUrl(ticket);

      const socket =
        new WebSocket(websocketUrl);

      websocketRef.current = socket;


      // ----------------------------------------------------
      // OPEN
      // ----------------------------------------------------

      socket.onopen = () => {

        setWebsocketStatus(
          "connected"
        );

        console.log(
          "Notification WebSocket connected."
        );

      };


      // ----------------------------------------------------
      // MESSAGE
      // ----------------------------------------------------

      socket.onmessage = (event) => {

        try {

          const notification =
            JSON.parse(event.data);

          console.log(
            "New notification:",
            notification
          );


          setNotifications(
            (previousNotifications) => {

              const alreadyExists =
                previousNotifications.some(
                  (item) =>
                    item.id ===
                    notification.id
                );

              if (alreadyExists) {

                return previousNotifications;

              }

              return [
                notification,
                ...previousNotifications,
              ];

            }
          );

        } catch (error) {

          console.error(
            "Invalid notification message:",
            error
          );

        }

      };


      // ----------------------------------------------------
      // ERROR
      // ----------------------------------------------------

      socket.onerror = (error) => {

        setWebsocketStatus(
          "disconnected"
        );

        console.error(
          "Notification WebSocket error:",
          error
        );

      };


      // ----------------------------------------------------
      // CLOSE
      // ----------------------------------------------------

      socket.onclose = () => {

        setWebsocketStatus(
          "disconnected"
        );

        console.log(
          "Notification WebSocket disconnected."
        );

        websocketRef.current = null;


        // Reconnect after 5 seconds

        if (
          localStorage.getItem(
            "access_token"
          )
        ) {

          setWebsocketStatus(
            "connecting"
          );

          reconnectTimeoutRef.current =
            setTimeout(() => {

              connectWebSocket();

            }, 5000);

        }

      };

    } catch (error) {

      setWebsocketStatus(
        "disconnected"
      );

      console.error(
        "Failed to connect notification WebSocket:",
        error
      );


      // Retry after 5 seconds

      if (
        localStorage.getItem(
          "access_token"
        )
      ) {

        setWebsocketStatus(
          "connecting"
        );

        reconnectTimeoutRef.current =
          setTimeout(() => {

            connectWebSocket();

          }, 5000);

      }

    }

  };


  // ========================================================
  // MARK NOTIFICATION AS READ
  // ========================================================

  const markNotificationAsRead = async (
    notificationId
  ) => {

    try {

      await api.post(
        `/notifications/${notificationId}/read/`
      );


      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification
          )
      );

    } catch (error) {

      console.error(
        "Failed to mark notification as read:",
        error
      );

    }

  };


  // ========================================================
  // HANDLE NOTIFICATION CLICK
  // ========================================================

  const handleNotificationClick = async (
    notification
  ) => {

    if (!notification.is_read) {

      await markNotificationAsRead(
        notification.id
      );

    }

    setNotificationOpen(false);

    navigate(
      "/admin/notifications"
    );

  };


  // ========================================================
  // MARK ALL CURRENT NOTIFICATIONS AS READ
  // ========================================================

  const markAllAsRead = async () => {

    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.is_read
      );

    for (
      const notification
      of unreadNotifications
    ) {

      try {

        await api.post(
          `/notifications/${notification.id}/read/`
        );

      } catch (error) {

        console.error(
          "Failed to mark notification as read:",
          error
        );

      }

    }


    setNotifications(
      (previousNotifications) =>
        previousNotifications.map(
          (notification) => ({
            ...notification,
            is_read: true,
          })
        )
    );

  };


  // ========================================================
  // INITIAL NOTIFICATION SETUP
  // ========================================================

  useEffect(() => {

    if (!user) {

      return;

    }


    setWebsocketStatus("connecting");

    loadNotifications();

    connectWebSocket();


    return () => {

      if (reconnectTimeoutRef.current) {

        clearTimeout(
          reconnectTimeoutRef.current
        );

        reconnectTimeoutRef.current =
          null;

      }


      if (websocketRef.current) {

        websocketRef.current.close();

        websocketRef.current =
          null;

      }

    };

  }, [user?.id]);


  // ========================================================
  // CLOSE NOTIFICATION DROPDOWN
  // WHEN CLICKING OUTSIDE
  // ========================================================

  useEffect(() => {

    const handleClickOutside = (
      event
    ) => {

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {

        setNotificationOpen(false);

      }

    };


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  // ========================================================
  // UNREAD COUNT
  // ========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  // ========================================================
  // RECENT NOTIFICATIONS
  // ========================================================

  const recentNotifications =
    notifications.slice(0, 5);


  // ========================================================
  // FORMAT DATE
  // ========================================================

  const formatNotificationDate = (
    createdAt
  ) => {

    if (!createdAt) {

      return "";

    }

    const date =
      new Date(createdAt);

    if (Number.isNaN(date.getTime())) {

      return "";

    }

    return date.toLocaleString(
      [],
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );

  };


  // ========================================================
  // WEBSOCKET STATUS UI
  // ========================================================

  const websocketStatusConfig = {

    connected: {
      label: "Live",
      dotClass: "bg-green-500",
      textClass: "text-green-600",
    },

    connecting: {
      label: "Connecting",
      dotClass: "bg-amber-500",
      textClass: "text-amber-600",
    },

    disconnected: {
      label: "Offline",
      dotClass: "bg-red-500",
      textClass: "text-red-600",
    },

  };

  const currentWebsocketStatus =
    websocketStatusConfig[
      websocketStatus
    ] ||
    websocketStatusConfig.connecting;


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="min-h-screen bg-slate-100">


      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      {sidebarOpen && (

        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />

      )}


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >


        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">

          <div>

            <h1 className="text-xl font-bold tracking-wide">
              {platformSettings?.platform?.name || "SEIYALAM"}
            </h1>

            <p className="text-xs text-slate-400">
              Admin Portal
            </p>

          </div>


          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >

            <X size={20} />

          </button>

        </div>


        {/* Navigation */}

        <nav className="p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>


          <div className="space-y-1">

            {menuItems.map((item) => {

              const Icon = item.icon;

              const active =
                isActive(item.path);


              return (

                <button
                  key={item.path}
                  onClick={() =>
                    handleNavigation(
                      item.path
                    )
                  }
                  className={`
                    flex w-full items-center gap-3 rounded-lg px-3 py-3
                    text-sm font-medium transition
                    ${
                      active
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >

                  <Icon size={19} />

                  <span>
                    {item.name}
                  </span>

                </button>

              );

            })}

          </div>

        </nav>


        {/* Bottom user section */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">

              {
                user?.username
                  ?.charAt(0)
                  .toUpperCase() || "A"
              }

            </div>


            <div className="min-w-0">

              <p className="truncate text-sm font-medium text-white">

                {user?.username || "Admin"}

              </p>


              <p className="text-xs text-slate-400">
                Administrator
              </p>

            </div>

          </div>


          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
          >

            <LogOut size={18} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* ==================================================
          MAIN AREA
      ================================================== */}

      <div className="lg:pl-64">


        {/* ==================================================
            TOP NAVBAR
        ================================================== */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">


          {/* Left */}

          <div className="flex items-center gap-3">


            {/* Mobile menu */}

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >

              <Menu size={22} />

            </button>


            <div>

              <p className="text-sm font-medium text-slate-800">
                Admin Portal
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Service Management Platform
              </p>

            </div>

          </div>


          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="flex items-center gap-4">


            {/* ==================================================
                WEBSOCKET STATUS
            ================================================== */}

            <div
              className={`
                hidden items-center gap-1.5
                text-xs font-medium
                sm:flex
                ${currentWebsocketStatus.textClass}
              `}
              title={
                websocketStatus === "connected"
                  ? "Real-time notifications connected"
                  : websocketStatus === "connecting"
                    ? "Connecting to real-time notifications"
                    : "Real-time notifications disconnected"
              }
            >

              <span
                className={`
                  h-2 w-2 rounded-full
                  ${currentWebsocketStatus.dotClass}
                  ${
                    websocketStatus ===
                    "connecting"
                      ? "animate-pulse"
                      : ""
                  }
                `}
              />

              <span>
                {currentWebsocketStatus.label}
              </span>

            </div>


            {/* ==================================================
                NOTIFICATION
            ================================================== */}

            <div
              ref={notificationRef}
              className="relative"
            >


              <button
                onClick={() =>
                  setNotificationOpen(
                    (previous) =>
                      !previous
                  )
                }
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Notifications"
              >

                <Bell size={20} />


                {/* Unread badge */}

                {unreadCount > 0 && (

                  <span
                    className="
                      absolute -right-1 -top-1
                      flex min-h-5 min-w-5
                      items-center justify-center
                      rounded-full
                      bg-red-500
                      px-1
                      text-[10px]
                      font-bold
                      text-white
                    "
                  >

                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}

                  </span>

                )}

              </button>


              {/* ==================================================
                  NOTIFICATION DROPDOWN
              ================================================== */}

              {notificationOpen && (

                <div
                  className="
                    absolute right-0 top-12 z-50
                    w-[350px] max-w-[calc(100vw-2rem)]
                    overflow-hidden rounded-xl
                    border border-slate-200
                    bg-white
                    shadow-xl
                  "
                >


                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

                    <div>

                      <h3 className="text-sm font-semibold text-slate-800">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-400">

                        {unreadCount === 0
                          ? "All caught up"
                          : `${unreadCount} unread`}

                      </p>

                    </div>


                    {unreadCount > 0 && (

                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >

                        <Check size={14} />

                        Mark all read

                      </button>

                    )}

                  </div>


                  {/* Notification list */}

                  <div className="max-h-[380px] overflow-y-auto">


                    {notificationLoading ? (

                      <div className="px-4 py-8 text-center text-sm text-slate-400">

                        Loading notifications...

                      </div>

                    ) : recentNotifications.length === 0 ? (

                      <div className="px-4 py-10 text-center">

                        <Bell
                          size={28}
                          className="mx-auto mb-2 text-slate-300"
                        />

                        <p className="text-sm font-medium text-slate-500">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          You're all caught up.
                        </p>

                      </div>

                    ) : (

                      recentNotifications.map(
                        (notification) => (

                          <button
                            key={
                              notification.id
                            }
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`
                              flex w-full gap-3
                              border-b border-slate-100
                              px-4 py-3
                              text-left
                              transition
                              hover:bg-slate-50
                              ${
                                !notification.is_read
                                  ? "bg-slate-50"
                                  : "bg-white"
                              }
                            `}
                          >


                            {/* Status indicator */}

                            <div className="mt-1 flex-shrink-0">

                              <span
                                className={`
                                  block h-2.5 w-2.5
                                  rounded-full
                                  ${
                                    !notification.is_read
                                      ? "bg-red-500"
                                      : "bg-slate-300"
                                  }
                                `}
                              />

                            </div>


                            {/* Content */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <p
                                  className={`
                                    text-sm
                                    ${
                                      !notification.is_read
                                        ? "font-semibold text-slate-800"
                                        : "font-medium text-slate-600"
                                    }
                                  `}
                                >

                                  {
                                    notification.title
                                  }

                                </p>

                              </div>


                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">

                                {
                                  notification.message
                                }

                              </p>


                              <p className="mt-1 text-[10px] text-slate-400">

                                {
                                  formatNotificationDate(
                                    notification.created_at
                                  )
                                }

                              </p>

                            </div>

                          </button>

                        )
                      )

                    )}

                  </div>


                  {/* Footer */}

                  <div className="border-t border-slate-200 p-2">

                    <button
                      onClick={() =>
                        handleNavigation(
                          "/admin/notifications"
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >

                      View all notifications

                      <ExternalLink size={14} />

                    </button>

                  </div>

                </div>

              )}

            </div>


            {/* Divider */}

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />


            {/* User */}

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">

                {
                  user?.username
                    ?.charAt(0)
                    .toUpperCase() || "A"
                }

              </div>


              <div className="hidden sm:block">

                <p className="text-sm font-medium text-slate-800">

                  {user?.username || "Admin"}

                </p>


                <p className="text-xs text-slate-400">
                  Admin
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

          <main className="p-4 sm:p-6">

            <PlatformAnnouncement />

            {children}

          </main>

      </div>

    </div>

  );

}


export default AdminLayout;