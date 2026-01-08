export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  admin: false,
  phone: undefined
}

export const mockManager = {
  id: 'manager1',
  email: 'manager@example.com',
  firstName: 'Manager',
  lastName: 'User',
  admin: false,
  phone: '+33123456789'
}

export const mockTeam = {
  id: 'team1',
  name: 'Engineering Team',
  description: 'Test team description',
  managerId: 'manager1',
  startHour: 9,
  endHour: 17
}

export const mockTeamData = {
  team: mockTeam,
  manager: mockManager,
  members: [
    {
      id: 'member1',
      firstName: 'Alice',
      lastName: 'Developer',
      email: 'alice@example.com',
      admin: false,
      phone: undefined
    },
    {
      id: 'member2',
      firstName: 'Bob',
      lastName: 'Designer',
      email: 'bob@example.com',
      admin: false,
      phone: undefined
    }
  ]
}

export const mockClocks = [
  { date: new Date('2025-01-15T09:00:00'), iso: '2025-01-15T09:00:00Z' },
  { date: new Date('2025-01-15T17:00:00'), iso: '2025-01-15T17:00:00Z' }
]
