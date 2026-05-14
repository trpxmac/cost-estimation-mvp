import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchMedications, saveEstimation, updateEstimation, getEstimationById, getDoctors, getDiagnoses, getAssessors } from "../api";
import { useToast } from "../components/Toast";
import { User, Trash2, Search, FileText, Activity, Plus, Minus, Save, Printer, Pencil, Pill, CreditCard, Stethoscope, ClipboardCheck, ChevronRight, Calculator, UserRound, Users } from "lucide-react";

export default function CostEstimator() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // --- Form State ---
  const [hn, setHn] = useState("");
  const [vnan, setVnan] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [assessor, setAssessor] = useState("");
  const [bsa, setBsa] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [patientType, setPatientType] = useState("OPD");
  const [billingRight, setBillingRight] = useState("OPD");
  const [courseCycles, setCourseCycles] = useState(1);

  // --- New Features State ---
  const [insurance, setInsurance] = useState("Self pay");
  const [agreement, setAgreement] = useState("agrees"); // "agrees" | "declines"
  const [prepFeeQty, setPrepFeeQty] = useState(1);
  const prepFeeRate = 3000; // ราคาค่าตู้ต่อครั้ง

  // --- Role & Totals ---
  const [currentRole, setCurrentRole] = useState("pharma"); // "pharma" | "nurse"

  // Search & Items
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Master Data
  const [doctors, setDoctors] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [assessors, setAssessors] = useState([]);

  useEffect(() => {
    getDoctors().then(setDoctors);
    getDiagnoses().then(setDiagnoses);
    getAssessors().then(setAssessors);
  }, []);

  useEffect(() => {
    const s = location.state;
    if (!s) return;

    if (s.editRecord) {
      const r = s.editRecord;
      setHn(r.hn || ""); setVnan(r.vnan || ""); setPatientName(r.patientName || "");
      setDoctorName(r.doctorName || ""); setDiagnosis(r.diagnosis || "");
      setAssessor(r.assessor || ""); setBsa(r.bsa || "");
      setPatientType(r.patientType || "OPD");
      setBillingRight(r.billingRight || r.patientType || "OPD");
      setCourseCycles(r.courseCycles || 1);
      setInsurance(r.insurance || "Self pay");
      setAgreement(r.agreement || "agrees");
      setPrepFeeQty(r.prepFeeQty ?? 1);
      setSelectedItems(r.selectedItems || []);
      setEditingId(r.id);
    } else {
      if (s.hn) setHn(s.hn);
      if (s.patientName) setPatientName(s.patientName);
      if (s.patientType) setPatientType(s.patientType);
      if (s.billingRight) setBillingRight(s.billingRight);
      else if (s.patientType) setBillingRight(s.patientType);
      if (s.preSelectedItem) handleAddItem(s.preSelectedItem);
    }
  }, [location.state]);

  useEffect(() => {
    searchMedications(searchQuery).then(results => {
      // Filter results based on role
      if (currentRole === "pharma") setSearchResults(results.filter(i => i.category === "pharma"));
      else setSearchResults(results.filter(i => i.category === "nurse" || i.isPreparation));
    });
  }, [searchQuery, currentRole]);

  const getPrice = (item) => item[billingRight] || item["OPD"] || 0;

  const pharmaItems = selectedItems.filter(i => i.category === "pharma" || (!i.isPreparation && i.category !== "nurse"));
  const nurseItems = selectedItems.filter(i => i.category === "nurse" || i.isPreparation);

  const pharmaTotal = pharmaItems.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const nurseTotal = nurseItems.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const prepFeeTotal = prepFeeQty * prepFeeRate; // คำนวณค่าตู้รวม

  const grandTotal = pharmaTotal + nurseTotal + prepFeeTotal; // รวมค่าตู้เข้าใน Grand Total
  const totalCourse = grandTotal * courseCycles;

  const fmt = (v) => new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);

  const handleAddItem = (item) => {
    setSelectedItems(prev => [...prev, { ...item, id: Date.now().toString() + Math.random(), quantity: 1, dose: "" }]);
    setSearchQuery("");
  };

  const updateQuantity = (id, d) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const updateDose = (id, dose) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, dose } : i));
  const removeItem = (id) => setSelectedItems(prev => prev.filter(i => i.id !== id));

  const handleSave = async () => {
    if (grandTotal === 0 && selectedItems.length === 0) { toast.warning("กรุณาเพิ่มรายการ"); return; }
    try {
      let finalItems = [...selectedItems];
      
      // --- Concurrency Merge Logic ---
      if (editingId) {
        const latest = await getEstimationById(editingId);
        if (latest) {
          // Merge items from the OTHER role to prevent overwriting
          if (currentRole === "pharma") {
            const latestNurse = latest.selectedItems.filter(i => i.category === "nurse" || i.isPreparation);
            const myPharma = selectedItems.filter(i => i.category === "pharma" || (!i.isPreparation && i.category !== "nurse"));
            finalItems = [...myPharma, ...latestNurse];
          } else {
            const latestPharma = latest.selectedItems.filter(i => i.category === "pharma" || (!i.isPreparation && i.category !== "nurse"));
            const myNurse = selectedItems.filter(i => i.category === "nurse" || i.isPreparation);
            finalItems = [...latestPharma, ...myNurse];
          }
        }
      }

      // --- Smart Status Logic ---
      const hasPharma = finalItems.some(i => i.category === "pharma" || (!i.isPreparation && i.category !== "nurse"));
      const hasNurse = finalItems.some(i => i.category === "nurse" || i.isPreparation);
      const status = (hasPharma && hasNurse) ? "สมบูรณ์" : (hasPharma ? "รอพยาบาล" : "รอเภสัช");

      // Recalculate totals based on merged items
      const pTotal = finalItems.filter(i => i.category === "pharma" || (!i.isPreparation && i.category !== "nurse")).reduce((s, i) => s + getPrice(i) * i.quantity, 0);
      const nTotal = finalItems.filter(i => i.category === "nurse" || i.isPreparation).reduce((s, i) => s + getPrice(i) * i.quantity, 0);
      const gTotal = pTotal + nTotal + (prepFeeQty * prepFeeRate);

      const record = {
        id: editingId || Date.now().toString(),
        savedAt: new Date().toISOString(),
        hn, vnan, patientName, doctorName, diagnosis, assessor, bsa,
        patientType, billingRight, insurance, agreement, prepFeeQty, prepFeeTotal: (prepFeeQty * prepFeeRate),
        courseCycles, 
        selectedItems: finalItems,
        pharmaTotal: pTotal, nurseTotal: nTotal, grandTotal: gTotal, totalCourse: gTotal * courseCycles,
        status,
        lastUpdatedBy: currentRole
      };

      if (editingId) await updateEstimation(editingId, record);
      else await saveEstimation(record);

      toast.success(status === "สมบูรณ์" ? "บันทึกข้อมูลสมบูรณ์" : `บันทึกแล้ว (${status})`);
      if (!editingId) navigate("/patients");
      else {
        // If editing, refresh local items to show merged result
        setSelectedItems(finalItems);
      }
    } catch (e) { toast.error("เกิดข้อผิดพลาด"); }
  };

  const lblCls = "block text-[0.65rem] font-black text-slate-400 mb-1 uppercase tracking-wider";
  const inputCls = "w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500";

  return (
    <>
      <style>{`@media print{@page{size:A4;margin:10mm;}body *{visibility:hidden!important;}#print-area,#print-area *{visibility:visible!important;}#print-area{position:fixed;top:0;left:0;width:100%;}.no-print{display:none!important;}}`}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto pb-10">

        {/* Left Side */}
        <div className="lg:col-span-5 flex flex-col gap-5 no-print">

          {/* Role Switcher */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-2xl shadow-lg">
            <div className="flex bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
              <button onClick={() => setCurrentRole("pharma")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "pharma" ? "bg-white text-blue-700 shadow-xl" : "text-white hover:bg-white/5"}`}>
                <Pill size={18} /> เภสัชกร
              </button>
              <button onClick={() => setCurrentRole("nurse")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-all ${currentRole === "nurse" ? "bg-white text-indigo-700 shadow-xl" : "text-white hover:bg-white/5"}`}>
                <Stethoscope size={18} /> พยาบาล
              </button>
            </div>
          </div>

          {/* Setup Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[0.65rem] font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
              <UserRound size={14} /> ข้อมูลเบื้องต้น
            </h2>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                <div><label className={lblCls}>HN</label><input className={inputCls} value={hn} onChange={e => setHn(e.target.value)} /></div>
                <div><label className={lblCls}>VN / AN</label><input className={inputCls} value={vnan} onChange={e => setVnan(e.target.value)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1"><label className={lblCls}>ชื่อผู้ป่วย</label><input className={inputCls} value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
                <div>
                  <label className={lblCls}>ประเภทผู้ป่วย</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    {["OPD", "IPD"].map(t => (
                      <button key={t} onClick={() => setPatientType(t)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${patientType === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ปรับแก้ 1: เพิ่มสิทธิที่ใช้ (Insurance) ตรงนี้ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>ประเภทราคา (Pricing Right)</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    {["OPD", "IPD", "OPDTR", "IPDTR"].map(r => (
                      <button key={r} onClick={() => setBillingRight(r)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${billingRight === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lblCls}>สิทธิที่ใช้ (Insurance)</label>
                  <select className={inputCls} value={insurance} onChange={e => setInsurance(e.target.value)}>
                    <option value="Self pay">Self pay</option>
                    <option value="ประกันไทย">ประกันไทย</option>
                    <option value="ประกันต่างชาติ">ประกันต่างชาติ</option>
                    <option value="ประกันสังคม">ประกันสังคม</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className={lblCls}>ผู้ประเมิน</label><select className={inputCls} value={assessor} onChange={e => setAssessor(e.target.value)}><option value="">-- เลือก --</option>{assessors.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                <div><label className={lblCls}>แพทย์</label><select className={inputCls} value={doctorName} onChange={e => setDoctorName(e.target.value)}><option value="">-- เลือก --</option>{doctors.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className={lblCls}>Diagnosis</label><select className={inputCls} value={diagnosis} onChange={e => setDiagnosis(e.target.value)}><option value="">-- เลือก --</option>{diagnoses.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>

              {/* ปรับแก้ 2: เพิ่มการตกลงรักษา */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblCls}>BSA (m²)</label>
                  <input type="number" className={inputCls} value={bsa} onChange={e => setBsa(e.target.value)} />
                </div>
                <div>
                  <label className={lblCls}>ผป. ตกลงรักษาไหม?</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input type="radio" value="agrees" checked={agreement === "agrees"} onChange={e => setAgreement(e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                      ตกลง
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input type="radio" value="declines" checked={agreement === "declines"} onChange={e => setAgreement(e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                      ไม่ตกลง
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Search Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[0.65rem] font-black mb-3 text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Search size={14} /> ค้นหารายการละเอียด ({currentRole === "pharma" ? "ยา" : "ค่าบริการ"})
            </h2>
            <div className="relative">
              <input type="text" className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500" placeholder="ค้นหา..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-2 max-h-[250px] overflow-y-auto z-50 shadow-2xl divide-y">
                  {searchResults.map(item => (
                    <div key={item.itemCode} className="p-3 cursor-pointer flex justify-between items-center hover:bg-blue-50" onClick={() => handleAddItem(item)}>
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-slate-800 text-xs">{item.Common_name}</div>
                        <div className="text-[0.55rem] text-slate-400 font-mono">{item.itemCode}</div>
                      </div>
                      <div className="text-right font-black text-blue-600 text-xs">{fmt(getPrice(item))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div id="print-area" className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm min-h-[700px] flex flex-col relative overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
                <div>
                  <h1 className="text-xl font-black text-[#0F294D]">ใบประมาณการค่าใช้จ่าย</h1>
                  <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Collaborative Cost Estimation</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.6rem] text-slate-400 font-bold mt-2 font-mono">{billingRight} | {new Date().toLocaleDateString("th-TH")}</div>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-[0.8rem]">
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">HN:</span><span className="font-black">{hn || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">VN/AN:</span><span className="font-black">{vnan || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ชื่อผู้ป่วย:</span><span className="font-black">{patientName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ประเภทผู้ป่วย:</span><span className="font-black">{patientType || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ผู้ประเมิน:</span><span className="font-black">{assessor || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">แพทย์:</span><span className="font-black">{doctorName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Diagnosis:</span><span className="font-black">{diagnosis || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">สิทธิที่ใช้:</span><span className="font-black">{insurance}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">การตกลงรักษา:</span>
                <span className={`font-black ${agreement === "agrees" ? "text-green-600" : "text-red-500"}`}>{agreement === "agrees" ? "ตกลงรักษา" : "ไม่ตกลง"}</span>
              </div>
            </div>

            {/* Summary Sections */}
            <div className="flex-1 space-y-5">
              {/* Pharma Part */}
              <div className={`rounded-2xl border transition-all bg-white border-blue-200`}>
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-blue-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-blue-700 uppercase flex items-center gap-2"><Pill size={14} /> ส่วนงานเภสัชกรรม</span>
                  <span className="text-xs font-black text-blue-900">{fmt(pharmaTotal)}</span>
                </div>
                <div className="p-4">
                  {pharmaItems.length > 0 ? renderTable(pharmaItems, billingRight, "") : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการยา</div>}
                </div>
              </div>

              {/* Nurse Part */}
              <div className={`rounded-2xl border transition-all bg-white border-indigo-200`}>
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-indigo-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-indigo-700 uppercase flex items-center gap-2"><Stethoscope size={14} /> ส่วนงานพยาบาลและบริการ</span>
                  <span className="text-xs font-black text-indigo-900">{fmt(nurseTotal)}</span>
                </div>
                <div className="p-4">
                  {nurseItems.length > 0 ? renderTable(nurseItems, billingRight, "") : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการบริการ</div>}
                </div>
              </div>
            </div>

            {/* Sum Section */}
            {grandTotal > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-slate-100">

                {/* ปรับแก้ 3: แทรกกล่องเพิ่มจำนวนค่าตู้ (Prep Fee) ตรงนี้ */}
                <div className="flex justify-between items-center mb-4 px-1 pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">
                    ค่าตู้+เวชภัณฑ์+ค่าเตรียมยา <span className="text-slate-400 font-medium">(@ {fmt(prepFeeRate)})</span>
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
                      <button onClick={() => setPrepFeeQty(Math.max(0, prepFeeQty - 1))} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 no-print"><Minus size={14} /></button>
                      <span className="w-8 text-center font-bold text-slate-700 text-xs">{prepFeeQty}</span>
                      <button onClick={() => setPrepFeeQty(prepFeeQty + 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 no-print"><Plus size={14} /></button>
                    </div>
                    <span className="font-black text-slate-800 w-[60px] text-right text-[0.8rem]">{fmt(prepFeeTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-5 px-1">
                  <div className="flex flex-col"><span className="text-[0.65rem] font-black text-slate-400 uppercase">Estimated Total</span><span className="text-xs font-bold text-slate-700">ประมาณการยอดรวมทั้งสิ้น</span></div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase">{courseCycles} Cycles ×</span>
                    <span className="text-4xl font-black text-[#0F294D] font-mono tracking-tighter">{fmt(totalCourse)}</span>
                    <span className="text-xs font-bold text-slate-400">THB</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 no-print">
                  <button onClick={handleSave} className="bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-50 border-2 border-slate-100 shadow-sm active:scale-95">
                    {editingId ? "อัปเดตข้อมูล" : (currentRole === "pharma" ? "บันทึกและส่งต่อพยาบาล" : "บันทึกและส่งต่อเภสัช")}
                  </button>
                  <button onClick={() => window.print()} className="bg-[#0F294D] text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95">พิมพ์ใบประเมินราคา</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Minimal Helper for Table since it was a variable before
function renderTable(items, t, c) {
  const fmt = (v) => new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);
  return (
    <table className="w-full text-[0.7rem] border-collapse mb-2">
      <tbody>
        {items.map(i => (
          <tr key={i.id} className="border-b border-slate-50">
            <td className="py-1 text-slate-800 font-bold">{i.Common_name}</td>
            <td className="py-1 text-right text-slate-400">{i.quantity} × {fmt(i[t] || i["OPD"])}</td>
            <td className="py-1 text-right font-black text-slate-700">{fmt(i.quantity * (i[t] || i["OPD"]))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}