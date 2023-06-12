import { create } from "zustand";
import { User } from "../types";

interface UserStore {
  users: User[];
  addUser: (user: User) => void;
  updateUser: (peerId: string, updates: Partial<User>) => void;
  deleteUser: (peerId: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  addUser: (user: User) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (peerId: string, updates: Partial<User>) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.peerId === peerId ? { ...user, ...updates } : user
      ),
    })),
  deleteUser: (peerId: string) =>
    set((state) => ({
      users: state.users.filter((user) => user.peerId !== peerId),
    })),
}));
