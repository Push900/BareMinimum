export const ENV = {
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get ownerAccountId() { return process.env.OWNER_ACCOUNT_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
};
