import { UserRound, Plus } from 'lucide-react';

/**
 * Patient information form — the "Setup Card" on the left side.
 * Uses a values/onChange pattern to avoid massive individual prop drilling.
 */
export default function PatientInfoForm({ values, onChange, masterData, lblCls, inputCls, onAddDiagnosis }) {
  const { hn, vnan, patientName, patientType, billingRight, insurance, assessor, doctorName, diagnosis, bsa, agreement } = values;
  const { doctors, diagnoses, assessors } = masterData;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-[0.65rem] font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
        <UserRound size={14} /> ข้อมูลเบื้องต้น
      </h2>

      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
          <div><label className={lblCls}>HN</label><input className={inputCls} value={hn} onChange={e => onChange('hn', e.target.value)} /></div>
          <div><label className={lblCls}>VN / AN</label><input className={inputCls} value={vnan} onChange={e => onChange('vnan', e.target.value)} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1"><label className={lblCls}>ชื่อผู้ป่วย</label><input className={inputCls} value={patientName} onChange={e => onChange('patientName', e.target.value)} /></div>
          <div>
            <label className={lblCls}>ประเภทผู้ป่วย</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              {["OPD", "IPD"].map(t => (
                <button key={t} onClick={() => onChange('patientType', t)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${patientType === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ปรับแก้ 1: เพิ่มสิทธิที่ใช้ (Insurance) ตรงนี้ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lblCls}>อัตราราคา price tariff</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              {["OPD", "IPD", "OPDTR", "IPDTR"].map(r => (
                <button key={r} onClick={() => onChange('billingRight', r)} className={`py-1 rounded text-[0.6rem] font-black transition-all ${billingRight === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={lblCls}>สิทธิการรักษา</label>
            <select className={inputCls} value={insurance} onChange={e => onChange('insurance', e.target.value)}>
              <option value="Self pay">Self pay</option>
              <option value="ประกันไทย">ประกันไทย</option>
              <option value="ประกันต่างชาติ">ประกันต่างชาติ</option>
              <option value="ประกันสังคม">ประกันสังคม</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><label className={lblCls}>ผู้ประเมิน</label><select className={inputCls} value={assessor} onChange={e => onChange('assessor', e.target.value)}><option value="">-- เลือก --</option>{assessors.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><label className={lblCls}>แพทย์</label><select className={inputCls} value={doctorName} onChange={e => onChange('doctorName', e.target.value)}><option value="">-- เลือก --</option>{doctors.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={lblCls}>Diagnosis</label>
              <button
                onClick={onAddDiagnosis}
                className="text-[0.6rem] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <Plus size={10} /> เพิ่มใหม่
              </button>
            </div>
            <select className={inputCls} value={diagnosis} onChange={e => onChange('diagnosis', e.target.value)}>
              <option value="">-- เลือก --</option>
              {diagnoses.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* ปรับแก้ 2: การตกลงรักษา */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lblCls}>BSA (m²)</label>
            <input type="number" className={inputCls} value={bsa} onChange={e => onChange('bsa', e.target.value)} />
          </div>
          <div>
            <label className={lblCls}>ผป. ตกลงรักษาไหม?</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input type="radio" value="agrees" checked={agreement === "agrees"} onChange={e => onChange('agreement', e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                ตกลง
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input type="radio" value="declines" checked={agreement === "declines"} onChange={e => onChange('agreement', e.target.value)} className="w-3.5 h-3.5 text-blue-600" />
                ไม่ตกลง
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
