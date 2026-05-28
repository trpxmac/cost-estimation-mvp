import { Search, Plus } from 'lucide-react';
import { DRUG_SUB_CATEGORIES } from './ItemTable';

/**
 * Drug/service search panel with dropdown results.
 * Nursing service items are already merged into the search pool via getAllMedications().
 */
export default function SearchPanel({
  searchQuery,
  searchResults,
  currentRole,
  getPrice,
  fmt,
  onSearchChange,
  onAddItem,
  onNavigateAddNew
}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canAddNewItem = user.role === 'admin' || user.role === 'pharma' || user.role === 'nurse';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Search size={14} /> ค้นหารายการละเอียด ({currentRole === "pharma" ? "ยา" : "ค่าบริการ"})
        </h2>
        {canAddNewItem && (
          <button
            onClick={onNavigateAddNew}
            className="text-[0.6rem] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={10} /> เพิ่มยา/รายการใหม่
          </button>
        )}
      </div>

      <div>
        <div className="relative">
          <input
            type="text"
            className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
            placeholder="พิมพ์เพื่อค้นหา..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl max-h-[300px] overflow-y-auto divide-y shadow-inner transition-all duration-200">
            {searchResults.map(item => (
              <div
                key={item.itemCode}
                className="p-3 flex justify-between items-center hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    {item.Common_name}
                    {item.isSet && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[0.5rem] font-black uppercase tracking-tighter">
                        ITEM SET
                      </span>
                    )}
                  </div>
                  <div className="text-[0.55rem] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>{item.itemCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="font-black text-blue-600 text-xs">{fmt(getPrice(item))}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddItem(item)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> เพิ่ม
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
