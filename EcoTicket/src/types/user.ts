export type UserRole = 'AGENTE' | 'CLIENTE' | 'ADMINISTRADOR'

export type BaseProfile = {
  id: string
  username: string
  fullName: string
  email: string
  address: string
  cityId: string
  phones: string[]
  role: UserRole
  updatedAt?: string
}

export type ClienteProfile = BaseProfile & {
  role: 'CLIENTE'
  points: number
  showAds: boolean
}

export type AgenteProfile = BaseProfile & {
  role: 'AGENTE'
  commission: number
  experience: string
}

export type AdministradorProfile = BaseProfile & {
  role: 'ADMINISTRADOR'
  salary: number
  schedule: string
}

export type Profile = ClienteProfile | AgenteProfile | AdministradorProfile

export type Country = {
  id: string
  name: string
}

export type Department = {
  id: string
  name: string
  countryId: string
}

export type City = {
  id: string
  name: string
  departmentId: string
}
