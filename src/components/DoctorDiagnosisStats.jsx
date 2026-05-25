import { UserRound, Stethoscope } from 'lucide-react';

/**
 * Cross-filterable Doctor Stats & Diagnosis Stats panels.
 * Clicking a doctor bar filters the diagnosis chart.
 */
export default function DoctorDiagnosisStats({ doctorStats, diagnosisStats, selectedDoctorFilter, onSelectDoctor }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Top Doctors */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-slate-900 flex items-center gap-2">
            <UserRound size={18} className="text-indigo-600" /> สถิติแพทย์ (ทั้งหมด)
          </h2>
          <span className="text-[0.65rem] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">คลิกเพื่อกรอง</span>
        </div>
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
          {doctorStats.length > 0 ? doctorStats.map((item, i) => {
            const isSelected = selectedDoctorFilter === item.name;
            return (
              <div
                key={i}
                onClick={() => onSelectDoctor(isSelected ? null : item.name)}
                className={`relative p-2.5 rounded-xl transition-all group cursor-pointer ${isSelected ? 'bg-indigo-50/80 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-700 font-black' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                    {item.name}
                  </span>
                  <span className={`text-xs font-black ${isSelected ? 'text-indigo-700' : 'text-indigo-600'}`}>{item.value} ราย</span>
                </div>
                <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-indigo-100/60">
                  <div
                    style={{ width: `${(item.value / doctorStats[0].value) * 100}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-1000 ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'}`}
                  ></div>
                </div>

                {/* Hover Tooltip */}
                {item.topDiagnoses && item.topDiagnoses.length > 0 && !isSelected && (
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-[#0F294D] text-white text-[0.65rem] rounded-xl p-3 shadow-xl z-50 animate-in fade-in duration-150 border border-white/10">
                    <div className="font-black text-indigo-300 mb-1.5 pb-1 border-b border-white/10">การวินิจฉัยหลักของแพทย์ท่านนี้:</div>
                    <div className="space-y-1 text-slate-200">
                      {item.topDiagnoses.map((d, di) => (
                        <div key={di} className="flex justify-between gap-6">
                          <span className="truncate max-w-[160px]">{d.name}</span>
                          <span className="font-bold text-white font-mono">{d.count} ครั้ง</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute left-4 top-full w-2 h-2 bg-[#0F294D] rotate-45 -mt-1 border-r border-b border-white/10"></div>
                  </div>
                )}
              </div>
            );
          }) : <div className="text-center py-10 text-slate-300 text-xs font-bold">ไม่มีข้อมูลสถิติแพทย์</div>}
        </div>
      </div>

      {/* Top Diagnoses */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm md:text-base">
            <Stethoscope size={18} className="text-blue-600" />
            <span>การวินิจฉัย {selectedDoctorFilter ? `ของ ${selectedDoctorFilter}` : '(ทั้งหมด)'}</span>
          </h2>
          {selectedDoctorFilter && (
            <button
              onClick={() => onSelectDoctor(null)}
              className="text-[0.65rem] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-100"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
          {diagnosisStats.length > 0 ? diagnosisStats.map((item, i) => (
            <div key={i} className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">{item.name}</span>
                <span className="text-xs font-black text-blue-600">{item.value} ราย</span>
              </div>
              <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-blue-50">
                <div
                  style={{ width: `${(item.value / diagnosisStats[0].value) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full transition-all duration-1000"
                ></div>
              </div>
            </div>
          )) : <div className="text-center py-10 text-slate-300 text-xs font-bold">ไม่มีข้อมูลสถิติการวินิจฉัย</div>}
        </div>
      </div>
    </div>
  );
}
