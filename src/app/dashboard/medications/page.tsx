"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Clock,
  Plus,
  Trash2,
  Loader2,
  XCircle,
  Pause,
  Play,
} from "lucide-react";

interface ScheduleSlot {
  targetTime: string;
  mealTiming: "BEFORE_MEAL" | "WITH_MEAL" | "AFTER_MEAL" | "EMPTY_STOMACH" | "NO_RESTRICTION";
  doseQuantity: number;
  frequencyType: "DAILY" | "SPECIFIC_DAYS";
  daysOfWeek: number[];
}

interface Medication {
  id: string;
  healthcare_profile_id: string;
  name: string;
  generic_name: string | null;
  dosage_strength: string;
  dosage_form: string;
  instructions: string | null;
  prescribing_doctor: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  schedules: {
    id: string;
    target_time: string;
    meal_timing: string;
    dose_quantity: number;
    frequency_type: string;
    days_of_week: number[];
  }[];
}

export default function MedicationsManagementPage() {
  const [profileId, setProfileId] = useState<string>("sample-profile-id");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Medication Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosageStrength, setDosageStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("TABLET");
  const [instructions, setInstructions] = useState("");
  const [prescribingDoctor, setPrescribingDoctor] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([
    {
      targetTime: "08:30",
      mealTiming: "AFTER_MEAL",
      doseQuantity: 1,
      frequencyType: "DAILY",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load medications
  useEffect(() => {
    async function loadMeds() {
      try {
        const profileRes = await fetch("/api/healthcare-profiles");
        const profileJson = await profileRes.json();
        let targetId = "sample-profile-id";

        if (profileJson.success && profileJson.data && profileJson.data.length > 0) {
          targetId = profileJson.data[0].healthcare_profile.id;
          setProfileId(targetId);

          const medsRes = await fetch(`/api/medications?healthcareProfileId=${targetId}`);
          const medsJson = await medsRes.json();
          if (medsJson.success) {
            setMedications(medsJson.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to load medications", err);
      } finally {
        setLoading(false);
      }
    }
    loadMeds();
  }, []);

  // Slot configurator helpers
  const addSlot = () => {
    setSlots([
      ...slots,
      {
        targetTime: "20:30",
        mealTiming: "WITH_MEAL",
        doseQuantity: 1,
        frequencyType: "DAILY",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
    ]);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = <K extends keyof ScheduleSlot>(
    index: number,
    field: K,
    value: ScheduleSlot[K]
  ) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  // Submit new medication
  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosageStrength.trim()) {
      setErrorMessage("Medication name and dosage strength are required.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: profileId,
          name: name.trim(),
          genericName: genericName.trim() || null,
          dosageStrength: dosageStrength.trim(),
          dosageForm,
          instructions: instructions.trim() || null,
          prescribingDoctor: prescribingDoctor.trim() || null,
          startDate,
          schedules: slots.map((s) => ({
            targetTime: s.targetTime.length === 5 ? `${s.targetTime}:00` : s.targetTime,
            mealTiming: s.mealTiming,
            doseQuantity: Number(s.doseQuantity) || 1,
            frequencyType: s.frequencyType,
            daysOfWeek: s.daysOfWeek,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to add medication.");
      }

      setMedications([json.data, ...medications]);
      setShowAddModal(false);
      // Reset form
      setName("");
      setGenericName("");
      setDosageStrength("");
      setInstructions("");
      setPrescribingDoctor("");
      setSlots([
        {
          targetTime: "08:30",
          mealTiming: "AFTER_MEAL",
          doseQuantity: 1,
          frequencyType: "DAILY",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        },
      ]);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating medication.");
    } finally {
      setSaving(false);
    }
  };

  // Discontinue medication
  const handleDiscontinue = async (medId: string, medName: string) => {
    if (
      !confirm(
        `Are you sure you want to discontinue ${medName}? Historical dose records will remain permanently intact.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/medications/${medId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to discontinue medication.");
        return;
      }
      setMedications(medications.filter((m) => m.id !== medId));
    } catch (err) {
      console.error("Discontinue error", err);
    }
  };

  // Toggle active / paused state
  const handleToggleActive = async (medId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/medications/${medId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to update medication status.");
        return;
      }
      setMedications(
        medications.map((m) => (m.id === medId ? { ...m, is_active: !currentActive } : m))
      );
    } catch (err) {
      console.error("Toggle error", err);
    }
  };

  // Demo fallback medications
  const displayMeds: Medication[] =
    medications.length > 0
      ? medications
      : [
          {
            id: "med-1",
            healthcare_profile_id: "sample-profile-id",
            name: "Telmisartan",
            generic_name: "Telmisartan",
            dosage_strength: "40 mg",
            dosage_form: "TABLET",
            instructions: "Take with water after breakfast",
            prescribing_doctor: "Dr. Ramesh (Cardiologist)",
            start_date: "2026-01-01",
            end_date: null,
            is_active: true,
            schedules: [
              {
                id: "sched-1",
                target_time: "08:30:00",
                meal_timing: "AFTER_MEAL",
                dose_quantity: 1,
                frequency_type: "DAILY",
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
              },
            ],
          },
          {
            id: "med-2",
            healthcare_profile_id: "sample-profile-id",
            name: "Metformin",
            generic_name: "Metformin Hydrochloride",
            dosage_strength: "500 mg",
            dosage_form: "TABLET",
            instructions: "Take with lunch and dinner",
            prescribing_doctor: "Dr. Ramesh",
            start_date: "2026-02-15",
            end_date: null,
            is_active: true,
            schedules: [
              {
                id: "sched-2",
                target_time: "13:30:00",
                meal_timing: "WITH_MEAL",
                dose_quantity: 1,
                frequency_type: "DAILY",
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
              },
              {
                id: "sched-3",
                target_time: "20:30:00",
                meal_timing: "WITH_MEAL",
                dose_quantity: 1,
                frequency_type: "DAILY",
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
              },
            ],
          },
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A2F]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Medication Regimen &amp; Multi-Slot Schedules
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E3A2F]">
            Prescriptions &amp; Schedules
          </h1>
          <p className="text-sm text-[#5C6460]">
            Manage multi-dose daily timings, meal instructions, and active prescriptions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Medication Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayMeds.map((med) => (
          <div
            key={med.id}
            className={`p-6 sm:p-8 rounded-3xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
              med.is_active ? "border-[#EFECE6]" : "border-slate-200 opacity-60"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center font-bold">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1E3A2F]">{med.name}</h2>
                    <p className="text-sm font-semibold text-[#607B6E]">
                      {med.dosage_strength} • {med.dosage_form}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    med.is_active
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {med.is_active ? "Active" : "Paused"}
                </span>
              </div>

              {med.instructions && (
                <p className="text-xs text-[#5C6460] bg-[#FDFBF7] p-3 rounded-xl border border-[#EFECE6]">
                  <strong>Instructions:</strong> {med.instructions}
                </p>
              )}

              {/* Multi-Slot Schedules */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#607B6E] block mb-2">
                  Daily Scheduled Slots ({med.schedules.length}):
                </span>
                <div className="space-y-2">
                  {med.schedules.map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      className="p-3 rounded-xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#1E3A2F]" />
                        <span className="font-bold text-[#1E3A2F]">{slot.target_time.slice(0, 5)}</span>
                        <span className="text-[#5C6460]">({slot.meal_timing.replace("_", " ")})</span>
                      </div>
                      <span className="font-medium text-[#607B6E]">
                        Qty: {slot.dose_quantity} • {slot.frequency_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {med.prescribing_doctor && (
                <div className="text-xs text-[#5C6460]">
                  Prescribed by: <span className="font-semibold">{med.prescribing_doctor}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-[#EFECE6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(med.id, med.is_active)}
                className="text-xs font-semibold text-[#5C6460] hover:text-[#1E3A2F] flex items-center gap-1 cursor-pointer"
              >
                {med.is_active ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Schedule
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Resume Schedule
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDiscontinue(med.id, med.name)}
                className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discontinue
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* MODAL: Add Medication with Multi-Slot Builder */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl border border-[#EFECE6] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2 text-[#1E3A2F]">
                <Pill className="w-6 h-6" />
                <h2 className="text-xl font-bold">Add Medication &amp; Schedules</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#5C6460] hover:text-[#1E3A2F]"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateMedication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2421]">
                    Medication Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Telmisartan"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2421]">
                    Dosage &amp; Strength <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dosageStrength}
                    onChange={(e) => setDosageStrength(e.target.value)}
                    placeholder="e.g. 40 mg / 500 mg"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2421]">Dosage Form</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="DROPS">Drops</option>
                    <option value="INJECTION">Injection</option>
                    <option value="INHALER">Inhaler</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2421]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2421]">
                  Instructions / Meal Guidance
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with warm water after breakfast"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2421]">
                  Prescribing Doctor (Optional)
                </label>
                <input
                  type="text"
                  value={prescribingDoctor}
                  onChange={(e) => setPrescribingDoctor(e.target.value)}
                  placeholder="e.g. Dr. Ramesh (Cardiology)"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                />
              </div>

              {/* Multi-Slot Daily Schedule Configurator */}
              <div className="pt-3 border-t border-[#EFECE6] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A2F]">
                    Daily Schedule Slots ({slots.length})
                  </label>
                  <button
                    type="button"
                    onClick={addSlot}
                    className="text-xs font-bold text-[#1E3A2F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Time
                  </button>
                </div>

                {slots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A2F]">Slot #{index + 1}</span>
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="text-red-700 hover:text-red-900 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#5C6460]">Target Time</label>
                        <input
                          type="time"
                          value={slot.targetTime}
                          onChange={(e) => updateSlot(index, "targetTime", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EFECE6] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#5C6460]">Meal Relationship</label>
                        <select
                          value={slot.mealTiming}
                          onChange={(e) =>
                            updateSlot(
                              index,
                              "mealTiming",
                              e.target.value as ScheduleSlot["mealTiming"]
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EFECE6] bg-white"
                        >
                          <option value="BEFORE_MEAL">Before Meal</option>
                          <option value="WITH_MEAL">With Meal</option>
                          <option value="AFTER_MEAL">After Meal</option>
                          <option value="EMPTY_STOMACH">Empty Stomach</option>
                          <option value="NO_RESTRICTION">No Restriction</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#5C6460]">Dose Quantity</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={slot.doseQuantity}
                          onChange={(e) =>
                            updateSlot(
                              index,
                              "doseQuantity",
                              parseFloat(e.target.value) || 1
                            )
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EFECE6] bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EFECE6] text-sm font-semibold text-[#5C6460] hover:bg-[#FDFBF7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold text-sm shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Medication"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
