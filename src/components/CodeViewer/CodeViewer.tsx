interface Props {
  code: string;
  activeLine?: number;
}

export default function CodeViewer({ code, activeLine }: Props) {
  const lines = code.split('\n');

  return (
    <pre className="overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed">
      {lines.map((line, i) => {
        const lineNumber = i + 1;
        const isActive = lineNumber === activeLine;
        return (
          <div
            key={i}
            className={`flex gap-3 rounded px-1 transition-colors duration-150 ${
              isActive ? 'bg-sky-500/15' : ''
            }`}
          >
            <span className="w-5 shrink-0 select-none text-right text-slate-600">{lineNumber}</span>
            <code className={isActive ? 'text-sky-200' : 'text-slate-300'}>{line || ' '}</code>
          </div>
        );
      })}
    </pre>
  );
}
