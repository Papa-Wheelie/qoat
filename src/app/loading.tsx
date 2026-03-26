export default function Loading() {
  return (
    <main className="min-h-screen bg-surface pt-14 flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-[#111111]/10 border-t-[#111111]"
        style={{ animation: "spin 0.7s linear infinite" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
