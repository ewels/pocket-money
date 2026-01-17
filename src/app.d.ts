/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string;
        photo_url: string | null;
        photo_data: string | null;
        family_id: string | null;
      } | null;
      session: {
        id: string;
        pin_verified_at: number | null;
      } | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        SESSION_SECRET: string;
      };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
