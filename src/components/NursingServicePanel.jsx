import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Info } from 'lucide-react';
import { NURSING_SERVICE_GROUPS, getNursingPrice, getNursingMaxPrice } from '../data/nursingServices';

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   header: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700',   tag: 'text-blue-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700', tag: 'text-indigo-500' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', header: 'text-violet-800', badge: 'bg-violet-100 text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700', tag: 'text-violet-500' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   header: 'text-rose-800',   badge: 'bg-rose-100 text-rose-700',   btn: 'bg-rose-600 hover:bg-rose-700',   tag: 'text-rose-500' },
  emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-200',header: 'text-emerald-800',badge: 'bg-emerald-100 text-emerald-700',btn: 'bg-emerald-600 hover:bg-emerald-700',tag: 'text-emerald-500' },
};

const fmt = (v) =>
  v === 0
    ? <span className="text-slate-300 font-bold text-xs">—</span>
    : new Intl.NumberFormat('th-TH').format(v);

function PriceTag({ label, value, max, color }) {
  const c = COLOR_MAP[color];
  const isNA = value === 0;
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.5rem] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>
      <span className={`text-[0.7rem] font-black ${isNA ? 'text-slate-300' : c.tag}`}>
        {isNA ? '—' : (
          <>
            {new Intl.NumberFormat('th-TH').format(value)}
            {max && max !== value && (
              <span className="text-slate-400 font-bold">–{new Intl.NumberFormat('th-TH').format(max)}</span>
            )}
          </>
        )}
      </span>
    </div>
  );
}

/**
 * NursingServicePanel — Quick-reference price panel for nursing services.
 * Shows all standard services grouped by category.
 * Props:
 *   billingRight  string  — currently selected billing mode: OPD | IPD | OPDTR | IPDTR
 *   onAddItem     fn      — called with a service item object to add to cart
 */
export default function NursingServicePanel({ billingRight = 'OPD', onAddItem }) {
  const [openGroups, setOpenGroups] = useState(() => new Set(NURSING_SERVICE_GROUPS.map(g => g.group)));
  const [addedCodes, setAddedCodes] = useState({});

  const toggleGroup = (group) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const handleAdd = (item) => {
    onAddItem({ ...item, id: undefined }); // let cart assign id
    setAddedCodes(prev => ({ ...prev, [item.itemCode]: true }));
    setTimeout(() => setAddedCodes(prev => ({ ...prev, [item.itemCode]: false })), 1500);
  };

  // Label pair for current billing right
  const billingLabel = {
    OPD: 'Thai OPD',
    IPD: 'Thai IPD',
    OPDTR: 'Foreign OPD',
    IPDTR: 'Foreign IPD',
  }[billingRight] || billingRight;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <span className="text-base">🩺</span>
          <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.18em]">
            Nursing Service Price Reference
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
          <Info size={10} className="text-indigo-400" />
          <span className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-wide">
            Active: {billingLabel}
          </span>
        </div>
      </div>

      {/* Price key legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-50 bg-gradient-to-r from-blue-50/40 to-transparent">
        <span className="text-[0.55rem] font-black text-slate-400 uppercase tracking-wider">Price (฿):</span>
        {['OPD','IPD','OPDTR','IPDTR'].map(k => (
          <div key={k} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${billingRight === k ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <span className={`text-[0.55rem] font-black uppercase ${billingRight === k ? 'text-indigo-600' : 'text-slate-400'}`}>
              {k === 'OPD' ? 'Thai OPD' : k === 'IPD' ? 'Thai IPD' : k === 'OPDTR' ? 'Foreign OPD' : 'Foreign IPD'}
            </span>
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="divide-y divide-slate-50">
        {NURSING_SERVICE_GROUPS.map((group) => {
          const c = COLOR_MAP[group.color];
          const isOpen = openGroups.has(group.group);

          return (
            <div key={group.group}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.group)}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:${c.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{group.icon}</span>
                  <span className={`text-[0.65rem] font-black uppercase tracking-wide ${c.header}`}>
                    {group.group}
                  </span>
                  <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded ${c.badge}`}>
                    {group.items.length} items
                  </span>
                </div>
                {isOpen
                  ? <ChevronDown size={14} className="text-slate-400" />
                  : <ChevronRight size={14} className="text-slate-400" />}
              </button>

              {/* Items */}
              {isOpen && (
                <div className={`px-3 pb-3 ${c.bg}/30`}>
                  {group.items.map((item) => {
                    const price = getNursingPrice(item, billingRight);
                    const maxPrice = item.isRange ? getNursingMaxPrice(item, billingRight) : null;
                    const justAdded = addedCodes[item.itemCode];

                    return (
                      <div
                        key={item.itemCode}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-1.5 border transition-all duration-200 ${
                          justAdded
                            ? `${c.bg} ${c.border} shadow-sm`
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        {/* Item info */}
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[0.7rem] font-black text-slate-800 leading-tight">
                              {item.Common_name}
                            </span>
                            {item.isPreparation && (
                              <span className="text-[0.5rem] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Prep
                              </span>
                            )}
                            {item.isRange && (
                              <span className="text-[0.5rem] font-black bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Range
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <PriceTag label="OPD" value={item.OPD} color={group.color} />
                            <PriceTag label="IPD" value={item.IPD} color={group.color} />
                            <div className="w-px h-5 bg-slate-100" />
                            <PriceTag label="OPD TR" value={item.OPDTR} color={group.color} />
                            <PriceTag label="IPD TR" value={item.IPDTR} color={group.color} />
                          </div>
                        </div>

                        {/* Active price + Add button */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-sm font-black font-mono ${price === 0 ? 'text-slate-300' : 'text-slate-800'}`}>
                            {price === 0 ? '—' : (
                              <>
                                ฿{new Intl.NumberFormat('th-TH').format(price)}
                                {maxPrice && maxPrice !== price && (
                                  <span className="text-slate-400 text-xs font-bold">
                                    –{new Intl.NumberFormat('th-TH').format(maxPrice)}
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => handleAdd(item)}
                            disabled={price === 0}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6rem] font-black text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                              justAdded ? 'bg-green-500' : c.btn
                            }`}
                          >
                            <Plus size={10} strokeWidth={3} />
                            {justAdded ? 'Added!' : 'Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 bg-amber-50/60 border-t border-amber-100">
        <p className="text-[0.6rem] text-amber-700 font-bold">
          ⚠️ ราคาอ้างอิงจากตารางมาตรฐาน Ward 1 วัน (IPD) และ OPD 4-6 ชม. — กรุณาตรวจสอบกับระบบ HIS ก่อนออกใบประมาณการจริง
        </p>
      </div>
    </div>
  );
}
