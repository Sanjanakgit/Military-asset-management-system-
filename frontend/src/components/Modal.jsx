export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-xl w-full max-w-[900px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5.5 py-4.5 border-b border-border">
          <h3 className="m-0 text-base">{title}</h3>
          <button
            className="bg-transparent border-none text-text-muted text-2xl cursor-pointer leading-none hover:text-text"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-5.5 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
