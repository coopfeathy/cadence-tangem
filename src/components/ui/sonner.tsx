import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-surface text-fg shadow-[var(--shadow-border)] border-0",
          description: "text-muted",
          actionButton: "bg-primary text-primary-fg",
          cancelButton: "bg-secondary text-fg",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
