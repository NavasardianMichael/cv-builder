import type { User } from '@store/auth/types'
import type { Endpoint } from '@interfaces/api'

export type GetMeAPI = Endpoint<{ payload: void; response: User | null; processed: User | null }>

export type RegisterPayload = { fullName: string; email: string; password: string }
export type RegisterAPI = Endpoint<{ payload: RegisterPayload; response: User; processed: User }>

export type LoginPayload = { email: string; password: string }
export type LoginAPI = Endpoint<{ payload: LoginPayload; response: User; processed: User }>

export type LogoutAPI = Endpoint<{ payload: void; response: null; processed: void }>

export type UpdateMePayload = { fullName: string }
export type UpdateMeAPI = Endpoint<{ payload: UpdateMePayload; response: User; processed: User }>

export type DeleteMeAPI = Endpoint<{ payload: void; response: null; processed: void }>

export type ChangePasswordPayload = { currentPassword?: string; newPassword: string }
export type ChangePasswordAPI = Endpoint<{ payload: ChangePasswordPayload; response: User; processed: User }>

export type ForgotPasswordPayload = { email: string }
export type ForgotPasswordAPI = Endpoint<{ payload: ForgotPasswordPayload; response: null; processed: void }>

export type ResetPasswordPayload = { token: string; password: string }
export type ResetPasswordAPI = Endpoint<{ payload: ResetPasswordPayload; response: User; processed: User }>
