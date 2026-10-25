import { z } from "zod";

/**
 * Standard PostgreSQL 128-bit hex UUID representation.
 * Supports both RFC-compliant UUIDs and seeded/mock UUIDs like 11111111-1111-1111-1111-111111111111.
 */
export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const uuidSchema = (message = "Invalid identifier") =>
  z.string().regex(UUID_REGEX, message);
