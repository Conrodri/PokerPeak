/** Centered loading spinner used in all trainer exercise phases. */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin h-10 w-10 border-2 border-felt-500 border-t-transparent rounded-full" />
    </div>
  );
}
