export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-dark-400">Carregando...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-white">Processando...</p>
      </div>
    </div>
  );
}
