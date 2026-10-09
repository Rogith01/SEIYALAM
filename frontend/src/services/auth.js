
import api from "./api";

// ============================================================
// LOGIN
// ============================================================

export const loginUser = async (username, password) => {
  const identifier = username.trim();
  let response;
  let isFounder = false;

  // CUSTOMER LOGIN — 10-digit mobile number
  if (/^\d{10}$/.test(identifier)) {
    response = await api.post("/customer/login/", {
      username: identifier,
      password,
    });
  } else {
    // Try Founder authentication first
    try {
      response = await api.post("/founder/token/", {
        username: identifier,
        password,
      });

      isFounder = true;
    } catch (error) {
      if (error.response?.status !== 401) {
        throw error;
      }

      // Fall back to regular Admin/Worker login
      response = await api.post("/token/", {
        username: identifier,
        password,
      });
    }
  }

  if (!response.data.access || !response.data.refresh) {
    throw new Error("Login response did not contain valid tokens.");
  }

  // Keep Founder tokens separate from normal user tokens
  if (isFounder) {
    localStorage.setItem(
      "founder_access_token",
      response.data.access
    );
    localStorage.setItem(
      "founder_refresh_token",
      response.data.refresh
    );

    // Clear stale normal-user session data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  } else {
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    // Clear stale Founder session data
    localStorage.removeItem("founder_access_token");
    localStorage.removeItem("founder_refresh_token");
    localStorage.removeItem("user");
  }

  return response.data;
};

// ============================================================
// CURRENT USER
// ============================================================


export const getCurrentUser = async () => {
  const isFounder = Boolean(
    localStorage.getItem("founder_access_token")
  );

  const response = await api.get("/me/", {
    headers: {
      Authorization: `Bearer ${
        isFounder
          ? localStorage.getItem("founder_access_token")
          : localStorage.getItem("access_token")
      }`,
    },
  });

  localStorage.setItem("user", JSON.stringify(response.data));

  return response.data;
};

// ============================================================
// LOGOUT
// ============================================================

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("founder_access_token");
  localStorage.removeItem("founder_refresh_token");
  localStorage.removeItem("user");
};