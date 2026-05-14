import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ เอา medicalItems ออก และเหลือแค่ getAllItems อย่างเดียว
import { getAllItems } from '../data';
import { useToast } from '../components/Toast';
import { Search, ArrowUpDown, DollarSign, Tag, Plus, Pencil } from 'lucide-react';

const TYPES = ['OPD', 'IPD', 'OPDTR', 'IPDTR'];

export default function DrugPrices() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Common_name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'drug' | 'preparation'

  // ✅ ดึงข้อมูลทั้งหมดมาเก็บไว้ในตัวแปร allItems
  const allItems = useMemo(() => getAllItems(), []);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const formatCurrency = (val) =>
    val != null
      ? new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val)
      : '-';

  const filtered = useMemo(() => {
    // ✅ ใช้ข้อมูลจาก allItems เพื่อมาทำการกรอง (Filter)
    let items = [...allItems];

    if (filterType === 'drug') items = items.filter(i => !i.isPreparation);
    if (filterType === 'preparation') items = items.filter(i => i.isPreparation);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.Common_name.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => {
      let va = a[sortBy] ?? 0;
      let vb = b[sortBy] ?? 0;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, sortBy, sortDir, filterType, allItems]);

  const SortIcon = ({ col }) => (
    <ArrowUpDown
      size={13}
      className={`inline ml-1 ${sortBy === col ? 'text-blue-600' : 'text-slate-300'}`}
    />
  );

  // ✅ Stats: เปลี่ยนจากการใช้ medicalItems (ที่ไม่มีแล้ว) มาเป็น allItems แทน
  const totalDrugs = allItems.filter(i => !i.isPreparation).length;
  const totalPrep = allItems.filter(i => i.isPreparation).length;

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalDrugs}</div>
            <div className="text-xs text-slate-500">Items (OPD)</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text"
              className="w-full border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Search by name or code..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {[
              { v: 'all', l: 'All' },
              { v: 'preparation', l: 'Item Set' }
            ].map(f => (
              <button key={f.v} onClick={() => setFilterType(f.v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filterType === f.v ? 'bg-[#0F294D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 ml-auto">{filtered.length} items found</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('itemCode')}>
                  Item Code <SortIcon col="itemCode" />
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('Common_name')}>
                  Medication <SortIcon col="Common_name" />
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-[50px]">Type</th>
                <th className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('stock')}>
                  Stock <SortIcon col="stock" />
                </th>
                {TYPES.map(t => (
                  <th key={t} className="p-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                    onClick={() => handleSort(t)}>
                    {t} <SortIcon col={t} />
                  </th>
                ))}
                <th className="p-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400">
                    <Search size={36} className="opacity-20 mx-auto mb-2" />
                    <p className="text-sm">No items found</p>
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr key={item.itemCode}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${item.isPreparation ? 'bg-amber-50' : ''}`}>
                  <td className="p-3 font-mono text-xs text-slate-400">{item.itemCode}</td>
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{item.Common_name}</div>
                  </td>
                  <td className="p-3 text-center">
                    {item.isPreparation
                      ? <span className="text-[0.65rem] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Item Set</span>
                      : <span className="text-[0.65rem] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Drug</span>
                    }
                  </td>
                  <td className="p-3 text-center">
                    {item.stock !== undefined ? (
                      <span className={`font-black ${item.stock <= 5 ? 'text-rose-500' : 'text-slate-700'}`}>
                        {item.stock}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  {TYPES.map(t => {
                    const val = item.isSet && item.items 
                      ? item.items.reduce((s, sub) => s + (sub[t] || 0) * (sub.quantity || 1), 0)
                      : item[t];
                    return (
                      <td key={t} className={`p-3 text-right font-semibold ${t === 'OPD' ? 'text-blue-700' : t === 'IPD' ? 'text-green-700' : t === 'OPDTR' ? 'text-amber-700' : 'text-purple-700'}`}>
                        {formatCurrency(val)}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => navigate('/add-item', { state: { editItem: item } })}
                      className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-white text-[#0F294D] border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-400">
          <span>* Unit prices in THB | Data synchronized with iMed API</span>
        </div>
      </div>
    </div>
  );
}