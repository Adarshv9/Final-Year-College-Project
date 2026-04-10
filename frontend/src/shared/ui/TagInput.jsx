// Chip-style input for entering multiple free-form tags such as skills.
import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

export function TagInput({ value = [], onChange, placeholder = 'Add item…', label, error }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    // Ignore empty values and keep the chip list unique.
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(value.filter(v => v !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // Match common tag-input UX by deleting the last chip first.
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#e2e8f0]">{label}</label>}
      <div
        className={[
          'flex flex-wrap gap-1.5 p-2 min-h-[42px] bg-[#0b0f1a] border rounded-lg cursor-text transition-all duration-150',
          error ? 'border-rose-500' : 'border-[#1e2a3d] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20',
        ].join(' ')}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-full text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-rose-500 hover:text-white transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none py-0.5 px-1"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <p className="text-xs text-[#64748b]">Press Enter or comma to add</p>
    </div>
  );
}

export default TagInput;
