export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-between selection:bg-secondary-container">
      {children}
    </div>
  );
}
