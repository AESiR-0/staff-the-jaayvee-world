"use client";

interface MessageBannerProps {
  error: string | null;
  success: string | null;
}

export default function MessageBanner({ error, success }: MessageBannerProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
    </>
  );
}

