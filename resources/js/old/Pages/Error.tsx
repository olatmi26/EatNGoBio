import { Head, Link } from "@inertiajs/react";

export default function ErrorPage({ status, message }: { status: number; message: string }) {
  return (
    <>
      <Head title={`${status} Error`} />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800">{status}</h1>
          <p className="text-slate-600 mt-3">{message}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
              Go Dashboard
            </Link>
            <button onClick={() => window.history.back()} className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
