export default function TestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-fg">Test Page</h1>
        <p className="text-primary-muted">This page tests the sidebar navigation.</p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-primary-fg mb-4">Sidebar Test</h2>
        <p className="text-primary-muted">
          If you can see the sidebar on this page, then the global sidebar implementation is working correctly.
        </p>
        <div className="mt-4 p-4 bg-primary-accent-light rounded-xl">
          <p className="text-sm text-primary-fg">
            <strong>Navigation Test:</strong> Try clicking on different sidebar items to navigate between pages.
          </p>
        </div>
      </div>
    </div>
  );
}

