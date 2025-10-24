export interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    admin: boolean
    phone: string | undefined
}

export interface Team {
    id: string
    name: string
    description: string
    managerId: string
    startHour: number
    endHour: number
}

export interface Clock {
    id: string
    user_id: string
    at: string
}

export interface LeavePeriod {
    id: string
    user_id: string
    startDate: string
    endDate: string
    accepted: boolean
    createdAt: string
}