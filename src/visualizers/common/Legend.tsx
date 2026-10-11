import { statusBorder } from '../../utils/deriveSnapshot';

const items: { label: string; status: keyof typeof statusBorder }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'Visiting / computing', status: 'visiting' },
  { label: 'Settled', status: 'settled' },
  { label: 'Active (this step)', status: 'active' },
  { label: 'Rejected (greedy)', status: 'rejected' },
];

export default function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm border"
            style={{ borderColor: statusBorder[item.status], backgroundColor: statusBorder[item.status] + '33' }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}
