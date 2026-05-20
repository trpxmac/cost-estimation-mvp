import { PlusCircle, Trash2 } from 'lucide-react';

/**
 * Editor for Item Set sub-items — used in AddNewItem page.
 * Allows searching and adding sub-items, editing quantities & prices, and removing items.
 */
export default function SetItemEditor({ setItems, onSetItemsChange, setSearch, setResults, onSearchChange }) {
  const addSubItem = (item) => {
    onSetItemsChange(prev => [...prev, { ...item, quantity: 1 }]);
    onSearchChange('');
  };

  return (
    <div className="border-t border-slate-100 pt-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#0F294D] flex items-center gap-2">
          <div className="w-1 h-4 bg-indigo-600 rounded-full"></div> รายการย่อยในชุด (Set Components)
        </h3>
        <div className="relative w-1/2">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <PlusCircle size={14} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหายาเพื่อเพิ่มเข้าชุด..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500"
            value={setSearch}
            onChange={e => onSearchChange(e.target.value)}
          />
          {setResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg mt-1 shadow-xl z-50 max-h-[200px] overflow-y-auto divide-y divide-slate-50">
              {setResults.map(r => (
                <div key={r.itemCode} className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center" onClick={() => addSubItem(r)}>
                  <div>
                    <div className="font-bold text-slate-700">{r.Common_name}</div>
                    <div className="text-[0.6rem] text-slate-400">{r.itemCode}</div>
                  </div>
                  <div className="text-indigo-600 font-bold">เลือก</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-left font-bold text-slate-500 uppercase tracking-tighter">รายการ</th>
              <th className="py-2.5 px-3 text-center w-[60px] font-bold text-slate-500">QTY</th>
              <th className="py-2.5 px-3 text-center w-[80px] font-bold text-slate-500">OPD</th>
              <th className="py-2.5 px-3 text-center w-[80px] font-bold text-slate-500">IPD</th>
              <th className="py-2.5 px-3 text-center w-[80px] font-bold text-slate-500">OPDTR</th>
              <th className="py-2.5 px-3 text-center w-[80px] font-bold text-slate-500">IPDTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {setItems.map((si, idx) => (
              <tr key={idx} className="hover:bg-white transition-colors">
                <td className="py-2 px-3">
                  <div className="font-semibold text-slate-700">{si.Common_name}</div>
                  <div className="text-[0.6rem] text-slate-400 font-mono">{si.itemCode}</div>
                </td>
                <td className="py-1 px-1">
                  <input
                    type="number"
                    value={si.quantity || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      onSetItemsChange(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                    }}
                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded py-1.5 px-1 text-center font-bold text-indigo-700 focus:bg-white outline-none"
                  />
                </td>
                {['OPD', 'IPD', 'OPDTR', 'IPDTR'].map(p => (
                  <td key={p} className="py-1 px-1">
                    <input
                      type="number"
                      value={si[p]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onSetItemsChange(prev => prev.map((item, i) => i === idx ? { ...item, [p]: val } : item));
                      }}
                      className="w-full bg-white border border-slate-200 rounded py-1.5 px-1 text-center font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </td>
                ))}
                <td className="py-1 px-2 text-center">
                  <button onClick={() => onSetItemsChange(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {setItems.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 italic">ยังไม่มีรายการในชุด ค้นหารายการด้านบนเพื่อเพิ่มเข้าชุด</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
