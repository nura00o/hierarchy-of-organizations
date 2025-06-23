import clsx from 'clsx';

function highlight(text, query) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  if (!query) return str;
  const re = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  return str.split(re).map((chunk, i) =>
    re.test(chunk) ? (
      <mark key={i} className="bg-yellow-300 text-gray-900">
        {chunk}
      </mark>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  );
}

export default function ResultItem({ item, query, className, onClick, selected }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-3 mb-2 last:mb-0 border rounded shadow-sm transition-colors duration-100 cursor-pointer',
        selected ? 'bg-yellow-100' : 'hover:bg-gray-50',
        className,
      )}
    >
      <div
        className="font-medium text-sm truncate min-w-0"
        title={item.name}
      >
        <span className="inline-block">{highlight(item.name, query)}</span>
      </div>
      <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {item.bin && <span>BIN: {highlight(item.bin, query)}</span>}
        {item.code && <span>Code GU: {highlight(item.code, query)}</span>}
        {item.code_abp && <span>Code ABP: {highlight(item.code_abp, query)}</span>}
      </div>
    </div>
  );
}