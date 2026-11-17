import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
});

export const api = {
  get: (url, config = {}) =>
    axios.get(`${API}${url}`, {
      ...config,
      headers: { ...getAuthHeaders(), ...config.headers },
    }),
  post: (url, data, config = {}) =>
    axios.post(`${API}${url}`, data, {
      ...config,
      headers: { ...getAuthHeaders(), ...config.headers },
    }),
  put: (url, data, config = {}) =>
    axios.put(`${API}${url}`, data, {
      ...config,
      headers: { ...getAuthHeaders(), ...config.headers },
    }),
  patch: (url, data, config = {}) =>
    axios.patch(`${API}${url}`, data, {
      ...config,
      headers: { ...getAuthHeaders(), ...config.headers },
    }),
  delete: (url, config = {}) =>
    axios.delete(`${API}${url}`, {
      ...config,
      headers: { ...getAuthHeaders(), ...config.headers },
    }),
};
