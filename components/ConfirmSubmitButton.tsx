"use client";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  message: string;
  className?: string;
};

export default function ConfirmSubmitButton({
  children,
  message,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        const confirmed = window.confirm(message);

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}