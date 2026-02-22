import create from 'zustand';

// Define the interfaces for your state and actions
interface AIPreviewState {
    code: string;
    setCode: (newCode: string) => void;
    resetCode: () => void;
}

// Create a Zustand store for managing code previews
const useAIPreviewStore = create<AIPreviewState>((set) => ({
    code: '',
    setCode: (newCode) => set({ code: newCode }),
    resetCode: () => set({ code: '' }),
}));

export default useAIPreviewStore;
