import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  BriefcaseBusiness,
  MapPin,
  FileText,
  ChevronRight,
  Phone,
  UserRound,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const statusStyles = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-indigo-100 text-indigo-700",
  ON_THE_WAY: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CUSTOMER_CONFIRMED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const WorkerWorkOrders = () => {
  const navigate = useNavigate();

  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchWorkOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/work-orders/my/");

      setWorkOrders(response.data.results || response.data || []);
    } catch (err) {
      console.error("Failed to load work orders:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your work orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const filteredWorkOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return workOrders.filter((order) => {
      const serviceRequest = order.service_request_details || {};

      const title = serviceRequest.title || "";
      const description = serviceRequest.description || "";
      const requestNumber =
        serviceRequest.request_number || "";
      const workOrderNumber =
        order.work_order_number || "";
      const address = serviceRequest.address || "";

      const customer =
        serviceRequest.customer || {};

      const customerName =
        customer.name ||
        customer.username ||
        "";

      const customerPhone =
        customer.phone || "";

      const matchesSearch =
        !searchText ||
        title.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText) ||
        requestNumber.toLowerCase().includes(searchText) ||
        workOrderNumber.toLowerCase().includes(searchText) ||
        address.toLowerCase().includes(searchText) ||
        customerName.toLowerCase().includes(searchText) ||
        customerPhone.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workOrders, search, statusFilter]);

  const openWorkOrder = (id) => {
    navigate(`/worker/work-orders/${id}`);
  };

  const openGoogleMaps = (latitude, longitude) => {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }

    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const statusOptions = [
    "ALL",
    "ASSIGNED",
    "ACCEPTED",
    "ON_THE_WAY",
    "IN_PROGRESS",
    "COMPLETED",
    "CUSTOMER_CONFIRMED",
    "CLOSED",
  ];

  const formatDate = (date) => {
    if (!date) return "Not available";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          timeZone: platformTimezone,
        }
      );
    } catch {
      return "Not available";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Work Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage the work orders assigned to you.
          </p>
        </div>

        <button
          onClick={() => fetchWorkOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Search + Filter */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search work orders..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "ALL"
                  ? "All Statuses"
                  : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <RefreshCw
              size={18}
              className="animate-spin"
            />

            Loading work orders...
          </div>
        </div>
      ) : filteredWorkOrders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <BriefcaseBusiness
              size={28}
              className="text-slate-500"
            />
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            No work orders found
          </h2>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            {search ||
            statusFilter !== "ALL"
              ? "Try changing your search or status filter."
              : "There are currently no work orders assigned to you."}
          </p>
        </div>
      ) : (
        /* Work Order Cards */

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredWorkOrders.map((order) => {
            const serviceRequest =
              order.service_request_details || {};

            const customer =
              serviceRequest.customer || {};

            const title =
              serviceRequest.title ||
              "Untitled Service Request";

            const description =
              serviceRequest.description ||
              "No description available.";

            const requestNumber =
              serviceRequest.request_number ||
              "Not available";

            const address =
              serviceRequest.address ||
              "Location not provided";

            const customerName =
              customer.name ||
              customer.username ||
              "Customer";

            const customerPhone =
              customer.phone || "";

            const latitude =
              serviceRequest.location_latitude;

            const longitude =
              serviceRequest.location_longitude;

            const hasLocation =
              latitude !== null &&
              latitude !== undefined &&
              longitude !== null &&
              longitude !== undefined;

            const status =
              order.status || "UNKNOWN";

            const isClosed =
              status === "CLOSED";

            const statusClass =
              statusStyles[status] ||
              "bg-slate-100 text-slate-700";

            return (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Title + Status */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {description}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {formatStatus(status)}
                  </span>
                </div>

                {/* Work Order Information */}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <BriefcaseBusiness
                        size={15}
                      />
                      Work Order
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.work_order_number ||
                        "Not available"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <FileText size={15} />
                      Service Request
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {requestNumber}
                    </p>
                  </div>
                </div>

                {/* Customer */}

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <UserRound size={15} />
                    Customer
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {customerName}
                  </p>

                  {customerPhone ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {customerPhone}
                      </span>

                      <a
                        href={`tel:${customerPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                      >
                        <Phone size={14} />
                        Call Customer
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Phone number not available
                    </p>
                  )}
                </div>

                {/* Address */}

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-500"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer Address
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {address}
                      </p>
                    </div>
                  </div>

                  {/* GPS Location */}

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Shared Location
                        </p>

                        {hasLocation ? (
                          <p className="mt-1 text-xs text-slate-500">
                            GPS location available
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            Customer did not share GPS location
                          </p>
                        )}
                      </div>

                      {hasLocation && (
                        <button
                          type="button"
                          onClick={() =>
                            openGoogleMaps(
                              latitude,
                              longitude
                            )
                          }
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Navigation
                            size={14}
                          />
                          Open in Google Maps
                        </button>
                      )}
                    </div>

                    {hasLocation && (
                      <p className="mt-2 break-all text-xs text-slate-400">
                        {latitude}, {longitude}
                      </p>
                    )}
                  </div>
                </div>

                {/* Assigned Date */}

                <div className="mt-3 text-xs text-slate-400">
                  Assigned on{" "}
                  {formatDate(
                    order.created_at
                  )}
                </div>

                {/* Action */}

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    onClick={() =>
                      openWorkOrder(order.id)
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      isClosed
                        ? "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {isClosed
                      ? "View Work Order"
                      : "Open Work Order"}

                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkerWorkOrders;