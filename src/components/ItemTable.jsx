import { Plus, Minus, Trash2, X } from 'lucide-react';

/**
 * Renders the item table for pharma or nurse sections.
 * Handles both individual items and grouped Set items with headers.
 */
export default function ItemTable({ items, getPrice, fmt, onUpdateQuantity, onUpdateGroupQuantity, onUpdateDose, onRemoveItem, onRemoveGroup }) {
  // Sort items so sets stay together
  const sortedItems = [...items].sort((a, b) => {
    if (a.setInstanceId && b.setInstanceId) return a.setInstanceId.localeCompare(b.setInstanceId);
    if (a.setInstanceId) return -1;
    if (b.setInstanceId) return 1;
    return 0;
  });

  const groups = [];
  let currentGid = null;
  sortedItems.forEach(item => {
    if (item.setInstanceId) {
      if (item.setInstanceId !== currentGid) {
        groups.push({ isGroupHeader: true, gid: item.setInstanceId, name: item.parentSetName, qty: item.quantity });
        currentGid = item.setInstanceId;
      }
    } else {
      currentGid = null;
    }
    groups.push(item);
  });

  return (
    <table className="w-full text-[0.7rem] border-collapse mb-2">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="py-2 text-left text-[0.6rem] font-bold text-slate-400 uppercase">รายการ</th>
          <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[60px]">Dose</th>
          <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[80px]">QTY</th>
          <th className="py-2 text-right text-[0.6rem] font-bold text-slate-400 uppercase w-[100px]">รวม</th>
          <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[40px] no-print"></th>
        </tr>
      </thead>
      <tbody>
        {groups.map((i) => {
          if (i.isGroupHeader) {
            return (
              <tr key={i.gid} className="bg-slate-50/50 group/set">
                <td colSpan="2" className="py-2 px-2">
                  <div className="flex items-center">
                    <span className="bg-indigo-600 text-white text-[0.55rem] font-black px-1.5 py-0.5 rounded mr-2 uppercase shadow-sm">Set</span>
                    <span className="font-bold text-indigo-900">{i.name}</span>
                  </div>
                </td>
                <td className="py-2 text-center">
                  <div className="flex items-center justify-center gap-1 no-print">
                    <button onClick={() => onUpdateGroupQuantity(i.gid, -1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50"><Minus size={10} /></button>
                    <span className="w-6 text-center font-black text-indigo-700">{i.qty}</span>
                    <button onClick={() => onUpdateGroupQuantity(i.gid, 1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50"><Plus size={10} /></button>
                  </div>
                  <span className="hidden print:block text-center font-bold text-indigo-900">{i.qty} ชุด</span>
                </td>
                <td className="py-2 text-right font-black text-indigo-900 px-2"></td>
                <td className="py-2 text-center no-print">
                  <button onClick={() => onRemoveGroup(i.gid)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          }
          return (
            <tr key={i.id} className={`border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${i.setInstanceId ? 'bg-indigo-50/10' : ''}`}>
              <td className={`py-2 ${i.setInstanceId ? 'pl-8' : 'px-2'}`}>
                <div className="font-bold text-slate-800 text-[0.7rem]">
                  {i.Common_name}
                  {i.stock !== undefined && (
                    <span className={`ml-1 font-semibold ${i.stock <= 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                      (คงคลัง: {i.stock})
                    </span>
                  )}
                </div>
                <div className="text-[0.55rem] text-slate-400 font-mono no-print">{i.itemCode}</div>
              </td>
              <td className="py-2 text-center">
                <input
                  type="text"
                  value={i.dose || ""}
                  onChange={(e) => onUpdateDose(i.id, e.target.value)}
                  placeholder="-"
                  className="w-full text-center bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none text-[0.7rem] font-bold text-blue-600 no-print"
                />
                <span className="hidden print:inline font-bold">{i.dose || "-"}</span>
              </td>
              <td className="py-2">
                <div className="flex items-center justify-center gap-1 no-print">
                  {!i.setInstanceId && <button onClick={() => onUpdateQuantity(i.id, -1)} className="text-slate-300 hover:text-slate-500"><Minus size={12} /></button>}
                  <span className="w-4 text-center font-bold text-slate-700">{i.quantity}</span>
                  {!i.setInstanceId && <button onClick={() => onUpdateQuantity(i.id, 1)} className="text-slate-300 hover:text-slate-500"><Plus size={12} /></button>}
                </div>
                <span className="hidden print:block text-center font-bold">{i.quantity}</span>
              </td>
              <td className="py-2 text-right pr-2">
                <div className="font-black text-slate-900">{fmt(getPrice(i) * i.quantity)}</div>
                <div className="text-[0.55rem] text-slate-400 no-print">@{fmt(getPrice(i))}</div>
              </td>
              <td className="py-2 text-center no-print">
                {!i.setInstanceId && (
                  <button onClick={() => onRemoveItem(i.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
