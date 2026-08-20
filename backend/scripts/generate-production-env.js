#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const generateSecret = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const targetPath = path.resolve(__dirname, "..", ".env.production");
const examplePath = path.resolve(__dirname, "..", ".env.production.example");

if (fs.existsSync(targetPath)) {
  console.log(`[INFO] .env.production already exists at: ${targetPath}`);
  process.exit(0);
}

let template = fs.readFileSync(examplePath, "utf8");

const jwtSecret = generateSecret(32);
const cookieSecret = generateSecret(24);
const turnSecret = generateSecret(24);

template = template.replace("replace_with_a_secure_random_string_at_least_32_chars", jwtSecret);
template = template.replace("replace_with_a_secure_random_cookie_secret", cookieSecret);

fs.writeFileSync(targetPath, template, "utf8");
console.log(`[SUCCESS] Generated production configuration template at: ${targetPath}`);
console.log(`[INFO] Generated secure JWT_SECRET and COOKIE_SECRET.`);
