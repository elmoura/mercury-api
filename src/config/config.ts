import 'dotenv/config';

/** Chave lida em tempo de execução (facilita testes e evita cache no import). */
export function getAdminApiKey(): string {
  return process.env.ADMIN_API_KEY ?? '';
}

/** Segredo HS256 para JWT de utilizadores do tenant (adonis-web). */
export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? '';
}

export const config = {
  mongoUri: process.env.MONGO_URI ?? '',
  /**
   * CORS: em desenvolvimento aceita-se qualquer origem em `localhost` / `127.0.0.1` (ex.: Vite).
   * Em produção só entram `mail.frontendUrl`, `cors.extraOrigins` e, se definido, `CORS_ALLOW_LOCALHOST=true`.
   */
  cors: {
    extraOrigins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    allowLocalhost:
      process.env.NODE_ENV !== 'production' ||
      process.env.CORS_ALLOW_LOCALHOST === 'true',
  },
  mail: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM ?? 'no-reply@falae.ai',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    confirmAccountHashSecret: process.env.CONFIRM_ACCOUNT_HASH_SECRET ?? '',
    passwordMd5Salt: process.env.PASSWORD_MD5_SALT ?? '',
    inviteTokenTtlMs: (() => {
      const n = Number(process.env.INVITE_TOKEN_TTL_MS);
      return Number.isFinite(n) && n > 0 ? n : 48 * 60 * 60 * 1000;
    })(),
  },
  agents: {
    promptMaxChars: (() => {
      const n = Number(process.env.AGENT_PROMPT_MAX_CHARS);
      return Number.isFinite(n) && n > 0 ? n : 8000;
    })(),
  },
  whatsapp: {
    verificationToken: process.env.WHATSAPP_VERIFICATION_TOKEN ?? '',
    businessToken: process.env.WHATSAPP_BUSINESS_TOKEN ?? '',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? '',
    /** Exchange fanout: um publish replica para todas as filas bound. */
    inboundExchange:
      process.env.RABBITMQ_WHATSAPP_INBOUND_EXCHANGE ??
      'whatsapp.inbound.fanout',
  },
  meta: {
    appId: process.env.META_APP_ID ?? '',
    appSecret: process.env.META_APP_SECRET ?? '',
    oauthStateMaxAgeMs: (() => {
      const n = Number(process.env.META_OAUTH_STATE_MAX_AGE_MS);
      return Number.isFinite(n) && n > 0 ? n : 10 * 60 * 1000;
    })(),
  },
};
