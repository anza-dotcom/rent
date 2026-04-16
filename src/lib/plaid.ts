import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
        "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
      },
    },
  })
);

export const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS ?? "transactions")
  .split(",")
  .map((p) => p.trim()) as ("transactions" | "auth")[];

export const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES ?? "US")
  .split(",")
  .map((c) => c.trim()) as ("US" | "CA" | "GB")[];
