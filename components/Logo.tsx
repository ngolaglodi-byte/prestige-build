export default function Logo() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-bold text-white shadow-soft">
        PB
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-lg tracking-tight">Prestige Build</span>
        <span className="text-xs text-gray-400">AI Code Workspace</span>
      </div>
    </div>
  );
}
