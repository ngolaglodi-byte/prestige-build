// store/useAIPreviewStore.ts

// Interface for an AI code preview item
interface AICodePreview {
    id: string;
    code: string;
    language: string;
    description?: string;
    createdAt: Date;
}

// Interface for the state of the AI code preview store
interface AIPreviewStoreState {
    previews: AICodePreview[];
    loading: boolean;
    error?: string;
}

// Interface for actions in the AI code preview store
interface AIPreviewStoreAction {
    type: string;
    payload?: any;
}

// A function to initialize store state
function initializeStoreState(): AIPreviewStoreState {
    return {
        previews: [],
        loading: false,
        error: undefined,
    };
}