import { useEffect, useState } from "react";
import {
  UserRound,
  ArrowLeft,
  Save,
  RefreshCw,
  BriefcaseBusiness,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";

function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchWorker = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [workerResponse, skillsResponse] = await Promise.all([
        api.get(`/workers/${id}/`),
        api.get("/skills/"),
      ]);

      const workerData = workerResponse.data;

      setWorker({
        ...workerData,
        skill_ids:
          workerData.skill_ids ||
          workerData.skills?.map((skill) => skill.id) ||
          [],
      });

      setSkills(skillsResponse.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load worker details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, [id]);

  const handleChange = (event) => {
    setWorker({
      ...worker,
      [event.target.name]: event.target.value,
    });
  };

  const handleSkillChange = (skillId) => {
    const currentSkillIds = worker.skill_ids || [];

    const exists = currentSkillIds.includes(skillId);

    const updatedSkillIds = exists
      ? currentSkillIds.filter((item) => item !== skillId)
      : [...currentSkillIds, skillId];

    setWorker({
      ...worker,
      skill_ids: updatedSkillIds,
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        username: worker.username || "",
        email: worker.email || "",
        phone: worker.phone || "",
        employee_id: worker.employee_id || "",
        joining_date: worker.joining_date || null,
        availability: worker.availability || "OFFLINE",
        address: worker.address || "",
        skill_ids: worker.skill_ids || [],
      };

      const response = await api.put(
        `/workers/${id}/`,
        payload
      );

      setWorker({
        ...response.data,
        skill_ids:
          response.data.skill_ids ||
          response.data.skills?.map((skill) => skill.id) ||
          worker.skill_ids ||
          [],
      });

      setSuccess(
        "Worker details updated successfully."
      );
    } catch (err) {
      console.error(err);

      const responseData = err.response?.data;

      let message = "Unable to update worker.";

      if (responseData) {
        if (typeof responseData === "string") {
          message = responseData;
        } else if (responseData.detail) {
          message = responseData.detail;
        } else {
          const firstKey = Object.keys(responseData)[0];

          if (firstKey) {
            const value = responseData[firstKey];

            message = Array.isArray(value)
              ? value.join(" ")
              : String(value);
          }
        }
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

          <p className="text-sm text-slate-500">
            Loading worker...
          </p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          Worker not found.
        </p>

        <button
          onClick={() => navigate("/admin/workers")}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
        >
          Back to Workers
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/workers")}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white">
            {worker.username
              ?.charAt(0)
              .toUpperCase() || "W"}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Worker Details
            </h1>

            <p className="text-sm text-slate-500">
              Manage worker profile and skills
            </p>
          </div>
        </div>

        <button
          onClick={fetchWorker}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Profile */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <UserRound size={20} className="text-slate-600" />

            <div>
              <h2 className="font-semibold text-slate-800">
                Profile Information
              </h2>

              <p className="text-sm text-slate-400">
                Update worker information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </label>

              <input
                name="username"
                value={worker.username || ""}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                name="email"
                type="email"
                value={worker.email || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone
              </label>

              <input
                name="phone"
                value={worker.phone || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Employee ID
              </label>

              <input
                name="employee_id"
                value={worker.employee_id || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Joining Date
              </label>

              <input
                name="joining_date"
                type="date"
                value={worker.joining_date || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Availability
              </label>

              <select
                name="availability"
                value={worker.availability || "OFFLINE"}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
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

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address
              </label>

              <textarea
                name="address"
                value={worker.address || ""}
                onChange={handleChange}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <BriefcaseBusiness
              size={20}
              className="text-slate-600"
            />

            <div>
              <h2 className="font-semibold text-slate-800">
                Worker Skills
              </h2>

              <p className="text-sm text-slate-400">
                Select the skills this worker can handle
              </p>
            </div>
          </div>

          {skills.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-500">
                No skills available.
              </p>

              <button
                type="button"
                onClick={() => navigate("/admin/skills")}
                className="mt-2 text-sm font-medium text-slate-700 underline"
              >
                Manage Skills
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => {
                const selected = (
                  worker.skill_ids || []
                ).includes(skill.id);

                return (
                  <label
                    key={skill.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                      selected
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleSkillChange(skill.id)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      {skill.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkerDetails;