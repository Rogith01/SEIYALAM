import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  X,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

import api from "../../services/api";

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");

  // ============================================================
  // SKILLS
  // ============================================================

  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // ============================================================
  // CREATE WORKER
  // ============================================================

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [creatingWorker, setCreatingWorker] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [workerForm, setWorkerForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    employee_id: "",
    joining_date: "",
    availability: "AVAILABLE",
    address: "",
    skills: [],
  });

  // ============================================================
  // VIEW WORKER
  // ============================================================

  const [showViewWorker, setShowViewWorker] = useState(false);
  const [viewWorker, setViewWorker] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ============================================================
  // EDIT WORKER
  // ============================================================

  const [showEditWorker, setShowEditWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [updatingWorker, setUpdatingWorker] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    employee_id: "",
    joining_date: "",
    availability: "AVAILABLE",
    address: "",
    skills: [],
  });

  // ============================================================
  // DELETE WORKER
  // ============================================================

  const [deletingWorkerId, setDeletingWorkerId] = useState(null);

  // ============================================================
  // FETCH WORKERS
  // ============================================================

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (availability) {
        params.availability = availability;
      }

      const response = await api.get("/workers/", {
        params,
      });

      setWorkers(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load workers.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH SKILLS
  // ============================================================

  const fetchSkills = async () => {
    try {
      setSkillsLoading(true);

      const response = await api.get("/skills/");

      setSkills(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [availability]);

  // ============================================================
  // OPEN ADD WORKER
  // ============================================================

  const openAddWorker = () => {
    setCreateError("");
    setCreateSuccess("");

    setWorkerForm({
      username: "",
      email: "",
      password: "",
      phone: "",
      employee_id: "",
      joining_date: "",
      availability: "AVAILABLE",
      address: "",
      skills: [],
    });

    fetchSkills();

    setShowAddWorker(true);
  };

  // ============================================================
  // CLOSE ADD WORKER
  // ============================================================

  const closeAddWorker = () => {
    if (creatingWorker) {
      return;
    }

    setShowAddWorker(false);
    setCreateError("");
    setCreateSuccess("");
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setWorkerForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // EDIT FORM CHANGE
  // ============================================================

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // TOGGLE CREATE SKILL
  // ============================================================

  const toggleSkill = (skillId) => {
    setWorkerForm((previous) => {
      const alreadySelected = previous.skills.includes(skillId);

      return {
        ...previous,
        skills: alreadySelected
          ? previous.skills.filter((id) => id !== skillId)
          : [...previous.skills, skillId],
      };
    });
  };

  // ============================================================
  // TOGGLE EDIT SKILL
  // ============================================================

  const toggleEditSkill = (skillId) => {
    setEditForm((previous) => {
      const alreadySelected = previous.skills.includes(skillId);

      return {
        ...previous,
        skills: alreadySelected
          ? previous.skills.filter((id) => id !== skillId)
          : [...previous.skills, skillId],
      };
    });
  };

  // ============================================================
  // CREATE WORKER
  // ============================================================

  const handleCreateWorker = async (event) => {
    event.preventDefault();

    try {
      setCreatingWorker(true);
      setCreateError("");
      setCreateSuccess("");

      const payload = {
        username: workerForm.username.trim(),
        email: workerForm.email.trim(),
        password: workerForm.password,
        phone: workerForm.phone.trim(),
        employee_id: workerForm.employee_id.trim(),
        joining_date: workerForm.joining_date || null,
        availability: workerForm.availability,
        address: workerForm.address.trim(),
        skills: workerForm.skills,
      };

      await api.post("/workers/create/", payload);

      setCreateSuccess("Worker created successfully.");

      setWorkerForm({
        username: "",
        email: "",
        password: "",
        phone: "",
        employee_id: "",
        joining_date: "",
        availability: "AVAILABLE",
        address: "",
        skills: [],
      });

      await fetchWorkers();

      setTimeout(() => {
        setShowAddWorker(false);
        setCreateSuccess("");
      }, 1000);
    } catch (err) {
      console.error(err);

      const responseData = err.response?.data;

      if (responseData) {
        if (typeof responseData === "string") {
          setCreateError(responseData);
        } else {
          const messages = Object.entries(responseData).map(
            ([field, message]) => {
              const formattedMessage = Array.isArray(message)
                ? message.join(", ")
                : message;

              return `${field}: ${formattedMessage}`;
            }
          );

          setCreateError(
            messages.join(" | ") || "Unable to create worker."
          );
        }
      } else {
        setCreateError("Unable to create worker.");
      }
    } finally {
      setCreatingWorker(false);
    }
  };

  // ============================================================
  // VIEW WORKER
  // ============================================================

  const openViewWorker = async (workerId) => {
    try {
      setViewLoading(true);
      setViewWorker(null);
      setShowViewWorker(true);

      const response = await api.get(`/workers/${workerId}/`);

      setViewWorker(response.data);
    } catch (err) {
      console.error(err);
      setShowViewWorker(false);
      setError("Unable to load worker details.");
    } finally {
      setViewLoading(false);
    }
  };

  // ============================================================
  // CLOSE VIEW
  // ============================================================

  const closeViewWorker = () => {
    if (viewLoading) {
      return;
    }

    setShowViewWorker(false);
    setViewWorker(null);
  };

  // ============================================================
  // OPEN EDIT WORKER
  // ============================================================

  const openEditWorker = async (workerId) => {
    try {
      setUpdateError("");
      setUpdateSuccess("");
      setEditingWorker(null);
      setShowEditWorker(true);

      await fetchSkills();

      const response = await api.get(`/workers/${workerId}/`);

      const worker = response.data;

      setEditingWorker(worker);

      const workerSkillIds = Array.isArray(worker.skills)
        ? worker.skills
            .map((skill) =>
              typeof skill === "object" ? skill.id : skill
            )
            .filter(Boolean)
        : [];

      setEditForm({
        username: worker.username || "",
        email: worker.email || "",
        phone: worker.phone || "",
        employee_id: worker.employee_id || "",
        joining_date: worker.joining_date || "",
        availability: worker.availability || "AVAILABLE",
        address: worker.address || "",
        skills: workerSkillIds,
      });
    } catch (err) {
      console.error(err);
      setShowEditWorker(false);
      setError("Unable to load worker for editing.");
    }
  };

  // ============================================================
  // CLOSE EDIT
  // ============================================================

  const closeEditWorker = () => {
    if (updatingWorker) {
      return;
    }

    setShowEditWorker(false);
    setEditingWorker(null);
    setUpdateError("");
    setUpdateSuccess("");
  };

  // ============================================================
  // UPDATE WORKER
  // ============================================================

  const handleUpdateWorker = async (event) => {
    event.preventDefault();

    if (!editingWorker) {
      return;
    }

    try {
      setUpdatingWorker(true);
      setUpdateError("");
      setUpdateSuccess("");

      const payload = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        employee_id: editForm.employee_id.trim(),
        joining_date: editForm.joining_date || null,
        availability: editForm.availability,
        address: editForm.address.trim(),
        skills: editForm.skills,
      };

      await api.patch(
        `/workers/${editingWorker.id}/`,
        payload
      );

      setUpdateSuccess("Worker updated successfully.");

      await fetchWorkers();

      setTimeout(() => {
        setShowEditWorker(false);
        setEditingWorker(null);
        setUpdateSuccess("");
      }, 800);
    } catch (err) {
      console.error(err);

      const responseData = err.response?.data;

      if (responseData) {
        if (typeof responseData === "string") {
          setUpdateError(responseData);
        } else {
          const messages = Object.entries(responseData).map(
            ([field, message]) => {
              const formattedMessage = Array.isArray(message)
                ? message.join(", ")
                : message;

              return `${field}: ${formattedMessage}`;
            }
          );

          setUpdateError(
            messages.join(" | ") || "Unable to update worker."
          );
        }
      } else {
        setUpdateError("Unable to update worker.");
      }
    } finally {
      setUpdatingWorker(false);
    }
  };

  // ============================================================
  // DELETE WORKER
  // ============================================================

  const handleDeleteWorker = async (worker) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete worker "${worker.username}"?\n\nThis action will permanently delete the worker account.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingWorkerId(worker.id);
      setError("");

      await api.delete(`/workers/${worker.id}/`);

      await fetchWorkers();
    } catch (err) {
      console.error(err);

      const responseData = err.response?.data;

      if (responseData) {
        if (typeof responseData === "string") {
          setError(responseData);
        } else {
          const messages = Object.entries(responseData).map(
            ([field, message]) => {
              const formattedMessage = Array.isArray(message)
                ? message.join(", ")
                : message;

              return `${field}: ${formattedMessage}`;
            }
          );

          setError(
            messages.join(" | ") || "Unable to delete worker."
          );
        }
      } else {
        setError("Unable to delete worker.");
      }
    } finally {
      setDeletingWorkerId(null);
    }
  };

  // ============================================================
  // AVAILABILITY STYLE
  // ============================================================

  const getAvailabilityClass = (value) => {
    switch (value) {
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

  // ============================================================
  // SKILL NAME
  // ============================================================

  const getSkillName = (skill) => {
    if (typeof skill === "object") {
      return skill.name;
    }

    const matchingSkill = skills.find(
      (item) => item.id === skill
    );

    return matchingSkill?.name || `Skill ${skill}`;
  };

  return (
    <div>
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <Users size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Workers
            </h1>

            <p className="text-sm text-slate-500">
              Manage your service workers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddWorker}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Plus size={17} />
            Add Worker
          </button>

          <button
            onClick={fetchWorkers}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ======================================================= */}

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
                  fetchWorkers();
                }
              }}
              placeholder="Search workers..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value)
            }
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="">All Availability</option>

            <option value="AVAILABLE">Available</option>

            <option value="BUSY">Busy</option>

            <option value="OFFLINE">Offline</option>
          </select>

          <button
            onClick={fetchWorkers}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* ======================================================
          ADD WORKER MODAL
      ======================================================= */}

      {showAddWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-white">
                  <UserPlus size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Add Worker
                  </h2>

                  <p className="text-sm text-slate-500">
                    Create a new worker account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAddWorker}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateWorker}
              className="space-y-5 p-6"
            >
              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {createSuccess}
                </div>
              )}

              {/* Basic Information */}

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Username *
                    </label>

                    <input
                      type="text"
                      name="username"
                      value={workerForm.username}
                      onChange={handleFormChange}
                      required
                      placeholder="worker username"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={workerForm.email}
                      onChange={handleFormChange}
                      placeholder="worker@example.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Password *
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={workerForm.password}
                      onChange={handleFormChange}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Phone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={workerForm.phone}
                      onChange={handleFormChange}
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Information */}

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Employee Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Employee ID
                    </label>

                    <input
                      type="text"
                      name="employee_id"
                      value={workerForm.employee_id}
                      onChange={handleFormChange}
                      placeholder="EMP001"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Joining Date
                    </label>

                    <input
                      type="date"
                      name="joining_date"
                      value={workerForm.joining_date}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Availability
                    </label>

                    <select
                      name="availability"
                      value={workerForm.availability}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="AVAILABLE">
                        Available
                      </option>

                      <option value="BUSY">
                        Busy
                      </option>

                      <option value="OFFLINE">
                        Offline
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Address
                </label>

                <textarea
                  name="address"
                  value={workerForm.address}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Worker address"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Skills */}

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Skills
                </h3>

                {skillsLoading ? (
                  <p className="text-sm text-slate-500">
                    Loading skills...
                  </p>
                ) : skills.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No skills available. You can add skills from
                    the Skills page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {skills.map((skill) => (
                      <label
                        key={skill.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={workerForm.skills.includes(
                            skill.id
                          )}
                          onChange={() =>
                            toggleSkill(skill.id)
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />

                        <span className="text-sm text-slate-700">
                          {skill.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeAddWorker}
                  disabled={creatingWorker}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingWorker}
                  className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {creatingWorker ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Worker
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          VIEW WORKER MODAL
      ======================================================= */}

      {showViewWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-white">
                  <Eye size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Worker Details
                  </h2>

                  <p className="text-sm text-slate-500">
                    View worker profile
                  </p>
                </div>
              </div>

              <button
                onClick={closeViewWorker}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="flex min-h-40 items-center justify-center">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-slate-600"
                  />
                </div>
              ) : viewWorker ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                      {viewWorker.username
                        ?.charAt(0)
                        .toUpperCase() || "W"}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {viewWorker.username}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {viewWorker.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Employee ID
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {viewWorker.employee_id || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {viewWorker.phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Joining Date
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {viewWorker.joining_date || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Availability
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getAvailabilityClass(
                          viewWorker.availability
                        )}`}
                      >
                        {viewWorker.availability}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Address
                    </p>

                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                      {viewWorker.address || "No address provided"}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Skills
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(viewWorker.skills) &&
                      viewWorker.skills.length > 0 ? (
                        viewWorker.skills.map((skill) => (
                          <span
                            key={
                              typeof skill === "object"
                                ? skill.id
                                : skill
                            }
                            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            {getSkillName(skill)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          No skills assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          EDIT WORKER MODAL
      ======================================================= */}

      {showEditWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-800 p-2 text-white">
                  <Pencil size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Edit Worker
                  </h2>

                  <p className="text-sm text-slate-500">
                    Update worker profile and skills
                  </p>
                </div>
              </div>

              <button
                onClick={closeEditWorker}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {!editingWorker ? (
              <div className="flex min-h-60 items-center justify-center">
                <RefreshCw
                  size={28}
                  className="animate-spin text-slate-600"
                />
              </div>
            ) : (
              <form
                onSubmit={handleUpdateWorker}
                className="space-y-5 p-6"
              >
                {updateError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {updateError}
                  </div>
                )}

                {updateSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {updateSuccess}
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Username *
                      </label>

                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditFormChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Employee ID
                      </label>

                      <input
                        type="text"
                        name="employee_id"
                        value={editForm.employee_id}
                        onChange={handleEditFormChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Joining Date
                      </label>

                      <input
                        type="date"
                        name="joining_date"
                        value={editForm.joining_date}
                        onChange={handleEditFormChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Availability
                      </label>

                      <select
                        name="availability"
                        value={editForm.availability}
                        onChange={handleEditFormChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                      >
                        <option value="AVAILABLE">
                          Available
                        </option>

                        <option value="BUSY">Busy</option>

                        <option value="OFFLINE">
                          Offline
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </h3>

                  {skillsLoading ? (
                    <p className="text-sm text-slate-500">
                      Loading skills...
                    </p>
                  ) : skills.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No skills available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {skills.map((skill) => (
                        <label
                          key={skill.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={editForm.skills.includes(
                              skill.id
                            )}
                            onChange={() =>
                              toggleEditSkill(skill.id)
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />

                          <span className="text-sm text-slate-700">
                            {skill.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={closeEditWorker}
                    disabled={updatingWorker}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updatingWorker}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {updatingWorker ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {/* ======================================================
          WORKERS TABLE
      ======================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading workers...
              </p>
            </div>
          </div>
        ) : workers.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <Users
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No workers found
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Worker
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee ID
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Availability
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {workers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                          {worker.username
                            ?.charAt(0)
                            .toUpperCase() || "W"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {worker.username}
                          </p>

                          <p className="text-xs text-slate-400">
                            {worker.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {worker.employee_id || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {worker.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getAvailabilityClass(
                          worker.availability
                        )}`}
                      >
                        {worker.availability}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(worker.skills) &&
                        worker.skills.length > 0 ? (
                          worker.skills.map((skill) => (
                            <span
                              key={
                                typeof skill === "object"
                                  ? skill.id
                                  : skill
                              }
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                              {getSkillName(skill)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">
                            No skills
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() =>
                            openViewWorker(worker.id)
                          }
                          title="View worker"
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() =>
                            openEditWorker(worker.id)
                          }
                          title="Edit worker"
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteWorker(worker)
                          }
                          disabled={
                            deletingWorkerId === worker.id
                          }
                          title="Delete worker"
                          className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingWorkerId === worker.id ? (
                            <RefreshCw
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workers;