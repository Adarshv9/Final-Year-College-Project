// Empty-state component for screens that have no data to display yet.
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-[#1a2236] rounded-2xl flex items-center justify-center text-[#64748b] mb-4">
          <Icon size={28} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#94a3b8] mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
