"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

export interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface AuthorizedProfile {
  id: string;
  displayName: string;
  dateOfBirth: string;
  gender?: string | null;
  bloodGroup?: string | null;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string[];
  allergies: string[];
  doctorName?: string | null;
  hospitalName?: string | null;
  doctorPhone?: string | null;
  role: "ELDERLY" | "FAMILY_ADMIN" | "FAMILY_VIEWER" | "CARETAKER";
  relationship: string;
  permissions: {
    canManageMeds: boolean;
    canManageAppointments: boolean;
    canConfirmDoses: boolean;
  };
}

export interface DashboardContextType {
  user: DashboardUser | null;
  profiles: AuthorizedProfile[];
  activeProfile: AuthorizedProfile | null;
  isDemo: boolean;
  loading: boolean;
  setActiveProfileId: (id: string) => void;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Fictional Demo Profile for explicit Demo Sandbox mode only
export const FICTIONAL_DEMO_PROFILE: AuthorizedProfile = {
  id: "demo-profile-appaji",
  displayName: "Appaji Rao",
  dateOfBirth: "1950-04-12",
  gender: "MALE",
  bloodGroup: "O+",
  timezone: "Asia/Kolkata",
  emergencyContactName: "Priya Sharma (Daughter)",
  emergencyContactPhone: "+91 98765 43210",
  medicalConditions: ["Hypertension", "Type 2 Diabetes"],
  allergies: ["Penicillin"],
  doctorName: "Dr. Ramesh",
  hospitalName: "Manipal Hospital, Bangalore",
  doctorPhone: "+91 80 2502 4444",
  role: "FAMILY_ADMIN",
  relationship: "Daughter",
  permissions: {
    canManageMeds: true,
    canManageAppointments: true,
    canConfirmDoses: true,
  },
};

export const FICTIONAL_DEMO_USER: DashboardUser = {
  id: "demo-user-priya",
  email: "priya.demo@vatsalya.care",
  fullName: "Priya Sharma",
  avatarUrl: null,
};

export function extractRelationship(emergencyContactName?: string, role?: string): string {
  if (role === "ELDERLY") return "Self";
  if (role === "CARETAKER") return "Caretaker";
  if (emergencyContactName) {
    const match = emergencyContactName.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  if (role === "FAMILY_ADMIN") return "Family Administrator";
  if (role === "FAMILY_VIEWER") return "Family Member";
  return "Family Member";
}

export function formatUserBadge(userName: string, relationship?: string, role?: string): string {
  const cleanName = userName?.trim() || "Your Account";
  if (role === "ELDERLY") {
    return cleanName;
  }
  if (relationship && relationship !== "Self") {
    if (role === "FAMILY_ADMIN") {
      return `${cleanName} (${relationship} & Healthcare Administrator)`;
    }
    if (role === "CARETAKER") {
      return `${cleanName} (Assigned Caregiver • ${relationship})`;
    }
    return `${cleanName} (${relationship})`;
  }
  if (role === "FAMILY_ADMIN") {
    return `${cleanName} (Healthcare Administrator)`;
  }
  if (role === "CARETAKER") {
    return `${cleanName} (Assigned Caregiver)`;
  }
  return cleanName;
}

export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [profiles, setProfiles] = useState<AuthorizedProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const demoParam =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "true";
    try {
      // 1. Fetch authenticated user profile
      const userRes = await fetch("/api/auth/profile");
      const userJson = await userRes.json();

      if (userRes.ok && userJson.success && userJson.data) {
        // Authenticated user exists!
        const authUser: DashboardUser = {
          id: userJson.data.id,
          email: userJson.data.email || "",
          fullName: userJson.data.full_name || userJson.data.email?.split("@")[0] || "Your Account",
          avatarUrl: userJson.data.avatar_url,
        };
        setUser(authUser);

        // Fetch their authorized healthcare profiles
        const profRes = await fetch("/api/healthcare-profiles");
        const profJson = await profRes.json();

        if (profRes.ok && profJson.success && Array.isArray(profJson.data)) {
          const mappedProfiles: AuthorizedProfile[] = profJson.data
            .filter((item: { healthcare_profile?: Record<string, unknown> | null }) => item.healthcare_profile)
            .map((item: {
              role: "ELDERLY" | "FAMILY_ADMIN" | "FAMILY_VIEWER" | "CARETAKER";
              can_manage_meds?: boolean;
              can_manage_appointments?: boolean;
              can_confirm_doses?: boolean;
              healthcare_profile: {
                id: string;
                display_name: string;
                date_of_birth: string;
                gender?: string | null;
                blood_group?: string | null;
                timezone?: string;
                emergency_contact_name?: string;
                emergency_contact_phone?: string;
                medical_conditions?: string[];
                allergies?: string[];
                doctor_name?: string | null;
                hospital_name?: string | null;
                doctor_phone?: string | null;
              };
            }) => {
              const hp = item.healthcare_profile;
              return {
                id: hp.id,
                displayName: hp.display_name,
                dateOfBirth: hp.date_of_birth,
                gender: hp.gender,
                bloodGroup: hp.blood_group,
                timezone: hp.timezone || "Asia/Kolkata",
                emergencyContactName: hp.emergency_contact_name || "",
                emergencyContactPhone: hp.emergency_contact_phone || "",
                medicalConditions: Array.isArray(hp.medical_conditions) ? hp.medical_conditions : [],
                allergies: Array.isArray(hp.allergies) ? hp.allergies : [],
                doctorName: hp.doctor_name,
                hospitalName: hp.hospital_name,
                doctorPhone: hp.doctor_phone,
                role: item.role,
                relationship: extractRelationship(hp.emergency_contact_name, item.role),
                permissions: {
                  canManageMeds: !!item.can_manage_meds,
                  canManageAppointments: !!item.can_manage_appointments,
                  canConfirmDoses: item.can_confirm_doses ?? true,
                },
              };
            });

          setProfiles(mappedProfiles);
          setIsDemo(false);

          // Restore previously active profile from localStorage if valid
          const savedProfileId = typeof window !== "undefined" ? localStorage.getItem("vatsalya_active_profile_id") : null;
          if (savedProfileId && mappedProfiles.some((p) => p.id === savedProfileId)) {
            setActiveProfileIdState(savedProfileId);
          } else if (mappedProfiles.length > 0) {
            setActiveProfileIdState(mappedProfiles[0].id);
            if (typeof window !== "undefined") {
              localStorage.setItem("vatsalya_active_profile_id", mappedProfiles[0].id);
            }
          } else {
            setActiveProfileIdState(null);
          }
        } else {
          setProfiles([]);
          setActiveProfileIdState(null);
          setIsDemo(false);
        }
      } else {
        // User is not authenticated
        if (demoParam) {
          // Explicit Demo Sandbox requested
          setIsDemo(true);
          setUser(FICTIONAL_DEMO_USER);
          setProfiles([FICTIONAL_DEMO_PROFILE]);
          setActiveProfileIdState(FICTIONAL_DEMO_PROFILE.id);
        } else {
          // Unauthenticated visitor -> Redirect to login (no private access)
          setIsDemo(false);
          setUser(null);
          setProfiles([]);
          setActiveProfileIdState(null);
          router.push("/login");
        }
      }
    } catch (err) {
      console.error("[DashboardContext] Failed to load user data:", err);
      if (demoParam) {
        setIsDemo(true);
        setUser(FICTIONAL_DEMO_USER);
        setProfiles([FICTIONAL_DEMO_PROFILE]);
        setActiveProfileIdState(FICTIONAL_DEMO_PROFILE.id);
      } else {
        setIsDemo(false);
        setUser(null);
        setProfiles([]);
        setActiveProfileIdState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("vatsalya_active_profile_id", id);
    }
  }, []);

  const activeProfile = useMemo(() => {
    if (isDemo) return FICTIONAL_DEMO_PROFILE;
    if (!activeProfileId || profiles.length === 0) return null;
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [isDemo, activeProfileId, profiles]);

  const value = useMemo(
    () => ({
      user,
      profiles,
      activeProfile,
      isDemo,
      loading,
      setActiveProfileId,
      refreshDashboard: fetchDashboardData,
    }),
    [user, profiles, activeProfile, isDemo, loading, setActiveProfileId, fetchDashboardData]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
