// ========== USER ==========
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role?: 'employee' | 'manager' | 'admin';
  }
  
  export interface LoginResponse {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role?: string;
  }
  
  // ========== CLOCK ==========
  export interface Clock {
    id: string;
    user_id: string;
    at: string; // ISO date string
  }
  
  // ========== ATTENDANCE ==========
  export interface AttendanceDelay {
    date: string;
    status: 'on_time' | 'late';
    delay_minutes: number;
  }
  
  // ========== API ERRORS ==========
  export interface ApiError {
    error: string;
  }
  
  // ========== TEAMS ==========
  export interface Team {
    id: string;
    name: string;
    description: string;
    managerId: string;
    startHour: number;
    endHour: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    admin: boolean;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserTeam {
    team: Team;
    manager: TeamMember;
    members: TeamMember[];
  }