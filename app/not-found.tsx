export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-6">This page could not be found.</p>
        <a href="/" className="text-lime-400 hover:text-lime-300 underline transition">
          Go back home
        </a>
      </div>
    </main>
  )
}
