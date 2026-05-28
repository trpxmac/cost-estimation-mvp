import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Info, Save, Activity, PlusCircle, Pill, Stethoscope } from 'lucide-react';
import { addNewDrug, addNewDiagnosis } from '../api';
import { useToast } from '../components/Toast';
import SetItemEditor from '../components/SetItemEditor';
import { DRUG_SUB_CATEGORIES } from '../components/ItemTable';

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-slate-900 text-[0.93rem] focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10';
const selCls = inputCls + ' appearance-auto';
const lblCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

export default function AddNewItem() {
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const editItem = location.state?.editItem;
  const [tab, setTab] = useState('drug');

  const [drugCode, setDrugCode] = useState('');
  const [drugName, setDrugName] = useState('');
  const [drugCat, setDrugCat] = useState('pharma');
  const [drugSubCat, setDrugSubCat] = useState('');
  const [drugStock, setDrugStock] = useState('');
  
  const [opd, setOpd] = useState('');
  const [ipd, setIpd] = useState('');
  const [opdtr, setOpdtr] = useState('');
  const [ipdtr, setIpdtr] = useState('');

  const [t2opd, setT2opd] = useState('');
  const [t2ipd, setT2ipd] = useState('');

  const [t4opd, setT4opd] = useState('');
  const [t4ipd, setT4ipd] = useState('');
  const [t4opdtr, setT4opdtr] = useState('');
  const [t4ipdtr, setT4ipdtr] = useState('');

  const [saving, setSaving] = useState(false);
  const [diseaseName, setDiseaseName] = useState('');
  const [savingDis, setSavingDis] = useState(false);

  // --- Item Set State ---
  const [setItems, setSetItems] = useState([]);
  const [isSetMode, setIsSetMode] = useState(false);
  const [setSearch, setSetSearch] = useState('');
  const [setResults, setSetResults] = useState([]);

  useEffect(() => {
    if (editItem) {
      setDrugCode(editItem.itemCode || '');
      setDrugName(editItem.Common_name || '');
      setDrugCat(editItem.category || 'pharma');
      setDrugSubCat(editItem.drugSubCategory || '');
      setOpd(editItem.OPD || '');
      setIpd(editItem.IPD || '');
      setOpdtr(editItem.OPDTR || '');
      setIpdtr(editItem.IPDTR || '');
      setDrugStock(editItem.stock !== undefined && editItem.stock !== null ? String(editItem.stock) : '');
      setSetItems(editItem.items || []);
      setIsSetMode(!!editItem.isSet);
    }
  }, [editItem]);

  useEffect(() => {
    if (setSearch.length > 1) {
      import('../api').then(m => {
        m.getAllMedications().then(all => {
          setSetResults(all.filter(i => !i.isSet && (i.Common_name.toLowerCase().includes(setSearch.toLowerCase()) || i.itemCode.toLowerCase().includes(setSearch.toLowerCase()))));
        });
      });
    } else setSetResults([]);
  }, [setSearch]);

  const handleSaveDrug = async () => {
    if (!drugName.trim()) {
      toast.warning('กรุณากรอกชื่อยา', 'ชื่อยาเป็นข้อมูลที่จำเป็น');
      return;
    }
    setSaving(true);
    try {
      const itemData = {
        itemCode: drugCode,
        Common_name: drugName,
        category: drugCat,
        drugSubCategory: drugCat === 'pharma' ? drugSubCat : '',
        OPD: opd,
        IPD: ipd,
        OPDTR: opdtr,
        IPDTR: ipdtr,
        stock: isSetMode || drugCat === 'nurse' || drugStock.trim() === '' ? null : Number(drugStock),
        isSet: isSetMode,
        items: isSetMode ? setItems : undefined
      };
      await addNewDrug(itemData);
      toast.success(editItem ? 'อัปเดตข้อมูลสำเร็จ!' : 'บันทึกสำเร็จ!', `เรียบร้อยแล้ว`);
      if (editItem) navigate('/drug-prices');
      else {
        setDrugCode(''); setDrugName('');
        setOpd(''); setIpd(''); setOpdtr(''); setIpdtr('');
        setSetItems([]); setIsSetMode(false);
      }
    } catch (e) {
      toast.error('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  const handleSaveDiagnosis = async () => {
    if (!diseaseName.trim()) {
      toast.warning('กรุณากรอกชื่อโรค', 'ชื่อโรคเป็นข้อมูลที่จำเป็น');
      return;
    }
    setSavingDis(true);
    try {
      await addNewDiagnosis(diseaseName.trim());
      toast.success('บันทึกสำเร็จ!', `เพิ่ม "${diseaseName}" เข้า Diagnosis list แล้ว`);
      setDiseaseName('');
    } catch (e) {
      toast.error('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด');
    }
    setSavingDis(false);
  };

  const PriceInput = ({ label, value, onChange }) => (
    <div>
      <label className={lblCls}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
        <input type="number" className={inputCls + ' pl-8'} placeholder="0.00" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      <div className="flex items-center gap-2 text-slate-500 text-[0.85rem] mb-5">
        <span>Inventory</span><ChevronRight size={14} /><span className="font-semibold text-slate-900">{editItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</span>
      </div>
      
      {!editItem && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => setTab('drug')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === 'drug' ? 'bg-[#0F294D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Pill size={15} /> เพิ่มยา/เวชภัณฑ์ใหม่
          </button>
          <button onClick={() => setTab('disease')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === 'disease' ? 'bg-[#0F294D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Stethoscope size={15} /> เพิ่มโรค / Diagnosis
          </button>
        </div>
      )}

      {tab === 'drug' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-7">
            <div>
              <h1 className="text-xl font-bold mb-1 text-slate-900">{editItem ? 'แก้ไขข้อมูลยา / Edit Drug' : 'เพิ่มยาตัวใหม่ / Add New Drug'}</h1>
              <p className="text-slate-500 text-sm">{editItem ? 'แก้ไขรายละเอียดราคาและข้อมูลของรายการเดิม' : 'กรอกข้อมูลรายละเอียดของยาและราคาแต่ละประเภทเพื่อบันทึกเข้าระบบ'}</p>
            </div>
            <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Activity size={15} /> {editItem ? `ID: ${drugCode}` : 'Code: AUTO-GEN'}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={lblCls}>
                  {drugCat === 'nurse' ? 'Service ID (รหัสบริการ)' : 'Drug ID (รหัสยา)'}
                </label>
                <input className={inputCls} placeholder={drugCat === 'nurse' ? 'e.g. NRS-001 (ไม่กรอก = auto)' : 'e.g. PHA-001 (ไม่กรอก = auto)'} value={drugCode} onChange={e => setDrugCode(e.target.value)} disabled={!!editItem} />
              </div>
              {drugCat !== 'nurse' ? (
                <div>
                  <label className={lblCls}>Stock (จำนวนตั้งต้น)</label>
                  <input type="number" className={inputCls} placeholder="ไม่ระบุ" value={drugStock} onChange={e => setDrugStock(e.target.value)} />
                </div>
              ) : (
                <div></div>
              )}
            </div>

            <div>
              <label className={lblCls}>Category (ประเภท)</label>
              <div className="flex gap-3 bg-slate-100 p-1 rounded-xl max-w-md">
                <button
                  type="button"
                  onClick={() => setDrugCat('pharma')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                    drugCat === 'pharma'
                      ? 'bg-white text-blue-700 shadow-sm shadow-blue-500/5'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💊 Pharma (ยา)
                </button>
                <button
                  type="button"
                  onClick={() => setDrugCat('nurse')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                    drugCat === 'nurse'
                      ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🩺 Nursing Service (บริการพยาบาล)
                </button>
              </div>
            </div>



            <div className="mt-4 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <label className={lblCls}>
                  {isSetMode
                    ? 'Item Set Name (ชื่อชุดรายการ) *'
                    : drugCat === 'nurse'
                      ? 'Service Name (ชื่อบริการ) *'
                      : 'Drug Name (ชื่อยา) *'}
                </label>
                <input
                  className={inputCls}
                  placeholder={
                    isSetMode
                      ? 'e.g. Minor Surgery Set, Chemo Set A'
                      : drugCat === 'nurse'
                        ? 'e.g. Ward Fee (ค่าห้องพัก), Nursing Fee (ค่าพยาบาล)'
                        : 'e.g. Paracetamol 500mg (พาราเซตามอล)'
                  }
                  value={drugName}
                  onChange={e => setDrugName(e.target.value)}
                />
              </div>
              {!editItem && (
                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer bg-indigo-50 px-4 py-2.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <input type="checkbox" checked={isSetMode} onChange={e => setIsSetMode(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700">สร้างเป็นชุดรายการ (Item Set)</span>
                  </label>
                </div>
              )}
            </div>

            {isSetMode ? (
              <SetItemEditor
                setItems={setItems}
                onSetItemsChange={setSetItems}
                setSearch={setSearch}
                setResults={setResults}
                onSearchChange={setSetSearch}
              />
            ) : (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold mb-5 text-[#0F294D] flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  Pricing by Patient Right (ราคาตามสิทธิการรักษา)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Thai patients */}
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🇹🇭</span>
                      <span className="text-xs font-black text-blue-800 uppercase tracking-wider">Thai (ผู้ป่วยไทย)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <PriceInput label="OPD (ผู้ป่วยนอก)" value={opd} onChange={setOpd} />
                      <PriceInput label="IPD (ผู้ป่วยใน)" value={ipd} onChange={setIpd} />
                    </div>
                  </div>
                  {/* Foreign patients */}
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🌏</span>
                      <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Foreign / Inter (ต่างชาติ)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <PriceInput label="OPD TR (ผู้ป่วยนอก)" value={opdtr} onChange={setOpdtr} />
                      <PriceInput label="IPD TR (ผู้ป่วยใน)" value={ipdtr} onChange={setIpdtr} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[0.85rem] text-blue-800 leading-relaxed">
                {editItem?.isSet 
                  ? "แก้ไขราคารายการย่อยในชุด ยอดรวมจะถูกคำนวณใหม่โดยอัตโนมัติเมื่อนำไปใช้ในหน้าประเมินราคาครับ"
                  : "ระบุราคาตามประเภทผู้ป่วย หากราคาเท่ากันในบางหมวด สามารถกรอกตัวเลขเดียวกันได้ครับ"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
            <button className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onClick={() => navigate('/drug-prices')}>ยกเลิก</button>
            <button onClick={handleSaveDrug} disabled={saving} className="bg-[#0F294D] text-white px-10 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50">
              <Save size={18} /> {saving ? 'กำลังบันทึก...' : (editItem ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูลยา')}
            </button>
          </div>
        </div>
      )}

      {tab === 'disease' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-1 text-slate-900">เพิ่มรายชื่อโรค / Add Diagnosis</h2>
          <p className="text-slate-500 text-sm mb-6">รายชื่อที่เพิ่มจะไปปรากฏในรายการ Diagnosis ของหน้าประเมินราคา</p>
          
          <div className="space-y-4">
            <div>
              <label className={lblCls}>ชื่อโรค / Diagnosis Name *</label>
              <input className={inputCls} placeholder="เช่น CA breast, Lung Cancer" value={diseaseName} onChange={e => setDiseaseName(e.target.value)} />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[0.85rem] text-amber-800">ข้อมูลนี้จะถูกเก็บไว้ในเครื่องของคุณ (Local Storage) และพร้อมใช้งานใน Dropdown ทันที</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
             <button onClick={handleSaveDiagnosis} disabled={savingDis} className="bg-[#0F294D] text-white px-10 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50">
              <PlusCircle size={18} /> {savingDis ? 'กำลังบันทึก...' : 'เพิ่มรายชื่อโรค'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
