import Link from "next/link";

export default function JoinSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-extrabold text-purple-700">All Set!</h1>
        <p className="text-sm text-gray-500">
          Your child&apos;s account is ready. Tap below to meet their pet and
          start their first practice!
        </p>
        <Link
          href="/student"
          className="block w-full rounded-2xl bg-purple-600 px-6 py-4 text-lg font-extrabold text-white shadow-md hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Meet My Pet 🐾
        </Link>
      </div>
    </div>
  );
}
