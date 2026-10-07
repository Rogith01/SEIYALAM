import { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  UserRound,
  X,
  CalendarDays,
  FileText,
  CheckCircle2,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function ServiceRequests() {
  const { platformSettings } = useAuth();

  const platformTimezone =
    platformSettings?.platform?.timezone ||
    "Asia/Kolkata";

  const [requests, setRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [workerId, setWorkerId] = useState("");
  const [requiredSkillId, setRequiredSkillId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const [assigning, setAssigning] = useState(false);

  // ============================================================
  // FETCH SERVICE REQUESTS
  // ============================================================

  const fetchRequests = async () => {
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

      const response = await api.get(
        "/service-requests/",
        {
          params,
        }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setRequests(data);
      } else if (Array.isArray(data?.results)) {
        setRequests(data.results);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(
        "Service requests error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load service requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH WORKERS
  // ============================================================

  const fetchWorkers = async () => {
    try {
      setWorkersLoading(true);

      const response = await api.get(
        "/workers/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setWorkers(data);
      } else if (Array.isArray(data?.results)) {
        setWorkers(data.results);
      } else {
        setWorkers([]);
      }
    } catch (err) {
      console.error(
        "Workers error:",
        err
      );

      setModalError(
        err.response?.data?.detail ||
          "Unable to load workers."
      );
    } finally {
      setWorkersLoading(false);
    }
  };

  // ============================================================
  // FETCH SKILLS
  // ============================================================

  const fetchSkills = async () => {
    try {
      setSkillsLoading(true);

      const response = await api.get(
        "/skills/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setSkills(data);
      } else if (Array.isArray(data?.results)) {
        setSkills(data.results);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error(
        "Skills error:",
        err
      );

      setModalError(
        err.response?.data?.detail ||
          "Unable to load skills."
      );
    } finally {
      setSkillsLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchRequests();
  }, [status]);

  useEffect(() => {
    fetchSkills();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = (event) => {
    event.preventDefault();

    fetchRequests();
  };

  // ============================================================
  // GET REQUEST SKILL ID
  // ============================================================

  const getRequestSkillId = (request) => {
    if (!request?.required_skill) {
      return "";
    }

    if (
      typeof request.required_skill ===
        "object" &&
      request.required_skill !== null
    ) {
      return String(
        request.required_skill.id || ""
      );
    }

    return String(
      request.required_skill
    );
  };

  // ============================================================
  // GET REQUEST SKILL NAME
  // ============================================================

  const getRequestSkillName = (request) => {
    if (!request?.required_skill) {
      return "Not specified";
    }

    // If required_skill is already an object
    if (
      typeof request.required_skill ===
      "object"
    ) {
      return (
        request.required_skill.name ||
        request.required_skill.title ||
        request.required_skill.skill_name ||
        `Skill #${request.required_skill.id}`
      );
    }

    // If required_skill is only an ID
    const matchingSkill = skills.find(
      (skill) =>
        Number(skill.id) ===
        Number(request.required_skill)
    );

    return (
      matchingSkill?.name ||
      matchingSkill?.title ||
      matchingSkill?.skill_name ||
      `Skill #${request.required_skill}`
    );
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
  // CHECK WORKER SKILL MATCH
  // ============================================================

  const workerMatchesSkill = (worker) => {
    if (!requiredSkillId) {
      return false;
    }

    if (!worker?.skills) {
      return false;
    }

    if (!Array.isArray(worker.skills)) {
      return false;
    }

    return worker.skills.some(
      (skill) => {
        if (
          typeof skill === "object" &&
          skill !== null
        ) {
          return (
            Number(skill.id) ===
            Number(requiredSkillId)
          );
        }

        return (
          Number(skill) ===
          Number(requiredSkillId)
        );
      }
    );
  };

  // ============================================================
  // SORT WORKERS
  // ============================================================

  const sortedWorkers = [...workers].sort(
    (a, b) => {
      const aMatches =
        workerMatchesSkill(a);

      const bMatches =
        workerMatchesSkill(b);

      // Matching skill first
      if (aMatches !== bMatches) {
        return aMatches ? -1 : 1;
      }

      // Available first
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
        return (
          aPriority - bPriority
        );
      }

      return (
        a.username || ""
      ).localeCompare(
        b.username || ""
      );
    }
  );

  // ============================================================
  // OPEN ASSIGN MODAL
  // ============================================================

  const openAssignModal = async (
    request
  ) => {
    setSelectedRequest(request);

    setWorkerId("");

    setRequiredSkillId(
      getRequestSkillId(request)
    );

    setScheduledAt("");
    setNotes("");
    setModalError("");

    await Promise.all([
      fetchWorkers(),
      fetchSkills(),
    ]);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeAssignModal = () => {
    if (assigning) {
      return;
    }

    setSelectedRequest(null);
    setWorkerId("");
    setRequiredSkillId("");
    setScheduledAt("");
    setNotes("");
    setModalError("");
  };

  // ============================================================
  // SKILL CHANGE
  // ============================================================

  const handleSkillChange = (event) => {
    setRequiredSkillId(
      event.target.value
    );

    // Reset worker because skill changed
    setWorkerId("");

    setModalError("");
  };

  // ============================================================
  // ASSIGN WORKER
  // ============================================================

  const handleAssignWorker = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedRequest) {
      return;
    }

    if (!requiredSkillId) {
      setModalError(
        "Please select the required skill."
      );
      return;
    }

    if (!workerId) {
      setModalError(
        "Please select a worker."
      );
      return;
    }

    const selectedWorker =
      workers.find(
        (worker) =>
          String(worker.id) ===
          String(workerId)
      );

    if (!selectedWorker) {
      setModalError(
        "Selected worker could not be found."
      );
      return;
    }

    if (
      !workerMatchesSkill(
        selectedWorker
      )
    ) {
      setModalError(
        "The selected worker does not have the required skill."
      );
      return;
    }

    try {
      setAssigning(true);
      setModalError("");

      // ========================================================
      // STEP 1
      // SAVE REQUIRED SKILL TO SERVICE REQUEST
      // ========================================================

      await api.patch(
        `/service-requests/${selectedRequest.id}/`,
        {
          required_skill:
            Number(requiredSkillId),
        }
      );

      // ========================================================
      // STEP 2
      // CREATE WORK ORDER
      // ========================================================

      const payload = {
        service_request:
          selectedRequest.id,

        worker: Number(workerId),
      };

      if (scheduledAt) {
        payload.scheduled_at =
          scheduledAt;
      }

      if (notes.trim()) {
        payload.notes =
          notes.trim();
      }

      console.log(
        "Creating work order:",
        payload
      );

      await api.post(
        "/work-orders/",
        payload
      );

      // ========================================================
      // STEP 3
      // REFRESH REQUESTS
      // ========================================================

      await fetchRequests();

      // ========================================================
      // CLOSE MODAL
      // ========================================================

      setSelectedRequest(null);
      setWorkerId("");
      setRequiredSkillId("");
      setScheduledAt("");
      setNotes("");
    } catch (err) {
      console.error(
        "Assign worker error:",
        err
      );

      console.error(
        "Backend response:",
        JSON.stringify(
          err.response?.data,
          null,
          2
        )
      );

      const backendError =
        err.response?.data;

      if (
        typeof backendError ===
        "object"
      ) {
        const messages =
          Object.entries(
            backendError
          )
            .map(
              ([field, value]) =>
                `${field}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : value
                }`
            )
            .join(" | ");

        setModalError(
          messages ||
            "Unable to assign worker."
        );
      } else {
        setModalError(
          "Unable to assign worker."
        );
      }
    } finally {
      setAssigning(false);
    }
  };

  // ============================================================
  // STATUS COLORS
  // ============================================================

  const getStatusClass = (
    requestStatus
  ) => {
    switch (requestStatus) {
      case "NEW":
        return "bg-blue-100 text-blue-700";

      case "ASSIGNED":
        return "bg-purple-100 text-purple-700";

      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CLOSED":
        return "bg-slate-100 text-slate-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // ============================================================
  // WORKER NAME
  // ============================================================

  const getWorkerName = (worker) => {
    if (!worker) {
      return "Unknown worker";
    }

    return (
      worker.name ||
      worker.username ||
      worker.email ||
      `Worker #${worker.id}`
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 p-2 text-white">
              <ClipboardList size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Service Requests
              </h1>

              <p className="text-sm text-slate-500">
                Manage customer service requests
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchRequests}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />

          Refresh
        </button>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto]">
          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search requests..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </form>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="">
              All Statuses
            </option>

            <option value="NEW">
              New
            </option>

            <option value="ASSIGNED">
              Assigned
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>

          <button
            onClick={fetchRequests}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading requests...
              </p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <ClipboardList
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No service requests found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Request
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Required Skill
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
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
                {requests.map(
                  (request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {
                            request.request_number
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          #{request.id}
                        </p>
                      </td>

<td className="px-5 py-4">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
      <UserRound size={17} />
    </div>

    <div className="min-w-0">
      <p className="font-medium text-slate-700">
        {request.customer_details?.name ||
          request.customer_details?.username ||
          `Customer #${request.customer}`}
      </p>

      {request.customer_details?.phone && (
        <p className="mt-0.5 text-xs text-slate-400">
          {request.customer_details.phone}
        </p>
      )}
    </div>
  </div>
</td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {request.title}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {
                            request.description
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {request.required_skill ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            <Wrench
                              size={13}
                            />

                            {getRequestSkillName(
                              request
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not specified
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        <p className="truncate">
                          {request.address}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {request.status?.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {request.created_at
                          ? new Date(
                              request.created_at
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                timeZone:
                                  platformTimezone,
                              }
                            )
                          : "-"}
                      </td>

                      <td className="px-5 py-4">
                        {request.status ===
                        "NEW" ? (
                          <button
                            onClick={() =>
                              openAssignModal(
                                request
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <UserRound
                              size={15}
                            />

                            Assign Worker
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Already assigned
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

      {/* ======================================================
          ASSIGN WORKER MODAL
      ====================================================== */}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Assign Worker
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the required skill and assign a suitable worker.
                </p>
              </div>

              <button
                onClick={
                  closeAssignModal
                }
                disabled={assigning}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* REQUEST SUMMARY */}

            <div className="m-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-white">
                  <ClipboardList
                    size={18}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {
                      selectedRequest.request_number
                    }
                  </p>

                  <h3 className="mt-1 font-semibold text-slate-800">
                    {
                      selectedRequest.title
                    }
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedRequest.description
                    }
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {
                      selectedRequest.address
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR */}

            {modalError && (
              <div className="mx-6 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {modalError}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={
                handleAssignWorker
              }
              className="space-y-5 px-6 pb-6"
            >

              {/* REQUIRED SKILL */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Required Skill
                </label>

                <div className="relative">
                  <Wrench
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={
                      requiredSkillId
                    }
                    onChange={
                      handleSkillChange
                    }
                    disabled={
                      skillsLoading ||
                      assigning
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    <option value="">
                      {skillsLoading
                        ? "Loading skills..."
                        : "Select required skill"}
                    </option>

                    {skills.map(
                      (skill) => (
                        <option
                          key={skill.id}
                          value={skill.id}
                        >
                          {skill.name ||
                            skill.title ||
                            skill.skill_name ||
                            `Skill #${skill.id}`}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {!skillsLoading &&
                  skills.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No skills found. Create a skill first.
                    </p>
                  )}

                <p className="mt-2 text-xs text-slate-400">
                  This is selected by the admin based on the service request.
                </p>
              </div>

              {/* WORKER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Assign Worker
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={workerId}
                    onChange={(event) =>
                      setWorkerId(
                        event.target.value
                      )
                    }
                    disabled={
                      workersLoading ||
                      assigning ||
                      !requiredSkillId
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    <option value="">
                      {!requiredSkillId
                        ? "Select a required skill first"
                        : workersLoading
                        ? "Loading workers..."
                        : "Select a worker"}
                    </option>

                    {sortedWorkers.map(
                      (worker) => {
                        const matches =
                          workerMatchesSkill(
                            worker
                          );

                        const workerSkills =
                          getWorkerSkills(
                            worker
                          );

                        return (
                          <option
                            key={worker.id}
                            value={worker.id}
                          >
                            {matches
                              ? "✓ "
                              : ""}
                            {getWorkerName(
                              worker
                            )}
                            {worker.employee_id
                              ? ` - ${worker.employee_id}`
                              : ""}
                            {workerSkills.length
                              ? ` | ${workerSkills.join(
                                  ", "
                                )}`
                              : ""}
                            {worker.availability
                              ? ` | ${worker.availability}`
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                {requiredSkillId &&
                  !workersLoading &&
                  workers.length > 0 && (
                    <div className="mt-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2">
                      <p className="text-xs font-medium text-green-700">
                        Workers with the selected skill are shown first.
                      </p>
                    </div>
                  )}

                {!workersLoading &&
                  requiredSkillId &&
                  workers.length > 0 &&
                  !workers.some(
                    (worker) =>
                      workerMatchesSkill(
                        worker
                      )
                  ) && (
                    <p className="mt-2 text-xs text-red-600">
                      No worker currently has this skill.
                    </p>
                  )}

                {!workersLoading &&
                  workers.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No workers are available.
                    </p>
                  )}
              </div>

              {/* SELECTED WORKER PREVIEW */}

              {workerId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {(() => {
                    const selectedWorker =
                      workers.find(
                        (worker) =>
                          String(
                            worker.id
                          ) ===
                          String(workerId)
                      );

                    if (!selectedWorker) {
                      return null;
                    }

                    const workerSkills =
                      getWorkerSkills(
                        selectedWorker
                      );

                    const matches =
                      workerMatchesSkill(
                        selectedWorker
                      );

                    return (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">
                            Selected Worker
                          </p>

                          {matches ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Skill Match
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Skill Mismatch
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          <p className="text-slate-700">
                            <span className="font-medium">
                              Name:
                            </span>{" "}
                            {getWorkerName(
                              selectedWorker
                            )}
                          </p>

                          {selectedWorker.employee_id && (
                            <p className="text-slate-600">
                              <span className="font-medium">
                                Employee ID:
                              </span>{" "}
                              {
                                selectedWorker.employee_id
                              }
                            </p>
                          )}

                          <p className="text-slate-600">
                            <span className="font-medium">
                              Availability:
                            </span>{" "}
                            {
                              selectedWorker.availability ||
                              "Not specified"
                            }
                          </p>

                          <div>
                            <p className="font-medium text-slate-600">
                              Skills:
                            </p>

                            {workerSkills.length >
                            0 ? (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {workerSkills.map(
                                  (
                                    skill,
                                    index
                                  ) => (
                                    <span
                                      key={`${skill}-${index}`}
                                      className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                                    >
                                      {skill}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-slate-400">
                                No skills assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SCHEDULED AT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Scheduled Date & Time

                  <span className="ml-1 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) =>
                      setScheduledAt(
                        event.target.value
                      )
                    }
                    disabled={assigning}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Work Order Notes

                  <span className="ml-1 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <FileText
                    size={17}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={4}
                    disabled={assigning}
                    placeholder="Add instructions or notes for the worker..."
                    className="w-full resize-none rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    closeAssignModal
                  }
                  disabled={assigning}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    assigning ||
                    workersLoading ||
                    skillsLoading ||
                    !requiredSkillId ||
                    !workerId
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigning ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={17}
                      />

                      Assign & Create Work Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceRequests;