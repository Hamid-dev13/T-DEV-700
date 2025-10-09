import { SafeUser } from "../models/user.model"

declare global {
  namespace Express {
    interface Request {
      // add fields related to user for authentication
      user_id?: string,
      admin?: boolean
    }
  }
}