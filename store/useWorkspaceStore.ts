// store/useWorkspaceStore.ts

import { ref } from 'vue';
import { defineStore } from 'pinia';

// Define interfaces for file management
export interface FileItem {
    id: string;
    name: string;
    path: string;
    size: number;
    lastModified: Date;
    type: string;
}

export interface WorkspaceState {
    files: FileItem[];
    currentPath: string;
    selectedFile: FileItem | null;
}

// Create the workspace store
export const useWorkspaceStore = defineStore('workspace', () => {
    const state = ref<WorkspaceState>({
        files: [],
        currentPath: '',
        selectedFile: null,
    });

    const setFiles = (files: FileItem[]) => {
        state.value.files = files;
    };

    const setCurrentPath = (path: string) => {
        state.value.currentPath = path;
    };

    const selectFile = (file: FileItem | null) => {
        state.value.selectedFile = file;
    };

    return {
        state,
        setFiles,
        setCurrentPath,
        selectFile,
    };
});
