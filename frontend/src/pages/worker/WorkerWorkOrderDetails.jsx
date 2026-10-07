import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Play,
  Navigation,
  Upload,
  FileText,
  RefreshCw,
  Send,
  Image as ImageIcon,
  User,
  Phone,
  Mail,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function WorkerWorkOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [order, setOrder] = useState(null);
  const [logs, setLogs] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [logText, setLogText] = useState("");

  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDescription, setEvidenceDescription] =
    useState("");

  const [evidenceType, setEvidenceType] =
    useState("DURING");

  // ============================================================
  // LOAD WORK ORDER DATA
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

      setOrder(orderResponse.data);

      const logData = Array.isArray(logsResponse.data)
        ? logsResponse.data
        : logsResponse.data.results || [];

      const evidenceData = Array.isArray(
        evidenceResponse.data
      )
        ? evidenceResponse.data
        : evidenceResponse.data.results || [];

      setLogs(
        logData.filter(
          (log) =>
            String(
              log.work_order?.id || log.work_order
            ) === String(id)
        )
      );

      setEvidence(
        evidenceData.filter(
          (item) =>
            String(
              item.work_order?.id || item.work_order
            ) === String(id)
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

  useEffect(() => {
    loadData();
  }, [id]);

  // ============================================================
  // WORK ORDER ACTION
  // ============================================================

  const performAction = async (action) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.post(
        `/work-orders/${id}/${action}/`
      );

      setSuccess(
        `Work order successfully updated: ${action.replaceAll(
          "-",
          " "
        )}`
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          `Unable to perform ${action}.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // ADD WORK LOG
  // ============================================================

  const addWorkLog = async (e) => {
    e.preventDefault();

    if (!logText.trim()) {
      setError("Please enter a work log.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await api.post("/work-logs/", {
        work_order: Number(id),
        log_type: "NOTE",
        notes: logText.trim(),
      });

      setLogText("");

      setSuccess(
        "Work log added successfully."
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.notes?.[0] ||
          "Unable to add work log."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // UPLOAD EVIDENCE
  // ============================================================

  const uploadEvidence = async (e) => {
    e.preventDefault();

    if (!evidenceFile) {
      setError("Please select a file.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("work_order", id);
      formData.append("file", evidenceFile);

      // IMPORTANT:
      // Send the selected evidence type to backend.
      formData.append(
        "evidence_type",
        evidenceType
      );

      if (evidenceDescription.trim()) {
        formData.append(
          "description",
          evidenceDescription.trim()
        );
      }

      await api.post(
        "/work-evidence/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setEvidenceFile(null);
      setEvidenceDescription("");
      setEvidenceType("DURING");

      setSuccess(
        "Evidence uploaded successfully."
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to upload evidence."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // NEXT ACTION
  // ============================================================

  const getNextAction = () => {
    if (!order) {
      return null;
    }

    switch (order.status) {
      case "ASSIGNED":
        return {
          label: "Accept Job",
          action: "accept",
          icon: CheckCircle2,
        };

      case "ACCEPTED":
        return {
          label: "Mark On The Way",
          action: "on-the-way",
          icon: Navigation,
        };

      case "ON_THE_WAY":
        return {
          label: "Start Work",
          action: "start",
          icon: Play,
        };

      case "IN_PROGRESS":
        return {
          label: "Complete Work",
          action: "complete",
          icon: CheckCircle2,
        };

      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            className="animate-spin"
            size={20}
          />

          Loading work order...
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">
          Work order could not be found.
        </p>
      </div>
    );
  }

  // ============================================================
  // SERVICE REQUEST DETAILS
  // ============================================================

  const serviceRequest =
    order.service_request_details || null;

  const customer =
    serviceRequest?.customer || null;

  const title =
    serviceRequest?.title ||
    order.title ||
    `Work Order #${order.id}`;

  const description =
    serviceRequest?.description ||
    order.description ||
    "No description available.";

  const address =
    serviceRequest?.address ||
    order.address ||
    "Not provided";

  const customerName =
    customer?.name ||
    customer?.username ||
    "Customer";

  const customerPhone =
    customer?.phone || "";

  const customerEmail =
    customer?.email || "";

  return (
    <div className="space-y-6">

      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        onClick={() =>
          navigate("/worker/work-orders")
        }
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={18} />

        Back to Work Orders
      </button>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          MAIN WORK ORDER INFORMATION
      ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start">

          <div>

            <p className="text-sm text-slate-500">
              Work Order #
              {order.work_order_number ||
                order.id}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {title}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>

          </div>

          <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {order.status}
          </span>

        </div>

        {/* ====================================================
            DETAILS
        ==================================================== */}

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* REQUEST NUMBER */}

          <div>
            <p className="text-xs text-slate-400">
              Service Request
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {serviceRequest?.request_number ||
                `#${serviceRequest?.id || "-"}`}
            </p>
          </div>

          {/* ASSIGNED DATE */}

          <div>
            <p className="text-xs text-slate-400">
              Assigned Date
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {order.created_at
                ? new Date(
                    order.created_at
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      timeZone:
                        platformTimezone,
                    }
                  )
                : "-"}
            </p>
          </div>

          {/* CUSTOMER */}

          <div>
            <p className="text-xs text-slate-400">
              Customer
            </p>

            <p className="mt-1 flex items-center gap-2 font-medium text-slate-800">
              <User size={15} />

              {customerName}
            </p>
          </div>

          {/* LOCATION */}

          <div>
            <p className="text-xs text-slate-400">
              Location
            </p>

            <p className="mt-1 flex items-start gap-1 font-medium text-slate-800">
              <MapPin
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>
                {address}
              </span>
            </p>
          </div>

        </div>

        {/* ====================================================
            CUSTOMER CONTACT
        ==================================================== */}

        {(customerPhone || customerEmail) && (
          <div className="border-t border-slate-200 p-5">

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Customer Contact
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">

              {customerPhone && (
                <a
                  href={`tel:${customerPhone}`}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <Phone size={16} />

                  {customerPhone}
                </a>
              )}

              {customerEmail && (
                <a
                  href={`mailto:${customerEmail}`}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <Mail size={16} />

                  {customerEmail}
                </a>
              )}

            </div>

          </div>
        )}

        {/* ====================================================
            ACTION
        ==================================================== */}

        {nextAction && (
          <div className="border-t border-slate-200 p-5">

            <button
              disabled={actionLoading}
              onClick={() =>
                performAction(
                  nextAction.action
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >

              {actionLoading ? (
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <nextAction.icon size={18} />
              )}

              {actionLoading
                ? "Updating..."
                : nextAction.label}

            </button>

          </div>
        )}

      </div>

      {/* ======================================================
          WORK LOG
      ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-5">

          <div className="flex items-center gap-2">

            <FileText size={19} />

            <h2 className="font-semibold text-slate-900">
              Work Progress
            </h2>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            Add updates about the work performed.
          </p>

        </div>

        <form
          onSubmit={addWorkLog}
          className="border-b border-slate-200 p-5"
        >

          <textarea
            value={logText}
            onChange={(e) =>
              setLogText(e.target.value)
            }
            rows={4}
            placeholder="Describe the work completed, issue found, parts used, etc."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-500"
          />

          <button
            type="submit"
            disabled={actionLoading}
            className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Send size={16} />

            Add Work Log
          </button>

        </form>

        <div className="divide-y divide-slate-100">

          {logs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No work logs added yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-5"
              >

                <p className="text-sm text-slate-800">
                  {log.notes ||
                    log.description ||
                    log.message ||
                    "Work log"}
                </p>

                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">

                  <Clock size={13} />

                  {log.created_at
                    ? new Date(
                        log.created_at
                      ).toLocaleString(
                        undefined,
                        {
                          timeZone:
                            platformTimezone,
                        }
                      )
                    : ""}

                </p>

              </div>
            ))
          )}

        </div>

      </div>

      {/* ======================================================
          WORK EVIDENCE
      ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-5">

          <div className="flex items-center gap-2">

            <ImageIcon size={19} />

            <h2 className="font-semibold text-slate-900">
              Work Evidence
            </h2>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            Upload photos or other evidence of the work.
          </p>

        </div>

        {/* UPLOAD FORM */}

        <form
          onSubmit={uploadEvidence}
          className="border-b border-slate-200 p-5"
        >

          <div className="space-y-4">

            {/* FILE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Evidence File
              </label>

              <input
                type="file"
                onChange={(e) =>
                  setEvidenceFile(
                    e.target.files?.[0] ||
                      null
                  )
                }
                disabled={actionLoading}
                className="block w-full rounded-lg border border-slate-200 p-2 text-sm"
              />
            </div>

            {/* EVIDENCE TYPE */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Evidence Type
              </label>

              <select
                value={evidenceType}
                onChange={(e) =>
                  setEvidenceType(
                    e.target.value
                  )
                }
                disabled={actionLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="BEFORE">
                  Before Work
                </option>

                <option value="DURING">
                  During Work
                </option>

                <option value="AFTER">
                  After Work
                </option>

                <option value="DOCUMENT">
                  Document
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>

              <input
                type="text"
                value={evidenceDescription}
                onChange={(e) =>
                  setEvidenceDescription(
                    e.target.value
                  )
                }
                disabled={actionLoading}
                placeholder="Evidence description (optional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* UPLOAD */}

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {actionLoading ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Upload size={16} />
              )}

              {actionLoading
                ? "Uploading..."
                : "Upload Evidence"}

            </button>

          </div>

        </form>

        {/* EXISTING EVIDENCE */}

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">

          {evidence.length === 0 ? (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              No evidence uploaded yet.
            </p>
          ) : (
            evidence.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-200"
              >

                {/* FILE */}

                {item.file ? (
                  <a
                    href={item.file}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >

                    <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-500">

                      <ImageIcon size={32} />

                    </div>

                  </a>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400">
                    No file
                  </div>
                )}

                {/* DETAILS */}

                <div className="p-3">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.evidence_type
                      ? item.evidence_type.replaceAll(
                          "_",
                          " "
                        )
                      : "Evidence"}
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {item.description ||
                      "Work evidence"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString(
                          undefined,
                          {
                            timeZone:
                              platformTimezone,
                          }
                        )
                      : ""}
                  </p>

                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default WorkerWorkOrderDetails;