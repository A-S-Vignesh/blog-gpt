type EnvDef = {
  name: string;
  required: boolean;
  pattern?: RegExp;
};

const ENV_DEFS: EnvDef[] = [
  { name: "MONGODB_URI", required: true, pattern: /^mongodb(\+srv)?:\/\// },
  { name: "NEXTAUTH_SECRET", required: true },
  { name: "NEXTAUTH_URL", required: true, pattern: /^https?:\/\// },
  { name: "GOOGLE_CLIENT_ID", required: true },
  { name: "GOOGLE_CLIENT_SECRET", required: true },
  { name: "GOOGLE_GENETATIVE_AI", required: true },
  { name: "CLOUDINARY_CLOUD_NAME", required: true },
  { name: "CLOUDINARY_API_KEY", required: true },
  { name: "CLOUDINARY_API_SECRET", required: true },
];

type ValidatedEnv = {
  MONGODB_URI: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_GENETATIVE_AI: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

let cached: ValidatedEnv | null = null;

export function getEnv(): ValidatedEnv {
  if (cached) return cached;

  const errors: string[] = [];
  const out: Record<string, string> = {};

  for (const def of ENV_DEFS) {
    const value = process.env[def.name];
    if (!value || value.trim().length === 0) {
      if (def.required) errors.push(`Missing required env var: ${def.name}`);
      continue;
    }
    if (def.pattern && !def.pattern.test(value)) {
      errors.push(`Env var ${def.name} has invalid format`);
      continue;
    }
    out[def.name] = value;
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n  - ${errors.join("\n  - ")}`,
    );
  }

  cached = out as ValidatedEnv;
  return cached;
}

export function getEnvVar<K extends keyof ValidatedEnv>(key: K): ValidatedEnv[K] {
  return getEnv()[key];
}
