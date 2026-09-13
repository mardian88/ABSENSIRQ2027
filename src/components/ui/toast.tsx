import toastHot from "react-hot-toast";

export const toast = Object.assign(
  ({
    title,
    description,
    variant = "default",
  }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    if (variant === "destructive") {
      toastHot.error(`${title ? title + ': ' : ''}${description || ''}`);
    } else {
      toastHot.success(`${title ? title + ': ' : ''}${description || ''}`);
    }
  },
  {
    add: ({
      title,
      description,
      type = "success",
    }: {
      title?: string;
      description?: string;
      type?: "success" | "error" | "info";
    }) => {
      if (type === "error") {
        toastHot.error(`${title ? title + ': ' : ''}${description || ''}`);
      } else {
        toastHot.success(`${title ? title + ': ' : ''}${description || ''}`);
      }
    }
  }
);
