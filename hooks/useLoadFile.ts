import { useEditor } from "@/lib/store/editor";

export function useLoadFile(projectId: string) {
  const { loadFile } = useEditor();

  return (path: string) => {
    loadFile(projectId, path);
  };
}
