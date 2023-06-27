import { create } from "zustand";
import { Persona } from "../../helpers/types";

interface PersonaStore {
  personas: Persona[];
  addPersona: (persona: Persona) => void;
  updatePersona: (roomId: string, updates: Partial<Persona>) => void;
  deletePersona: (roomId: string) => void;
}

export const usePersonaStore = create<PersonaStore>((set) => ({
  personas: [],
  addPersona: (persona: Persona) =>
    set((state) => ({ personas: [...state.personas, persona] })),
  updatePersona: (roomId: string, updates: Partial<Persona>) =>
    set((state) => ({
      personas: state.personas.map((persona) =>
        persona.roomId === roomId ? { ...persona, ...updates } : persona
      ),
    })),
  deletePersona: (roomId: string) =>
    set((state) => ({
      personas: state.personas.filter((persona) => persona.roomId !== roomId),
    })),
}));
