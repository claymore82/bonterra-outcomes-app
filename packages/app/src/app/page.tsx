import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-gray-900">Bonstart</div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              v2.0
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="https://github.com/bonterratech/bonstart/tree/main/docs" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Docs
            </a>
            <a href="https://github.com/bonterratech/bonstart" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
        {/* Warning Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Setup Required
          </h1>
          <p className="text-lg text-gray-700">
            Configure this template to get started with your new project
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="mb-8 rounded-xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
            Quick Start
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                1
              </span>
              <div>
                <strong>Install dependencies:</strong>{" "}
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  npm install
                </code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                2
              </span>
              <div>
                <strong>Configure your project:</strong>{" "}
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  npm run bonstart:init
                </code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                3
              </span>
              <div>
                <strong>Start developing:</strong>{" "}
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  npm run dev
                </code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                4
              </span>
              <div>
                <strong>Deploy to AWS:</strong>{" "}
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  npm run sst:deploy
                </code>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium shadow-sm transition-colors">
              Get Started
            </Button>
            <Button className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-md font-medium border border-gray-300 shadow-sm transition-colors">
              View Docs
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="rounded-xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">
            What's Included
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SST v3</h3>
                <p className="text-sm text-gray-600">
                  Modern infrastructure as code for AWS
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">⚛️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Next.js 15</h3>
                <p className="text-sm text-gray-600">
                  React framework with App Router
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">🎨</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stitch Design System</h3>
                <p className="text-sm text-gray-600">
                  Bonterra's design system with Tailwind
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">📘</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">TypeScript</h3>
                <p className="text-sm text-gray-600">
                  Full type safety and better DX
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ITD Documentation</h3>
                <p className="text-sm text-gray-600">
                  Architecture decision templates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ESLint + Prettier</h3>
                <p className="text-sm text-gray-600">
                  Code quality and formatting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Bonterra Bonstart Template
        </p>
        </div>
      </div>
    </div>
  );
}
