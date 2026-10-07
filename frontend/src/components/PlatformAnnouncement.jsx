import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PlatformAnnouncement = () => {
  const { platformSettings } = useAuth();

  const announcement =
    platformSettings?.announcement?.trim() || "";

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!announcement) {
      setVisible(false);
      return;
    }

    const dismissedAnnouncement =
      sessionStorage.getItem(
        "seiyalam_dismissed_platform_announcement"
      );

    if (dismissedAnnouncement === announcement) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, [announcement]);

  const handleDismiss = () => {
    sessionStorage.setItem(
      "seiyalam_dismissed_platform_announcement",
      announcement
    );

    setVisible(false);
  };

  if (!announcement || !visible) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm sm:px-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Megaphone size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-900">
            Platform Announcement
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-blue-800">
            {announcement}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1.5 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default PlatformAnnouncement;