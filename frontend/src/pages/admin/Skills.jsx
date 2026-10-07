import { useEffect, useState } from "react";
import {
  Wrench,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import api from "../../services/api";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/skills/");

      setSkills(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Skill name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/skills/", {
        name: name.trim(),
        description: description.trim(),
      });

      setName("");
      setDescription("");

      await fetchSkills();
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error?.name?.[0] ||
        err.response?.data?.error?.detail ||
        "Unable to create skill.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2 text-white">
            <Wrench size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Skills
            </h1>

            <p className="text-sm text-slate-500">
              Manage worker skills
            </p>
          </div>
        </div>

        <button
          onClick={fetchSkills}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Add Skill */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Plus size={19} className="text-slate-700" />

          <h2 className="font-semibold text-slate-800">
            Add New Skill
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Skill Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Example: AC Repair"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <input
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the skill"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />

              {saving ? "Adding..." : "Add Skill"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Skills */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">
            Existing Skills
          </h2>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

              <p className="text-sm text-slate-500">
                Loading skills...
              </p>
            </div>
          </div>
        ) : skills.length === 0 ? (
          <div className="p-8 text-center">
            <Wrench
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              No skills created yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <Wrench size={18} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {skill.name}
                      </h3>

                      <p className="text-xs text-slate-400">
                        Skill #{skill.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    title="Delete API is not available yet"
                    className="rounded-lg p-2 text-slate-300"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  {skill.description ||
                    "No description provided."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Skills;