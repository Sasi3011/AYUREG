import { create } from "zustand";

function loadUser() {
  try {
    const raw = localStorage.getItem("ayureg_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const useAuthStore = create((set) => ({
  user: loadUser(),
  token: localStorage.getItem("ayureg_token") || null,
  login: (user, token) => {
    localStorage.setItem("ayureg_user", JSON.stringify(user));
    localStorage.setItem("ayureg_token", token);
    set({ user, token });
  },
  updateUser: (patch) =>
    set((state) => {
      const user = { ...state.user, ...patch };
      localStorage.setItem("ayureg_user", JSON.stringify(user));
      return { user };
    }),
  logout: () => {
    localStorage.removeItem("ayureg_user");
    localStorage.removeItem("ayureg_token");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
