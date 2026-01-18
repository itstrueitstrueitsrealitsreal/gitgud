export default function Spinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} border-4 border-[rgba(255,255,255,0.18)] border-t-[rgba(255,255,255,0.82)] rounded-full animate-spin`}
      ></div>
    </div>
  );
}
