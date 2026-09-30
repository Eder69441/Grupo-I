export default function ErrorMessage({ message }) {
  return (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
      {message}
    </div>
  );
}
