import { useEffect, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  ClipboardList,
  ImageIcon,
  Lock,
  Navigation,
  Circle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const getArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

const formatStatus = (status) => {
  if (!status) return "Assigned";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
};

const statusSteps = [
  {
    key: "ASSIGNED",
    label: "Assigned",
  },
  {
    key: "ACCEPTED",
    label: "Accepted",
  },
  {
    key: "ON_THE_WAY",
    label: "On The Way",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    key: "COMPLETED",
    label: "Completed",
  },
  {
    key: "CUSTOMER_CONFIRMED",
    label: "Confirmed",
  },
  {
    key: "CLOSED",
    label: "Closed",
  },
];

const statusOrder = {
  ASSIGNED: 0,
  ACCEPTED: 1,
  ON_THE_WAY: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CUSTOMER_CONFIRMED: 5,
  CLOSED: 6,
};

const evidenceTypeStyles = {
  BEFORE: "bg-blue-100 text-blue-700",
  DURING: "bg-amber-100 text-amber-700",
  AFTER: "bg-green-100 text-green-700",
  DOCUMENT: "bg-slate-100 text-slate-700",
};

const CustomerWorkOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        orderResponse,
        logsResponse,
        evidenceResponse,
      ] = await Promise.all([
        api.get(`/work-orders/${id}/`),
        api.get("/work-logs/"),
        api.get("/work-evidence/"),
      ]);

      const currentOrder = orderResponse.data;

      setOrder(currentOrder);

      const allLogs = getArray(logsResponse.data);
      const allEvidence = getArray(evidenceResponse.data);

      setWorkLogs(
        allLogs
          .filter(
            (log) =>
              String(log.work_order) === String(id)
          )
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )
      );

      setEvidence(
        allEvidence
          .filter(
            (item) =>
              String(item.work_order) === String(id)
          )
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load work order."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadData();
  }, [id]);

  // ============================================================
  // CUSTOMER CONFIRM COMPLETION
  // ============================================================

  const confirmCompletion = async () => {
    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      await api.post(
        `/work-orders/${id}/confirm/`
      );

      setSuccess(
        "Work completion successfully confirmed."
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to confirm work completion."
      );
    } finally {
      setConfirming(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw
          className="animate-spin text-blue-600"
          size={30}
        />
      </div>
    );
  }

  // ============================================================
  // ERROR WITHOUT ORDER
  // ============================================================

  if (error && !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() =>
            navigate("/customer/work-orders")
          }
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Work Orders
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // ============================================================
  // RELATED DATA
  // ============================================================

  const serviceRequest =
    order.service_request_details || {};

  const worker =
    order.worker_details || null;

  const status =
    order.status || "ASSIGNED";

  const canConfirm =
    status === "COMPLETED";

  const currentStatusIndex =
    statusOrder[status] ?? 0;

  const latitude =
    serviceRequest.location_latitude;

  const longitude =
    serviceRequest.location_longitude;

  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    latitude !== "" &&
    longitude !== "";

  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : null;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <button
          onClick={() =>
            navigate("/customer/work-orders")
          }
          className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Work Orders
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm text-slate-500">
              {order.work_order_number ||
                `WO-${String(order.id).padStart(
                  4,
                  "0"
                )}`}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {serviceRequest.title ||
                "Service Work Order"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Service Request{" "}
              {serviceRequest.request_number ||
                `#${order.service_request}`}
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
            {formatStatus(status)}
          </span>
        </div>
      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          STATUS PROGRESS
      ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">
            Work Progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track the current progress of your service.
          </p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[720px] items-start">
            {statusSteps.map((step, index) => {
              const completed =
                currentStatusIndex >= index;

              const active =
                step.key === status;

              return (
                <div
                  key={step.key}
                  className="flex flex-1 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                        completed
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-slate-400"
                      } ${
                        active
                          ? "ring-4 ring-blue-100"
                          : ""
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Circle size={15} />
                      )}
                    </div>

                    <p
                      className={`mt-2 text-center text-xs font-medium ${
                        active
                          ? "text-blue-700"
                          : completed
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>

                  {index < statusSteps.length - 1 && (
                    <div
                      className={`mt-4 h-0.5 flex-1 ${
                        currentStatusIndex > index
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ====================================================
            MAIN
        ==================================================== */}

        <div className="space-y-6 lg:col-span-2">

          {/* ==================================================
              SERVICE DETAILS
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ClipboardList size={20} />
              </div>

              <h2 className="font-semibold text-slate-900">
                Service Details
              </h2>
            </div>

            <h3 className="font-medium text-slate-900">
              {serviceRequest.title ||
                "Service Request"}
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {serviceRequest.description ||
                "No description provided."}
            </p>

            <div className="mt-5 flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Service Location
                </p>

                <p className="text-sm font-medium text-slate-800">
                  {serviceRequest.address ||
                    "Address not provided"}
                </p>

                {hasCoordinates && (
                  <p className="mt-1 text-xs text-slate-400">
                    {latitude}, {longitude}
                  </p>
                )}

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Navigation size={14} />
                    Open Location in Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================
              SCHEDULE
          ================================================== */}

          {order.scheduled_at && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <Clock
                  size={21}
                  className="mt-0.5 text-blue-600"
                />

                <div>
                  <h2 className="font-semibold text-blue-900">
                    Scheduled Service
                  </h2>

                  <p className="mt-1 text-sm text-blue-700">
                    {formatDate(order.scheduled_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              WORK LOGS
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">
                Work Updates
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Updates recorded during the service.
              </p>
            </div>

            {workLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Clock
                  className="mx-auto mb-3 text-slate-300"
                  size={35}
                />

                <p className="text-sm text-slate-500">
                  No work updates added yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-blue-50 p-2 text-blue-600">
                        <Clock size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {log.log_type && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                              {formatStatus(
                                log.log_type
                              )}
                            </span>
                          )}

                          {log.created_at && (
                            <span className="text-xs text-slate-400">
                              {formatDate(
                                log.created_at
                              )}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {log.notes ||
                            log.description ||
                            log.work_description ||
                            "Work update recorded."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==================================================
              EVIDENCE
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <ImageIcon
                  size={20}
                  className="text-blue-600"
                />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Work Evidence
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Photos and documents uploaded during the service.
                  </p>
                </div>
              </div>
            </div>

            {evidence.length === 0 ? (
              <div className="p-8 text-center">
                <ImageIcon
                  className="mx-auto mb-3 text-slate-300"
                  size={35}
                />

                <p className="text-sm text-slate-500">
                  No work evidence uploaded yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {evidence.map((item) => {
                  const evidenceType =
                    item.evidence_type || "DURING";

                  const isImage =
                    typeof item.file === "string" &&
                    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(
                      item.file
                    );

                  return (
                    <div
                      key={item.id}
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {/* Image preview */}
                        {isImage && item.file && (
                          <a
                            href={item.file}
                            target="_blank"
                            rel="noreferrer"
                            className="block shrink-0"
                          >
                            <img
                              src={item.file}
                              alt={`${evidenceType} evidence`}
                              className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                            />
                          </a>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                evidenceTypeStyles[
                                  evidenceType
                                ] ||
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {formatStatus(
                                evidenceType
                              )}
                            </span>

                            {item.created_at && (
                              <span className="text-xs text-slate-400">
                                {formatDate(
                                  item.created_at
                                )}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          )}

                          {item.file && (
                            <a
                              href={item.file}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <ImageIcon size={14} />
                              View Evidence
                            </a>
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

        {/* ====================================================
            SIDE INFORMATION
        ==================================================== */}

        <div className="space-y-6">

          {/* ==================================================
              WORKER
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Assigned Worker
            </h2>

            {worker ? (
              <div className="space-y-4">

                <div className="flex gap-3">
                  <User
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Name
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {worker.name ||
                        worker.username ||
                        "Assigned worker"}
                    </p>
                  </div>
                </div>

                {worker.employee_id && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Employee ID
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {worker.employee_id}
                    </p>
                  </div>
                )}

                {worker.phone && (
                  <div className="flex gap-3">
                    <Phone
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div>
                      <p className="text-xs text-slate-500">
                        Phone
                      </p>

                      <a
                        href={`tel:${worker.phone}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {worker.phone}
                      </a>
                    </div>
                  </div>
                )}

                {worker.email && (
                  <div className="flex gap-3">
                    <Mail
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div>
                      <p className="text-xs text-slate-500">
                        Email
                      </p>

                      <p className="break-all text-sm font-medium text-slate-800">
                        {worker.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No worker assigned.
              </p>
            )}
          </div>

          {/* ==================================================
              WORK ORDER INFORMATION
          ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Work Order Information
            </h2>

            <div className="space-y-4">

              <div className="flex gap-3">
                <ClipboardList
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Work Order
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {order.work_order_number ||
                      `WO-${String(order.id).padStart(
                        4,
                        "0"
                      )}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Created
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(
                      order.created_at
                    )}
                  </p>
                </div>
              </div>

              {order.scheduled_at && (
                <div className="flex gap-3">
                  <Clock
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-500"
                  />

                  <div>
                    <p className="text-xs text-slate-500">
                      Scheduled
                    </p>

                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(
                        order.scheduled_at
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Address
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {serviceRequest.address ||
                      "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              CUSTOMER CONFIRMATION
          ================================================== */}

          {canConfirm && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">
                    Service Completed
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    The worker has marked this service as completed.
                    Please confirm the work after checking the service.
                  </p>

                  <button
                    onClick={confirmCompletion}
                    disabled={confirming}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {confirming ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirm Completion
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              CONFIRMED
          ================================================== */}

          {status === "CUSTOMER_CONFIRMED" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={22}
                  className="text-green-600"
                />

                <div>
                  <h3 className="font-semibold text-green-800">
                    Completion Confirmed
                  </h3>

                  <p className="mt-1 text-sm text-green-700">
                    You have confirmed the completed service.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              CLOSED
          ================================================== */}

          {status === "CLOSED" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Lock
                  size={22}
                  className="text-slate-600"
                />

                <div>
                  <h3 className="font-semibold text-slate-800">
                    Work Order Closed
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    This service work order has been completely closed.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CustomerWorkOrderDetails;