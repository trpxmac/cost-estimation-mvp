import { Plus, Minus, Trash2, X } from 'lucide-react';
import { shouldSpecifyPrice } from '../hooks/useEstimationCalculator';

/**
 * Renders the item table for pharma or nurse sections.
 * Handles both individual items and grouped Set items with headers.
 */
const DRUG_SUB_CATEGORIES = [
  { value: 'chemo',    label: 'ยาเคมีบำบัด',      labelEn: 'Chemotherapy',     color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'targeted', label: 'ยาพุ่งเป้า',          labelEn: 'Targeted Therapy',  color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'gcsf',     label: 'ยากระตุ้นเม็ดเลือด',      labelEn: 'G-CSF',            color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'home',     label: 'ยากลับบ้าน',         labelEn: 'Home Medication',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'other',    label: 'ยาอื่นๆ',            labelEn: 'Other',             color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

export { DRUG_SUB_CATEGORIES };

export default function ItemTable({ items, getPrice, fmt, onUpdateQuantity, onUpdateGroupQuantity, onUpdateDose, onRemoveItem, onRemoveGroup, onUpdateCustomPrice, onUpdateNote, onUpdateItemDrugSubCategory, isViewMode, isReadOnlySection, billingRight }) {
  const readOnly = isViewMode || isReadOnlySection;
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
        const setSubItems = sortedItems.filter(x => x.setInstanceId === item.setInstanceId);
        const setTotal = setSubItems.reduce((sum, sub) => sum + getPrice(sub) * sub.quantity, 0);
        const setQty = Math.min(...setSubItems.map(x => x.quantity));

        groups.push({
          isGroupHeader: true,
          gid: item.setInstanceId,
          name: item.parentSetName,
          qty: setQty,
          total: setTotal,
          drugSubCategory: item.drugSubCategory
        });
        currentGid = item.setInstanceId;
      }
    } else {
      currentGid = null;
      groups.push(item);
    }
  });

  return (
    <table className="w-full text-[0.7rem] border-collapse mb-2">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="py-2 text-left text-[0.6rem] font-bold text-slate-400 uppercase">รายการ</th>
          <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[60px]">Dose</th>
          <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[80px]">QTY</th>
          <th className="py-2 text-right text-[0.6rem] font-bold text-slate-400 uppercase w-[100px]">รวม</th>
          {!readOnly && <th className="py-2 text-center text-[0.6rem] font-bold text-slate-400 uppercase w-[40px] no-print"></th>}
        </tr>
      </thead>
      <tbody>
        {groups.map((i) => {
          if (i.isGroupHeader) {
            return (
              <tr key={i.gid} className="bg-indigo-50/50 group/set border-b border-indigo-100">
                <td colSpan="2" className="py-2.5 px-3">
                  <div className="flex items-center">
                    <span className="bg-indigo-600 text-white text-[0.55rem] font-black px-1.5 py-0.5 rounded mr-2 uppercase shadow-sm">Set</span>
                    <span className="font-bold text-indigo-900">{i.name}</span>
                  </div>

                  {/* Selected right label (shown in print and read-only) */}
                  {i.drugSubCategory && readOnly && (
                    <div className="mt-1">
                      {(() => {
                        const sc = DRUG_SUB_CATEGORIES.find(s => s.value === i.drugSubCategory);
                        return sc ? (
                          <span className={`inline-block text-[0.5rem] font-black px-1.5 py-0.5 rounded border ${sc.color}`}>
                            {sc.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Clickable category selectors for pharma items */}
                  {!readOnly && (
                    <div className="flex gap-1 mt-2 flex-wrap no-print">
                      {DRUG_SUB_CATEGORIES.map(sc => {
                        const isCurrent = (i.drugSubCategory || 'other') === sc.value;
                        let btnColors = 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800';
                        if (isCurrent) {
                          if (sc.value === 'chemo') btnColors = 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10';
                          else if (sc.value === 'targeted') btnColors = 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/10';
                          else if (sc.value === 'gcsf') btnColors = 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/10';
                          else if (sc.value === 'home') btnColors = 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/10';
                          else btnColors = 'bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-500/10';
                        }
                        return (
                          <button
                            key={sc.value}
                            type="button"
                            onClick={() => onUpdateItemDrugSubCategory?.(i.gid, sc.value)}
                            className={`px-1.5 py-0.5 rounded border text-[0.55rem] font-bold transition-all cursor-pointer active:scale-95 ${btnColors}`}
                          >
                            {sc.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="py-2.5 text-center">
                  {readOnly ? (
                    <span className="text-center font-bold text-indigo-950">{i.qty} ชุด</span>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1 no-print">
                        <button onClick={() => onUpdateGroupQuantity(i.gid, -1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50 cursor-pointer"><Minus size={10} /></button>
                        <span className="w-6 text-center font-black text-indigo-700">{i.qty}</span>
                        <button onClick={() => onUpdateGroupQuantity(i.gid, 1)} className="bg-white border border-slate-200 rounded p-0.5 text-indigo-400 hover:bg-indigo-50 cursor-pointer"><Plus size={10} /></button>
                      </div>
                      <span className="hidden print:block text-center font-bold text-indigo-950">{i.qty} ชุด</span>
                    </>
                  )}
                </td>
                <td className="py-2.5 text-right font-black text-indigo-950 pr-2">
                  {fmt(i.total)}
                </td>
                {!readOnly && (
                  <td className="py-2.5 text-center no-print">
                    <button onClick={() => onRemoveGroup(i.gid)} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            );
          }
          return (
            <tr key={i.id} className={`border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${i.setInstanceId ? 'bg-indigo-50/10' : ''}`}>
              <td className={`py-2 ${i.setInstanceId ? 'pl-8' : 'px-2'}`}>
                <div className="font-bold text-slate-800 text-[0.7rem]">
                  {i.Common_name}
                </div>
                <div className="text-[0.55rem] text-slate-400 font-mono no-print">{i.itemCode}</div>
                {/* Subcategory label for pharma items */}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {(i.category === 'pharma' || !i.category) && i.drugSubCategory && (() => {
                    const sc = DRUG_SUB_CATEGORIES.find(s => s.value === i.drugSubCategory);
                    return sc ? (
                      <span className={`inline-block text-[0.5rem] font-black px-1.5 py-0.5 rounded border ${sc.color}`}>
                        {sc.label}
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Clickable category selectors for pharma items */}
                {(i.category === 'pharma' || !i.category) && !readOnly && (
                  <div className="flex gap-1 mt-1.5 flex-wrap no-print">
                    {DRUG_SUB_CATEGORIES.map(sc => {
                      const isCurrent = (i.drugSubCategory || 'other') === sc.value;
                      let btnColors = 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800';
                      if (isCurrent) {
                        if (sc.value === 'chemo') btnColors = 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10';
                        else if (sc.value === 'targeted') btnColors = 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/10';
                        else if (sc.value === 'gcsf') btnColors = 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/10';
                        else if (sc.value === 'home') btnColors = 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/10';
                        else btnColors = 'bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-500/10';
                      }
                      return (
                        <button
                          key={sc.value}
                          type="button"
                          onClick={() => onUpdateItemDrugSubCategory?.(i.id, sc.value)}
                          className={`px-1.5 py-0.5 rounded border text-[0.55rem] font-bold transition-all cursor-pointer active:scale-95 ${btnColors}`}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </td>
              <td className="py-2 text-center">
                {readOnly ? (
                  <span className="font-bold">{i.dose || "-"}</span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={i.dose || ""}
                      onChange={(e) => onUpdateDose(i.id, e.target.value)}
                      placeholder="-"
                      className="w-full text-center bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none text-[0.7rem] font-bold text-blue-600 no-print"
                    />
                    <span className="hidden print:inline font-bold">{i.dose || "-"}</span>
                  </>
                )}
              </td>
              <td className="py-2">
                {readOnly ? (
                  <span className="block text-center font-bold">{i.quantity}</span>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1 no-print">
                      {!i.setInstanceId && <button onClick={() => onUpdateQuantity(i.id, -1)} className="text-slate-300 hover:text-slate-500"><Minus size={12} /></button>}
                      <span className="w-4 text-center font-bold text-slate-700">{i.quantity}</span>
                      {!i.setInstanceId && <button onClick={() => onUpdateQuantity(i.id, 1)} className="text-slate-300 hover:text-slate-500"><Plus size={12} /></button>}
                    </div>
                    <span className="hidden print:block text-center font-bold">{i.quantity}</span>
                  </>
                )}
              </td>
              <td className="py-2 text-right pr-2">
                {(!readOnly && shouldSpecifyPrice(i.itemCode, billingRight)) ? (
                  <div className="flex flex-col items-end gap-1">
                    <input
                      type="number"
                      value={i.customPrice !== undefined ? i.customPrice : 0}
                      onChange={(e) => onUpdateCustomPrice(i.id, e.target.value)}
                      className="w-20 text-right bg-blue-50 border border-blue-200 rounded px-2 py-1 focus:border-blue-500 focus:outline-none font-black text-slate-900 no-print"
                    />
                    <div className="text-[0.55rem] text-slate-400 no-print">ระบุราคาเอง</div>
                    <div className="hidden print:block font-black text-slate-900">{fmt(getPrice(i) * i.quantity)}</div>
                  </div>
                ) : (
                  <>
                    <div className="font-black text-slate-900">{fmt(getPrice(i) * i.quantity)}</div>
                    <div className="text-[0.55rem] text-slate-400 no-print">@{fmt(getPrice(i))}</div>
                  </>
                )}
              </td>
              {!readOnly && (
                <td className="py-2 text-center no-print">
                  {!i.setInstanceId && (
                    <button onClick={() => onRemoveItem(i.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
