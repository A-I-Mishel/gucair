export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-[#1e3a5f]">404</h1>
      <p className="mt-2 text-slate-600">Page not found.</p>
      <a href="/" className="mt-6 inline-block rounded-md bg-[#1e3a5f] px-4 py-2 text-white">
        Go home
      </a>
    </div>
  );
}
