import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  email: string
}

interface StoreState {
  token?: string
  user?: User
  avatarUrl?: string
  setToken: (token: string) => void
  setUser: (user: User) => void
  setAvatarUrl: (url: string) => void
  logout: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      token: undefined,
      user: undefined,
      avatarUrl: undefined,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      logout: () => set({ token: undefined, user: undefined, avatarUrl: undefined }),
    }),
    {
      name: "wellbeing-storage",
    },
  ),
)
