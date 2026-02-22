export type AIAction =
  | {
      type: "create_file";
      path: string;
      content: string;
    }
  | {
      type: "update_file";
      path: string;
      content: string;
    }
  | {
      type: "delete_file";
      path: string;
    }
  | {
      type: "rename_file";
      oldPath: string;
      newPath: string;
    };
