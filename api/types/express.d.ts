declare global {
  namespace Express {
    interface Request {
      // add fields related to user for authentication
      user_id?: string,
      admin?: boolean
    }

    interface Response {
      // definition in utils/response-extend.ts
      sendError(message: any | null, statusCode?: number): this;
    }
  }
}

export {};