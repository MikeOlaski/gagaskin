import { supabase } from "@/integrations/supabase/client";

/**
 * The generated Supabase types in `src/integrations/supabase/types.ts` are produced by
 * Lovable and marked "do not edit directly". They do not yet name the public front end's
 * tables or functions, because Lovable regenerates that file on its own sync.
 *
 * Until it does, the new tables and RPCs go through this one accessor rather than a cast
 * at every call site. When `types.ts` regenerates, delete this file and import `supabase`
 * directly — the call signatures are deliberately identical.
 *
 * These MUST be invoked as methods on the client. Pulling `supabase.rpc` out into a bare
 * function detaches `this`, and supabase-js reads `this.rest` internally — which fails at
 * runtime while typechecking perfectly happily.
 */
type Row = Record<string, unknown>;
type Result<T> = { data: T | null; error: { message: string } | null };

interface UntypedQuery<T> extends PromiseLike<Result<T>> {
  eq: (column: string, value: unknown) => UntypedQuery<T>;
  order: (column: string, opts?: { ascending?: boolean }) => UntypedQuery<T>;
  limit: (count: number) => UntypedQuery<T>;
}

interface UntypedTable {
  select: (columns?: string) => UntypedQuery<Row[]>;
  insert: (values: Row | Row[]) => PromiseLike<Result<unknown>>;
  update: (values: Row) => UntypedQuery<unknown>;
}

const client = supabase as unknown as {
  from: (name: string) => UntypedTable;
  rpc: <T>(fn: string, args: Row) => PromiseLike<Result<T>>;
};

export function table(name: string): UntypedTable {
  return client.from(name);
}

export function rpc<T>(fn: string, args: Row): PromiseLike<Result<T>> {
  return client.rpc<T>(fn, args);
}
