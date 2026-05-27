import { Search, Plus } from 'lucide-react';

/**
 * Drug/service search panel with dropdown results.
 * Nursing service items are already merged into the search pool via getAllMedications().
 */
export default function SearchPanel({ searchQuery, searchResults, currentRole, getPrice, fmt, onSearchChange, onAddItem, onNavigateAddNew }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canAddNewItem = user.role === 'admin' || user.role === 'pharma' || user.role === 'nurse';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Search size={14} /> ค้นหารายการละเอียด ({currentRole === "pharma" ? "ยา" : "ค่าบริการ"})
        </h2>
        {canAddNewItem && (
          <button
            onClick={onNavigateAddNew}
            className="text-[0.6rem] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 flex items-center gap-1 transition-colors"
          >
            <Plus size={10} /> เพิ่มยา/รายการใหม่
          </button>
        )}
      </div>
      <div className="relative">
        <input type="text" className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500" placeholder="ค้นหา..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-2 max-h-[250px] overflow-y-auto z-50 shadow-2xl divide-y">
            {searchResults.map(item => (
              <div key={item.itemCode} className="p-3 cursor-pointer flex justify-between items-center hover:bg-blue-50" onClick={() => onAddItem(item)}>
                <div className="flex-1 pr-4">
                  <div className="font-bold text-slate-800 text-xs">
                    {item.Common_name}
                    {item.isSet && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[0.5rem] font-black uppercase tracking-tighter">ITEM SET</span>}
                  </div>
                  <div className="text-[0.55rem] text-slate-400 font-mono">{item.itemCode}</div>
                </div>
                <div className="text-right font-black text-blue-600 text-xs">{fmt(getPrice(item))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
