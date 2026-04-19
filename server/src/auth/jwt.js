import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const EXPIRES = "7d";

export function signAccessToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
