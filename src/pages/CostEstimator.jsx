import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchMedications, saveEstimation, updateEstimation, getEstimationById, getDoctors, getDiagnoses, getAssessors, addNewDiagnosis, getPatientByHN, getAllMedications } from "../api";
import { useToast } from "../components/Toast";
import { Pill, Stethoscope, Minus, Plus, X } from "lucide-react";
import { DRUG_SUB_CATEGORIES } from "../components/ItemTable";

// --- Extracted Components ---
import RoleSwitcher from "../components/RoleSwitcher";
import ItemTable from "../components/ItemTable";
import PatientInfoForm from "../components/PatientInfoForm";
import SearchPanel from "../components/SearchPanel";

// --- Extracted Business Logic ---
import { useEstimationCalculator, mergeRoleItems, determineStatus, getItemPrice } from "../hooks/useEstimationCalculator";

export default function CostEstimator() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // --- Read user once (was duplicated 3x before) ---
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const isAdmin = userRole === 'admin';

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
  const [insurance, setInsurance] = useState("Self pay");
  const [agreement, setAgreement] = useState("declines");
  const [freeNote, setFreeNote] = useState("");


  // --- Role ---
  const [currentRole, setCurrentRole] = useState(() => (user.role === 'nurse' ? 'nurse' : 'pharma'));
  const [isViewMode, setIsViewMode] = useState(false);

  // --- Search & Items ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [draftItems, setDraftItems] = useState([]);

  useEffect(() => {
    getAllMedications().then(setAllMedications);
  }, []);

  // --- Master Data ---
  const [doctors, setDoctors] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [assessors, setAssessors] = useState([]);

  // --- Modal State ---
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [newDiagnosisName, setNewDiagnosisName] = useState("");

  useEffect(() => {
    getDoctors().then(setDoctors);
    getDiagnoses().then(setDiagnoses);
    getAssessors().then(setAssessors);
  }, []);

  // --- Auto-fetch Patient by HN ---
  useEffect(() => {
    if (!hn.trim() || editingId) return;
    const timer = setTimeout(async () => {
      const p = await getPatientByHN(hn.trim());
      if (p) {
        setPatientName(p.name_th || p.name_en || "");
        if (p.type) {
          setPatientType(p.type);
          let right = p.type;
          if (p.nationality === 'INTERNATIONAL') right += 'TR';
          setBillingRight(right);
        }
        if (p.doctor) setDoctorName(p.doctor);
        if (p.insurance) setInsurance(p.insurance);
        toast.success("พบข้อมูลผู้ป่วย", "ดึงข้อมูลจาก iMed สำเร็จ");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [hn, editingId]);

  // --- Calculation Hook ---
  const { getPrice, fmt, drugTotal, nurseTotal, prepTotal, pharmaTotal, grandTotal, totalCourse, pharmaItems, nurseItems } =
    useEstimationCalculator(selectedItems, billingRight, courseCycles);

  // --- Form onChange handler for PatientInfoForm ---
  const formSetterMap = { hn: setHn, vnan: setVnan, patientName: setPatientName, doctorName: setDoctorName, diagnosis: setDiagnosis, assessor: setAssessor, bsa: setBsa, patientType: setPatientType, billingRight: setBillingRight, insurance: setInsurance, agreement: setAgreement };
  const handleFormChange = (field, value) => formSetterMap[field]?.(value);
  const formValues = { hn, vnan, patientName, patientType, billingRight, insurance, assessor, doctorName, diagnosis, bsa, agreement };

  // --- Role switch handler ---
  const handleRoleSwitch = (newRole) => {
    if (isAdmin || newRole === userRole) {
      setCurrentRole(newRole);
    } else {
      toast.warning("เข้าถึงไม่ได้", `คุณลงชื่อเข้าใช้ในฐานะ${userRole === 'nurse' ? 'พยาบาล' : 'เภสัชกร'} จึงไม่สามารถสลับไปส่วนงานอื่นได้ครับ`);
    }
  };

  // --- Populate from location.state (edit or pre-select) ---
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
      setAgreement(r.agreement || "declines");
      setFreeNote(r.freeNote || "");

      setSelectedItems(r.selectedItems || []);
      setEditingId(r.id);
      if (r.status === 'สมบูรณ์' && !s.forceEdit) setIsViewMode(true);
    } else {
      if (s.hn) setHn(s.hn);
      if (s.patientName) setPatientName(s.patientName);
      if (s.patientType) setPatientType(s.patientType);
      if (s.billingRight) setBillingRight(s.billingRight);
      else if (s.patientType) setBillingRight(s.billingRight);
      if (s.preSelectedItem) handleAddItem(s.preSelectedItem);
    }
  }, [location.state]);

  // --- Search effect ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let items = [...allMedications];

    // Filter results based on role
    items = items.filter(i => {
      if (currentRole === "pharma") return i.category === "pharma" || (i.isSet && i.category === "pharma");
      return i.category === "nurse";
    });

    // Filter by search query
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.Common_name.toLowerCase().includes(q) ||
      i.itemCode.toLowerCase().includes(q)
    );

    setSearchResults(items);
  }, [searchQuery, currentRole, allMedications]);

  // --- Cart Handlers ---
  const handleAddDraftItem = (item) => {
    if (item.isSet && item.items) {
      setDraftItems(prev => {
        const instanceId = Date.now().toString() + Math.random();
        const exploded = item.items.map(subItem => ({
          ...subItem, id: Date.now().toString() + Math.random(), quantity: subItem.quantity || 1, dose: "", setInstanceId: instanceId, parentSetName: item.Common_name, drugSubCategory: ""
        }));
        return [...prev, ...exploded];
      });
      toast.success(`เพิ่มชุดรายการ ${item.itemCode} แล้ว (${item.items.length} รายการ)`);
    } else {
      setDraftItems(prev => {
        const existingIndex = prev.findIndex(i => i.itemCode === item.itemCode && !i.setInstanceId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
          return updated;
        }
        return [...prev, { ...item, id: Date.now().toString() + Math.random(), quantity: 1, dose: "", drugSubCategory: "" }];
      });
    }
    setSearchQuery("");
  };

  const updateQuantity = (id, d) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const updateGroupQuantity = (gid, d) => setSelectedItems(prev => {
    const setSubItems = prev.filter(i => i.setInstanceId === gid);
    if (setSubItems.length === 0) return prev;
    const currentSetQty = Math.min(...setSubItems.map(i => i.quantity));
    const newSetQty = Math.max(1, currentSetQty + d);
    const factor = newSetQty / currentSetQty;
    return prev.map(i => i.setInstanceId === gid ? { ...i, quantity: Math.max(1, Math.round(i.quantity * factor)) } : i);
  });
  const updateDose = (id, dose) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, dose } : i));
  const updateCustomPrice = (id, price) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, customPrice: price } : i));
  const updateNote = (id, note) => setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  const removeItem = (id) => setSelectedItems(prev => prev.filter(i => i.id !== id));
  const removeGroup = (gid) => setSelectedItems(prev => prev.filter(i => i.setInstanceId !== gid));
  const updateItemDrugSubCategory = (idOrGid, subCat) => setSelectedItems(prev => prev.map(i => 
    (i.id === idOrGid || i.setInstanceId === idOrGid) ? { ...i, drugSubCategory: subCat } : i
  ));

  const removeDraftItem = (id) => setDraftItems(prev => prev.filter(i => i.id !== id));
  const updateDraftItemQuantity = (id, d) => setDraftItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));

  const commitDraftToRight = () => {
    if (draftItems.length === 0) return;
    setSelectedItems(prev => {
      let updated = [...prev];
      draftItems.forEach(dItem => {
        if (dItem.setInstanceId) {
          updated.push(dItem);
        } else {
          const idx = updated.findIndex(i => i.itemCode === dItem.itemCode && !i.setInstanceId);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + dItem.quantity };
          } else {
            updated.push(dItem);
          }
        }
      });
      return updated;
    });
    setDraftItems([]);
    toast.success("เพิ่มรายการเข้าใบประมาณการแล้ว");
  };

  // --- Inline Diagnosis Add ---
  const handleAddNewDiagnosis = () => {
    setNewDiagnosisName("");
    setShowDiagnosisModal(true);
  };

  const confirmAddDiagnosis = async () => {
    if (!newDiagnosisName.trim()) {
      toast.warning("กรุณาระบุชื่อโรค");
      return;
    }
    await addNewDiagnosis(newDiagnosisName.trim());
    getDiagnoses().then(setDiagnoses);
    setDiagnosis(newDiagnosisName.trim());
    toast.success("เพิ่มโรคใหม่เรียบร้อย");
    setShowDiagnosisModal(false);
  };

  // --- Save Logic ---
  const handleSave = async (isSilent = false) => {
    if (selectedItems.length === 0) { toast.warning("กรุณาเพิ่มรายการ"); return null; }
    try {
      let finalItems = [...selectedItems];
      const recordId = editingId || Date.now().toString();

      // Concurrency Merge
      if (editingId) {
        const latest = await getEstimationById(editingId);
        if (latest) finalItems = mergeRoleItems(selectedItems, latest.selectedItems, currentRole);
      }

      const status = determineStatus(finalItems);

      // Recalculate totals based on merged items
      const pTotal = finalItems.filter(i => (i.category === "pharma" || !i.category) && !i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const nTotal = finalItems.filter(i => i.category === "nurse" && !i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const prpTotal = finalItems.filter(i => i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const gTotal = pTotal + nTotal + prpTotal;

      const record = {
        id: recordId, savedAt: new Date().toISOString(),
        hn, vnan, patientName, doctorName, diagnosis, assessor, bsa,
        patientType, billingRight, insurance, agreement, freeNote,
        prepFeeTotal: prpTotal, courseCycles,
        selectedItems: finalItems,
        pharmaTotal: pTotal, nurseTotal: nTotal, grandTotal: gTotal, totalCourse: gTotal * courseCycles,
        status, lastUpdatedBy: currentRole
      };

      if (editingId) await updateEstimation(editingId, record);
      else await saveEstimation(record);

      toast.success(status === "สมบูรณ์" ? "บันทึกข้อมูลสมบูรณ์" : `บันทึกแล้ว (${status})`);

      if (!isSilent) {
        if (!editingId) navigate("/patients");
        else setSelectedItems(finalItems);
      } else {
        if (!editingId) setEditingId(recordId);
        setSelectedItems(finalItems);
      }
      return recordId;
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด");
      return null;
    }
  };

  const handleSaveAndPrint = async () => {
    if (selectedItems.length === 0) { toast.warning("กรุณาเพิ่มรายการก่อนพิมพ์"); return; }
    try {
      let finalItems = [...selectedItems];
      const recordId = editingId || Date.now().toString();

      if (editingId) {
        const latest = await getEstimationById(editingId);
        if (latest) finalItems = mergeRoleItems(selectedItems, latest.selectedItems, currentRole);
      }

      const status = determineStatus(finalItems);
      const pTotal = finalItems.filter(i => (i.category === "pharma" || !i.category) && !i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const nTotal = finalItems.filter(i => i.category === "nurse" && !i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const prpTotal = finalItems.filter(i => i.isPreparation).reduce((s, i) => s + getItemPrice(i, billingRight) * i.quantity, 0);
      const gTotal = pTotal + nTotal + prpTotal;

      const record = {
        id: recordId, savedAt: new Date().toISOString(),
        hn, vnan, patientName, doctorName, diagnosis, assessor, bsa,
        patientType, billingRight, insurance, agreement, freeNote,
        prepFeeTotal: prpTotal, courseCycles,
        selectedItems: finalItems,
        pharmaTotal: pTotal, nurseTotal: nTotal, grandTotal: gTotal, totalCourse: gTotal * courseCycles,
        status, lastUpdatedBy: currentRole
      };

      if (editingId) await updateEstimation(editingId, record);
      else await saveEstimation(record);

      if (!editingId) setEditingId(recordId);
      setSelectedItems(finalItems);
      toast.success("บันทึกข้อมูลสำเร็จ กำลังเปิดหน้าพิมพ์...");
      setTimeout(() => window.print(), 800);
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  const lblCls = "block text-[0.65rem] font-black text-slate-400 mb-1 uppercase tracking-wider";
  const inputCls = "w-full border border-slate-200 rounded-lg py-2 px-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500";

  // --- Shared ItemTable props ---
  const itemTableProps = { getPrice, fmt, onUpdateQuantity: updateQuantity, onUpdateGroupQuantity: updateGroupQuantity, onUpdateDose: updateDose, onRemoveItem: removeItem, onRemoveGroup: removeGroup, onUpdateCustomPrice: updateCustomPrice, onUpdateNote: updateNote, onUpdateItemDrugSubCategory: updateItemDrugSubCategory, isViewMode, billingRight };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 10mm 15mm 10mm;
          }
          html, body, #root, main, .overflow-hidden, [class*="h-screen"] {
            height: auto !important;
            overflow: visible !important;
            min-height: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className={`grid grid-cols-1 ${isViewMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 max-w-[1400px] mx-auto pb-10`}>

        {/* ===== Left Side ===== */}
        {!isViewMode && (
          <div className="lg:col-span-5 flex flex-col gap-5 no-print">
            <RoleSwitcher currentRole={currentRole} isAdmin={isAdmin} userRole={userRole} onSwitch={handleRoleSwitch} />
            <PatientInfoForm values={formValues} onChange={handleFormChange} masterData={{ doctors, diagnoses, assessors }} lblCls={lblCls} inputCls={inputCls} onAddDiagnosis={handleAddNewDiagnosis} />
            <SearchPanel
              searchQuery={searchQuery}
              searchResults={searchResults}
              currentRole={currentRole}
              getPrice={getPrice}
              fmt={fmt}
              onSearchChange={setSearchQuery}
              onAddItem={handleAddDraftItem}
              onNavigateAddNew={() => navigate('/add-item', { state: { fromEstimator: true } })}
            />
            <DraftItemsList
              items={draftItems}
              onRemove={removeDraftItem}
              onUpdateQuantity={updateDraftItemQuantity}
              onCommit={commitDraftToRight}
              fmt={fmt}
              getPrice={getPrice}
            />
          </div>
        )}

        {/* ===== Right Preview Panel ===== */}
        <div id="print-area" className={`${isViewMode ? 'max-w-[900px] mx-auto w-full' : 'lg:col-span-7'} flex flex-col gap-4`}>
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

            {/* Patient Info Display */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-[0.8rem]">
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">HN:</span><span className="font-black">{hn || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">VN/AN:</span><span className="font-black">{vnan || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ชื่อผู้ป่วย:</span><span className="font-black">{patientName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ประเภทผู้ป่วย:</span><span className="font-black">{patientType || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">ผู้ประเมิน:</span><span className="font-black">{assessor || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">แพทย์:</span><span className="font-black">{doctorName || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Diagnosis:</span><span className="font-black">{diagnosis || "-"}</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">สิทธิการรักษา:</span><span className="font-black">{insurance}</span></div>

              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">การตกลงรักษา:</span>
                <span className={`font-black ${agreement === "agrees" ? "text-green-600" : "text-red-500"}`}>{agreement === "agrees" ? "ตกลงรักษา" : "ไม่ตกลง"}</span>
              </div>
            </div>

            {/* Summary Sections */}
            <div className="flex-1 space-y-5">
              {/* Pharma Part — grouped by subcategory */}
              <div className="rounded-2xl border transition-all bg-white border-blue-200">
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-blue-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-blue-700 uppercase flex items-center gap-2"><Pill size={14} /> ส่วนงานเภสัชกรรม</span>
                  <span className="text-xs font-black text-blue-900">{fmt(pharmaTotal)}</span>
                </div>
                <div className="p-4">
                  {pharmaItems.length > 0 ? (() => {
                    const grouped = {};
                    pharmaItems.forEach(item => {
                      const cat = item.drugSubCategory || 'other';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(item);
                    });
                    return (
                      <div className="space-y-3">
                        {DRUG_SUB_CATEGORIES.map(sc => {
                          const items = grouped[sc.value];
                          if (!items?.length) return null;
                          const subTotal = items.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
                          return (
                            <div key={sc.value} className="border-t border-slate-100 pt-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[0.6rem] font-black px-2 py-0.5 rounded border ${sc.color}`}>
                                  {sc.label} <span className="opacity-60">({sc.labelEn})</span>
                                </span>
                                <span className="text-[0.65rem] font-black text-slate-600">{fmt(subTotal)}</span>
                              </div>
                              <ItemTable items={items} {...itemTableProps} isReadOnlySection={currentRole !== "pharma"} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการยา</div>}
                </div>
              </div>

              {/* Nurse Part */}
              <div className="rounded-2xl border transition-all bg-white border-indigo-200">
                <div className="flex justify-between items-center px-4 py-2 border-b border-inherit bg-indigo-50/50 rounded-t-2xl">
                  <span className="text-[0.65rem] font-black text-indigo-700 uppercase flex items-center gap-2"><Stethoscope size={14} /> ส่วนงานพยาบาลและบริการ</span>
                  <span className="text-xs font-black text-indigo-900">{fmt(nurseTotal)}</span>
                </div>
                <div className="p-4">
                  {nurseItems.length > 0 ? <ItemTable items={nurseItems} {...itemTableProps} isReadOnlySection={currentRole !== "nurse"} /> : <div className="text-center py-4 text-[0.65rem] font-bold text-slate-300">ไม่มีรายการบริการ</div>}
                </div>
              </div>
            </div>

            {/* Free Note Area */}
            {(!isViewMode || freeNote) && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                {isViewMode ? (
                  freeNote && (
                    <div className="text-[0.75rem] text-slate-600 whitespace-pre-wrap leading-relaxed">
                      <span className="font-black text-slate-400 uppercase text-[0.6rem] block mb-1">หมายเหตุ / Notes</span>
                      {freeNote}
                    </div>
                  )
                ) : (
                  <>
                    <div className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider mb-1 no-print">หมายเหตุ / Notes</div>
                    <textarea
                      value={freeNote}
                      onChange={(e) => setFreeNote(e.target.value)}
                      rows={3}
                      placeholder="พิมพ์หมายเหตุหรือข้อความเพิ่มเติม..."
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-[0.75rem] text-slate-700 focus:outline-none focus:border-blue-400 resize-none no-print placeholder:text-slate-300"
                    />
                    {freeNote && (
                      <div className="text-[0.75rem] text-slate-600 whitespace-pre-wrap leading-relaxed hidden print:block">
                        <span className="font-black text-slate-400 uppercase text-[0.6rem] block mb-1">หมายเหตุ / Notes</span>
                        {freeNote}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sum Section */}
            {grandTotal > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-slate-100">
                <div className="space-y-2 mb-6 px-1 border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">รวมราคายา / cycle</span>
                    <span className="font-bold text-slate-700">{fmt(drugTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">ค่าตู้ + เวชภัณฑ์ + ค่าเตรียมยา</span>
                    <span className="font-bold text-slate-700">{fmt(prepTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-5 px-1">
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase">Estimated Total</span>
                    <span className="text-xs font-bold text-slate-700">ประมาณการยอดรวมทั้งสิ้นต่อรอบ</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase">{courseCycles} Cycles ×</span>
                    <span className="text-4xl font-black text-[#0F294D] font-mono tracking-tighter">{fmt(grandTotal)}</span>
                    <span className="text-xs font-bold text-slate-400">THB</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 no-print">
                  {isViewMode ? (
                    <>
                      <button onClick={() => navigate('/patients')} className="bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-50 border-2 border-slate-100 shadow-sm active:scale-95">
                        กลับสู่หน้ารายชื่อผู้ป่วย
                      </button>
                      <button onClick={() => window.print()} className="bg-[#0F294D] text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        พิมพ์ใบประเมินราคา
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleSave()} className="bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-50 border-2 border-slate-100 shadow-sm active:scale-95">
                        {editingId ? "อัปเดตข้อมูล" : (currentRole === "pharma" ? "บันทึกและส่งต่อพยาบาล" : "บันทึกและส่งต่อเภสัช")}
                      </button>
                      <button onClick={handleSaveAndPrint} className="bg-[#0F294D] text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        บันทึกและพิมพ์ใบประเมินราคา
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Add New Diagnosis Modal --- */}
      {showDiagnosisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Stethoscope className="text-blue-600" size={20} />
                ระบุชื่อโรค / Diagnosis ใหม่
              </h3>
              <p className="text-xs text-slate-500 mt-1">ชื่อโรคที่เพิ่มใหม่จะถูกบันทึกและสามารถเลือกใช้ได้ทันที</p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
                Diagnosis Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="เช่น CA Breast, Lung Cancer"
                value={newDiagnosisName}
                onChange={e => setNewDiagnosisName(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmAddDiagnosis();
                  if (e.key === 'Escape') setShowDiagnosisModal(false);
                }}
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDiagnosisModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAddDiagnosis}
                className="px-6 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-sm"
              >
                บันทึกและเลือกใช้
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DraftItemsList({ items, onRemove, onUpdateQuantity, onCommit, fmt, getPrice }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h2 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          📦 รายการที่เตรียมเพิ่ม ({items.length} รายการ)
        </h2>
        <button
          onClick={onCommit}
          className="text-[0.6rem] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
        >
          ส่งเข้าใบประมาณการ (ฝั่งขวา)
        </button>
      </div>

      <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-50 pr-1">
        {items.map(item => (
          <div key={item.id} className="py-2.5 flex justify-between items-center">
            <div className="flex-1 pr-4">
              <div className="font-bold text-slate-800 text-xs">{item.Common_name}</div>
              <div className="text-[0.55rem] text-slate-400 font-mono mt-0.5">{item.itemCode}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="bg-slate-50 border border-slate-200 rounded p-0.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <span className="w-5 text-center font-bold text-xs text-slate-700">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="bg-slate-50 border border-slate-200 rounded p-0.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
