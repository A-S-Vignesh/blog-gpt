export default function EditorLayout({ children }:{ children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">{children}</div>
  );
}
