import { UserRound, Stethoscope } from 'lucide-react';

// Each gradient uses a distinctly different hue — no two adjacent entries share a hue family
const DOCTOR_GRADIENTS = [
  'from-indigo-500 to-indigo-700',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-rose-500 to-red-600',
  'from-sky-400 to-cyan-600',
  'from-purple-500 to-fuchsia-600',
];

const DIAG_GRADIENTS = [
  'from-rose-500 to-red-600',
  'from-sky-400 to-blue-600',
  'from-amber-400 to-yellow-500',
  'from-emerald-400 to-green-600',
  'from-purple-500 to-violet-600',
  'from-orange-400 to-red-500',
];


/**
 * Cross-filterable Doctor Stats & Diagnosis Stats panels — premium redesign.
 */
export default function DoctorDiagnosisStats({ doctorStats, diagnosisStats, selectedDoctorFilter, onSelectDoctor }) {
  const maxDoc = doctorStats[0]?.value || 1;
  const maxDiag = diagnosisStats[0]?.value || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

      {/* ── Top Doctors ── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <UserRound size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-sm leading-none">สถิติแพทย์</h2>
              <p className="text-[0.6rem] text-slate-400 font-medium mt-0.5">คลิกแถบเพื่อกรองการวินิจฉัย</p>
            </div>
          </div>
          <span className="text-[0.6rem] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {doctorStats.length} ท่าน
          </span>
        </div>

        {/* List */}
        <div className="p-5 space-y-3 max-h-[340px] overflow-y-auto">
          {doctorStats.length > 0 ? doctorStats.map((item, i) => {
            const isSelected = selectedDoctorFilter === item.name;
            const grad = DOCTOR_GRADIENTS[i % DOCTOR_GRADIENTS.length];
            const pct = Math.round((item.value / maxDoc) * 100);

            return (
              <div
                key={i}
                onClick={() => onSelectDoctor(isSelected ? null : item.name)}
                className={`group relative rounded-2xl p-3.5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 shadow-md shadow-indigo-100/60 scale-[1.01]'
                    : 'bg-slate-50/70 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                   {/* Rank number */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[0.6rem] font-black ${
                    isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-800' : 'text-slate-700 group-hover:text-indigo-700'} transition-colors`}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span className={`text-xs font-black ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>{item.value}</span>
                        <span className="text-[0.55rem] text-slate-400 font-bold">ราย</span>
                        <span className={`text-[0.55rem] font-black px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Top diagnoses mini-tags */}
                    {item.topDiagnoses?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.topDiagnoses.slice(0, 2).map((d, di) => (
                          <span key={di} className="text-[0.5rem] font-bold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                            {d.name} ×{d.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <UserRound size={32} className="mb-2 opacity-40" />
              <span className="text-xs font-bold">ไม่มีข้อมูลสถิติแพทย์</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Diagnoses ── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Stethoscope size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-sm leading-none">
                {selectedDoctorFilter ? `${selectedDoctorFilter}` : 'การวินิจฉัย'}
              </h2>
              <p className="text-[0.6rem] text-slate-400 font-medium mt-0.5">
                {selectedDoctorFilter ? 'กรองตามแพทย์ที่เลือก' : 'สถิติการวินิจฉัยทั้งหมด'}
              </p>
            </div>
          </div>
          {selectedDoctorFilter ? (
            <button
              onClick={() => onSelectDoctor(null)}
              className="text-[0.6rem] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition-colors border border-rose-100"
            >
              ล้างตัวกรอง ✕
            </button>
          ) : (
            <span className="text-[0.6rem] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              {diagnosisStats.length} รายการ
            </span>
          )}
        </div>

        {/* List */}
        <div className="p-5 space-y-3 max-h-[340px] overflow-y-auto">
          {diagnosisStats.length > 0 ? diagnosisStats.map((item, i) => {
            const grad = DIAG_GRADIENTS[i % DIAG_GRADIENTS.length];
            const pct = Math.round((item.value / maxDiag) * 100);

            return (
              <div key={i} className="group rounded-2xl p-3.5 bg-slate-50/70 border border-transparent hover:border-rose-100 hover:bg-rose-50/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  {/* Rank number */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[0.6rem] font-black bg-slate-100 text-slate-400">
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 truncate group-hover:text-rose-700 transition-colors">{item.name}</span>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span className="text-xs font-black text-slate-900">{item.value}</span>
                        <span className="text-[0.55rem] text-slate-400 font-bold">ราย</span>
                        <span className="text-[0.55rem] font-black px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <Stethoscope size={32} className="mb-2 opacity-40" />
              <span className="text-xs font-bold">ไม่มีข้อมูลสถิติการวินิจฉัย</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
