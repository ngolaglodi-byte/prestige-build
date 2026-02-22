import { useEditor } from "@/lib/store/editor";

export function useLoadFile(projectId) {
  const { loadFile } = useEditor();

  return (path) => {
    loadFile(projectId, path);
  };
}
