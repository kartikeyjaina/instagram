import axios from "axios";

const authClient = axios.create({
  baseURL: "http://localhost:4000/api/auth",
  headers: { "Content-Type": "application/json" },
});

const persistSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const authService = {
  register: async (username, email, password) => {
    const res = await authClient.post("/register", { username, email, password });
    persistSession(res.data.data);
    return res.data.data;
  },

  login: async (email, password) => {
    const res = await authClient.post("/login", { email, password });
    persistSession(res.data.data);
    return res.data.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getUser: () => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  getToken: () => localStorage.getItem("token"),
};
