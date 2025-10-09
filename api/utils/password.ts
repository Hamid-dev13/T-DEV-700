import crypto from "crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_N = 16384; // CPU/memory cost parameter
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      plainPassword,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, key) => {
        if (err) return reject(err);
        resolve(key as Buffer);
      }
    );
  });
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  plainPassword: string,
  hashed: string
): Promise<boolean> {
  const [saltHex, hashHex] = hashed.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      plainPassword,
      salt,
      expected.length,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, key) => {
        if (err) return reject(err);
        resolve(key as Buffer);
      }
    );
  });
  return crypto.timingSafeEqual(derivedKey, expected);
}
