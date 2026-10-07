import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {

    /*
     * Founder API requests must use the
     * Founder access token.
     *
     * Normal API requests use the
     * normal access token.
     */

    const isFounderRequest =
      config.url?.startsWith("/founder/");


    const token = isFounderRequest
      ? localStorage.getItem(
          "founder_access_token"
        )
      : localStorage.getItem(
          "access_token"
        );


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }


    return config;

  },

  (error) => {
    return Promise.reject(error);
  }
);

export const getPlatformSettings = async () => {
  const response = await api.get("/platform/settings/");
  return response.data;
};

export default api;