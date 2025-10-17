export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="px-4 text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">
          Welcome to Bonstart
        </h1>
        <p className="mb-8 max-w-2xl text-xl text-gray-700">
          A modern SST v3 + Next.js template for Bonterra projects
        </p>

        <div className="max-w-2xl rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            🚀 Quick Start
          </h2>
          <div className="space-y-3 text-left text-gray-600">
            <p>
              1. Run{" "}
              <code className="rounded bg-gray-100 px-2 py-1">
                npm run bonstart:init
              </code>{" "}
              to configure your project
            </p>
            <p>
              2. Start developing with{" "}
              <code className="rounded bg-gray-100 px-2 py-1">npm run dev</code>
            </p>
            <p>
              3. Deploy to AWS with{" "}
              <code className="rounded bg-gray-100 px-2 py-1">
                npm run sst:deploy
              </code>
            </p>
          </div>
        </div>

        <div className="mt-8 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 font-semibold text-gray-800">SST v3</h3>
            <p className="text-sm text-gray-600">
              Modern infrastructure as code
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 font-semibold text-gray-800">Next.js 15</h3>
            <p className="text-sm text-gray-600">
              React framework with App Router
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-2 font-semibold text-gray-800">Tailwind CSS</h3>
            <p className="text-sm text-gray-600">Utility-first CSS framework</p>
          </div>
        </div>
      </main>
    </div>
  );
}
