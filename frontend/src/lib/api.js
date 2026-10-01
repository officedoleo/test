import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

export function formatApiError(e, fallback = "Algo deu errado. Tente novamente.") {
  const detail = e?.response?.data?.detail;
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((x) => (x && typeof x.msg === "string" ? x.msg : JSON.stringify(x))).join(", ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return fallback;
}
