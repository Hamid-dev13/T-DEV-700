import express from "express";

// define Response.sendError()
express.response.sendError = function sendError(error?: any | null, code?: number | null) {
  code = code || 500;
  if (error instanceof Error)
    error = error.message
  return error ? this.status(code).json({ error }) : this.sendStatus(code);
}