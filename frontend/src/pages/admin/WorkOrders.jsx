import { useEffect, useState } from "react";
import {
  Briefcase,
  Search,
  RefreshCw,
  XCircle,
  Plus,
  UserRound,
  ClipboardList,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function WorkOrders() {
  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [workOrders, setWorkOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    service_request: "",
    worker: "",
    scheduled_at: "",
    notes: "",
  });

  // ============================================================
  // FETCH WORK ORDERS
  // ============================================================

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      const response = await api.get("/work-orders/", {
        params,
      });

      setWorkOrders(
        response.data.results || response.data
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH WORKERS
  // ============================================================

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/workers/");

      const data =
        response.data.results || response.data;

      setWorkers(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load workers.");
    }
  };

  // ============================================================
  // FETCH NEW SERVICE REQUESTS
  // ============================================================

  const fetchServiceRequests = async () => {
    try {
      const response = await api.get(
        "/service-requests/",
        {
          params: {
            status: "NEW",
          },
        }
      );

      const data =
        response.data.results || response.data;

      setServiceRequests(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load service requests.");
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchWorkOrders();
    fetchWorkers();
    fetchServiceRequests();
  }, []);

  // ============================================================
  // STATUS FILTER
  // ============================================================

  useEffect(() => {
    fetchWorkOrders();
  }, [status]);

  // ============================================================
  // OPEN CREATE FORM
  // ============================================================

  const openCreateForm = async () => {
    setError("");
    setSuccess("");

    setFormData({
      service_request: "",
      worker: "",
      scheduled_at: "",
      notes: "",
    });

    await Promise.all([
      fetchWorkers(),
      fetchServiceRequests(),
    ]);

    setShowCreateForm(true);
  };

  // ============================================================
  // CLOSE CREATE FORM
  // ============================================================

  const closeCreateForm = () => {
    if (formLoading) {
      return;
    }

    setShowCreateForm(false);

    setFormData({
      service_request: "",
      worker: "",
      scheduled_at: "",
      notes: "",
    });

    setError("");
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // GET WORKER SKILLS
  // ============================================================

  const getWorkerSkills = (worker) => {
    if (!worker?.skills) {
      return [];
    }

    if (!Array.isArray(worker.skills)) {
      return [];
    }

    return worker.skills
      .map((skill) => {
        if (typeof skill === "string") {
          return skill;
        }

        if (
          typeof skill === "object" &&
          skill !== null
        ) {
          return (
            skill.name ||
            skill.title ||
            skill.skill_name ||
            ""
          );
        }

        return "";
      })
      .filter(Boolean);
  };

  // ============================================================
  // WORKER AVAILABILITY
  // ============================================================

  const getAvailabilityClass = (availability) => {
    switch (availability) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700";

      case "BUSY":
        return "bg-orange-100 text-orange-700";

      case "OFFLINE":
        return "bg-slate-100 text-slate-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getAvailabilityLabel = (availability) => {
    if (!availability) {
      return "Unknown";
    }

    return availability.replaceAll("_", " ");
  };

  // ============================================================
  // SORT WORKERS
  // AVAILABLE → BUSY → OFFLINE
  // ============================================================

  const sortedWorkers = [...workers].sort((a, b) => {
    const priority = {
      AVAILABLE: 1,
      BUSY: 2,
      OFFLINE: 3,
    };

    const aPriority =
      priority[a.availability] || 4;

    const bPriority =
      priority[b.availability] || 4;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return (a.username || "").localeCompare(
      b.username || ""
    );
  });

  // ============================================================
  // CREATE WORK ORDER
  // ============================================================

  const createWorkOrder = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.service_request) {
      setError(
        "Please select a service request."
      );
      return;
    }

    if (!formData.worker) {
      setError("Please select a worker.");
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        service_request: Number(
          formData.service_request
        ),
        worker: Number(formData.worker),

        scheduled_at: formData.scheduled_at
          ? new Date(
              formData.scheduled_at
            ).toISOString()
          : null,

        notes: formData.notes.trim(),
      };

      await api.post(
        "/work-orders/",
        payload
      );

      setSuccess(
        "Work order created and worker assigned successfully."
      );

      setFormData({
        service_request: "",
        worker: "",
        scheduled_at: "",
        notes: "",
      });

      setShowCreateForm(false);

      await Promise.all([
        fetchWorkOrders(),
        fetchServiceRequests(),
      ]);
    } catch (err) {
      console.error(err);

      const responseData =
        err.response?.data;

      if (responseData?.service_request) {
        setError(
          Array.isArray(
            responseData.service_request
          )
            ? responseData.service_request[0]
            : responseData.service_request
        );
      } else if (responseData?.worker) {
        setError(
          Array.isArray(responseData.worker)
            ? responseData.worker[0]
            : responseData.worker
        );
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError(
          "Unable to create work order."
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ============================================================
  // CLOSE WORK ORDER
  // ============================================================

  const closeWorkOrder = async (workOrder) => {
    const confirmed = window.confirm(
      `Are you sure you want to close ${workOrder.work_order_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(workOrder.id);
      setError("");
      setSuccess("");

      await api.post(
        `/work-orders/${workOrder.id}/close/`
      );

      setSuccess(
        `${workOrder.work_order_number} closed successfully.`
      );

      await fetchWorkOrders();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to close work order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (workOrderStatus) => {
    switch (workOrderStatus) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-700";

      case "ACCEPTED":
        return "bg-purple-100 text-purple-700";

      case "ON_THE_WAY":
        return "bg-orange-100 text-orange-700";

      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CUSTOMER_CONFIRMED":
        return "bg-emerald-100 text-emerald-700";

      case "CLOSED":
        return "bg-slate-100 text-slate-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <Briefcase size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Work Orders
            </h1>

            <p className="text-sm text-slate-500">
              Monitor and manage assigned work
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchWorkOrders}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Plus size={17} />
            Create Work Order
          </button>
        </div>
      </div>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          CREATE WORK ORDER FORM
      ====================================================== */}

      {showCreateForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <ClipboardList size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create Work Order
                </h2>

                <p className="text-sm text-slate-500">
                  Assign a suitable worker to a new service request
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCreateForm}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <XCircle size={20} />
            </button>
          </div>

          <form onSubmit={createWorkOrder}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Service Request */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Service Request
                </label>

                <select
                  name="service_request"
                  value={
                    formData.service_request
                  }
                  onChange={handleFormChange}
                  disabled={formLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="">
                    Select Service Request
                  </option>

                  {serviceRequests.map(
                    (request) => (
                      <option
                        key={request.id}
                        value={request.id}
                      >
                        {request.request_number} -{" "}
                        {request.title}
                      </option>
                    )
                  )}
                </select>

                {serviceRequests.length ===
                  0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No new service requests are
                    available for assignment.
                  </p>
                )}
              </div>

              {/* Worker */}

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserRound size={16} />
                  Worker
                </label>

                <select
                  name="worker"
                  value={formData.worker}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="">
                    Select Worker
                  </option>

                  {sortedWorkers.map(
                    (worker) => {
                      const skills =
                        getWorkerSkills(
                          worker
                        );

                      const skillText =
                        skills.length > 0
                          ? skills.join(", ")
                          : "No skills added";

                      const availability =
                        getAvailabilityLabel(
                          worker.availability
                        );

                      return (
                        <option
                          key={worker.id}
                          value={worker.id}
                        >
                          {worker.username}
                          {worker.employee_id
                            ? ` - ${worker.employee_id}`
                            : ""}
                          {" | "}
                          {skillText}
                          {" | "}
                          {availability}
                        </option>
                      );
                    }
                  )}
                </select>

                {/* Worker information preview */}

                {formData.worker && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {(() => {
                      const selectedWorker =
                        workers.find(
                          (worker) =>
                            String(
                              worker.id
                            ) ===
                            String(
                              formData.worker
                            )
                        );

                      if (!selectedWorker) {
                        return null;
                      }

                      const skills =
                        getWorkerSkills(
                          selectedWorker
                        );

                      return (
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  selectedWorker.username
                                }
                              </p>

                              {selectedWorker.employee_id && (
                                <p className="text-xs text-slate-500">
                                  Employee ID:{" "}
                                  {
                                    selectedWorker.employee_id
                                  }
                                </p>
                              )}
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAvailabilityClass(
                                selectedWorker.availability
                              )}`}
                            >
                              {getAvailabilityLabel(
                                selectedWorker.availability
                              )}
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Skills
                            </p>

                            {skills.length >
                            0 ? (
                              <div className="flex flex-wrap gap-2">
                                {skills.map(
                                  (
                                    skill,
                                    index
                                  ) => (
                                    <span
                                      key={`${skill}-${index}`}
                                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                                    >
                                      {skill}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">
                                No skills added to this worker.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {workers.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    No workers found. Create a
                    worker first.
                  </p>
                )}
              </div>

              {/* Scheduled At */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Scheduled Date & Time
                </label>

                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={
                    formData.scheduled_at
                  }
                  onChange={handleFormChange}
                  disabled={formLoading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>

              {/* Notes */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Optional notes for the worker"
                  disabled={formLoading}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Buttons */}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateForm}
                disabled={formLoading}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  formLoading ||
                  workers.length === 0 ||
                  serviceRequests.length === 0
                }
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {formLoading ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Work Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  fetchWorkOrders();
                }
              }}
              placeholder="Search work orders..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="">
              All Statuses
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="ACCEPTED">
              Accepted
            </option>

            <option value="ON_THE_WAY">
              On the Way
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CUSTOMER_CONFIRMED">
              Customer Confirmed
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>

          <button
            onClick={fetchWorkOrders}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading work orders...
              </p>
            </div>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <Briefcase
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No work orders found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Create a work order to assign a worker.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Work Order
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Request
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Worker
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Scheduled
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {workOrders.map(
                  (workOrder) => (
                    <tr
                      key={workOrder.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {
                            workOrder.work_order_number
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {workOrder
                            .service_request_details
                            ?.request_number ||
                            workOrder.service_request}
                        </p>

                        {workOrder
                          .service_request_details
                          ?.title && (
                          <p className="mt-1 text-xs text-slate-400">
                            {
                              workOrder
                                .service_request_details
                                .title
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {workOrder
                          .worker_details?.name ||
                          workOrder
                            .worker_details
                            ?.username ||
                          workOrder.worker ||
                          "Not assigned"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            workOrder.status
                          )}`}
                        >
                          {workOrder.status?.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {workOrder.scheduled_at
                          ? new Date(
                              workOrder.scheduled_at
                            ).toLocaleString(
                              undefined,
                              {
                                timeZone:
                                  platformTimezone,
                              }
                            )
                          : "Not scheduled"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {workOrder.created_at
                          ? new Date(
                              workOrder.created_at
                            ).toLocaleDateString(
                              undefined,
                              {
                                timeZone:
                                  platformTimezone,
                              }
                            )
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        {workOrder.status ===
                          "CUSTOMER_CONFIRMED" && (
                          <button
                            onClick={() =>
                              closeWorkOrder(
                                workOrder
                              )
                            }
                            disabled={
                              actionLoading ===
                              workOrder.id
                            }
                            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading ===
                            workOrder.id ? (
                              <>
                                <RefreshCw
                                  size={14}
                                  className="animate-spin"
                                />
                                Closing...
                              </>
                            ) : (
                              <>
                                <XCircle
                                  size={14}
                                />
                                Close Work Order
                              </>
                            )}
                          </button>
                        )}

                        {workOrder.status ===
                          "CLOSED" && (
                          <span className="text-xs font-medium text-slate-500">
                            Closed
                          </span>
                        )}

                        {[
                          "CUSTOMER_CONFIRMED",
                          "CLOSED",
                        ].includes(
                          workOrder.status
                        ) === false && (
                          <span className="text-xs text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkOrders;