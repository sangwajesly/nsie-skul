import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  TimetableProfile,
  TimetablePeriod,
  TeacherAvailability,
  TimetableSlot,
  UserProfile,
  Subject,
  ClassStream,
} from "@/types/database";

/**
 * Lists all timetable profiles configured for a school (e.g. Grammar, Technical, Commercial).
 */
export const getSchoolTimetableProfiles = cache(async function getSchoolTimetableProfiles(
  schoolId: string
): Promise<TimetableProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("timetable_profiles")
    .select("*, periods:timetable_periods(*)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data as TimetableProfile[]) || [];
});

/**
 * Retrieves a single timetable profile with all its bell periods and breaks.
 */
export async function getTimetableProfileWithPeriods(
  profileId: string
): Promise<(TimetableProfile & { periods: TimetablePeriod[] }) | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("timetable_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) return null;

  const { data: periods } = await supabase
    .from("timetable_periods")
    .select("*")
    .eq("profile_id", profileId)
    .order("period_number", { ascending: true });

  return {
    ...profile,
    periods: (periods as TimetablePeriod[]) || [],
  };
}

/**
 * Lists all configured teacher availabilities / off-days for a school.
 */
export async function getSchoolTeacherAvailabilities(
  schoolId: string,
  teacherId?: string
): Promise<TeacherAvailability[]> {
  const supabase = await createClient();
  let query = supabase
    .from("teacher_availabilities")
    .select("*, teacher:users(id, full_name, email)")
    .eq("school_id", schoolId);

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data } = await query.order("day_of_week", { ascending: true });
  return (data as TeacherAvailability[]) || [];
}

/**
 * Retrieves timetable slots for a class stream or an entire school year.
 */
export async function getTimetableSlots(
  schoolId: string,
  academicYearId: string,
  classStreamId?: string,
  teacherId?: string
): Promise<TimetableSlot[]> {
  const supabase = await createClient();
  let query = supabase
    .from("timetable_slots")
    .select(
      `
      *,
      period:timetable_periods (*),
      subject:subjects (*),
      teacher:users (id, full_name, email),
      class_stream:class_streams (id, name, class_id)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
  }

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data } = await query.order("day_of_week", { ascending: true });
  return (data as TimetableSlot[]) || [];
}

/**
 * Checks for conflicts when scheduling a timetable slot.
 * Validates:
 * 1. Teacher double-booking across any class stream or subsystem
 * 2. Teacher availability / off-day status
 * 3. Room collision
 */
export async function checkTimetableConflict(params: {
  schoolId: string;
  academicYearId: string;
  dayOfWeek: number;
  periodId: string;
  teacherId?: string | null;
  roomName?: string | null;
  classStreamId: string;
  slotIdToIgnore?: string;
}): Promise<{ hasConflict: boolean; message?: string }> {
  const supabase = await createClient();
  const { schoolId, academicYearId, dayOfWeek, periodId, teacherId, roomName, classStreamId, slotIdToIgnore } = params;

  // 1. Check Teacher Double-booking across all classes & subsystems
  if (teacherId) {
    let teacherQuery = supabase
      .from("timetable_slots")
      .select("id, class_stream:class_streams(name), subject:subjects(name)")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .eq("day_of_week", dayOfWeek)
      .eq("period_id", periodId)
      .eq("teacher_id", teacherId);

    if (slotIdToIgnore) {
      teacherQuery = teacherQuery.neq("id", slotIdToIgnore);
    }

    const { data: teacherConflicts } = await teacherQuery;
    if (teacherConflicts && teacherConflicts.length > 0) {
      const conflict = teacherConflicts[0] as any;
      const className = conflict.class_stream?.name || "another class";
      const subjectName = conflict.subject?.name || "a subject";
      return {
        hasConflict: true,
        message: `Teacher is already scheduled to teach ${subjectName} in ${className} at this exact time.`,
      };
    }

    // 2. Check Teacher Off-Day / Unavailability
    const { data: availability } = await supabase
      .from("teacher_availabilities")
      .select("is_available, notes")
      .eq("school_id", schoolId)
      .eq("teacher_id", teacherId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (availability && !availability.is_available) {
      return {
        hasConflict: true,
        message: `Teacher is marked as unavailable on this day${
          availability.notes ? ` (${availability.notes})` : ""
        }.`,
      };
    }
  }

  // 3. Check Room Collision (e.g. Science Lab or Computer Lab)
  if (roomName && roomName.trim()) {
    let roomQuery = supabase
      .from("timetable_slots")
      .select("id, class_stream:class_streams(name)")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .eq("day_of_week", dayOfWeek)
      .eq("period_id", periodId)
      .ilike("room_name", roomName.trim())
      .neq("class_stream_id", classStreamId);

    if (slotIdToIgnore) {
      roomQuery = roomQuery.neq("id", slotIdToIgnore);
    }

    const { data: roomConflicts } = await roomQuery;
    if (roomConflicts && roomConflicts.length > 0) {
      const conflict = roomConflicts[0] as any;
      const className = conflict.class_stream?.name || "another class";
      return {
        hasConflict: true,
        message: `Room "${roomName}" is already booked by ${className} at this time.`,
      };
    }
  }

  return { hasConflict: false };
}
