import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export const useAuthStore = create((set, get) => ({
  user: null,

  loginSuccess: (user) => set({ user }),

  logout: async () => {
    const user = get().user;

    // 🔐 Audit logout if user exists
    if (user?.user_id) {
      try {
        await invoke("logout_cmd", {
          userId: user.user_id,
        });
      } catch (e) {
        console.error("Failed to log logout audit", e);
      }
    }

    // Clear session
    set({ user: null });
  },
}));
