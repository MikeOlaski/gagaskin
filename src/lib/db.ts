import { supabase } from "@/integrations/supabase/client";

/**
 * The generated Supabase types in `src/integrations/supabase/types.ts` are produced by
 * Lovable and are marked "do not edit directly". They do not yet name the public front
 * end's tables or functions, because Lovable regenerates that file on its own sync.
 *
 * Until it does, the new tables and RPCs go through this one accessor rather than a cast
 * at every call site. When `types.ts` regenerates, delete this file and import `supabase`
 * directly — the call signatures are deliberately identical.
 */
type Row = Record<string, unknown>;

interface UntypedTable {
  select: (columns?: string) => UntypedQuery;
  insert: (values: Row | Row[]) => PromiseLike<{ error: { message: string } | null }>;
  update: (values: Row) => UntypedQuery;
}

interface UntypedQuery extends PromiseLike<{ data: Row[] | null; error: { message: string } | null }> {
  eq: (column: string, value: unknown) => UntypedQuery;
  order: (column: string, opts?: { ascending?: boolean }) => UntypedQuery;
}

export function table(name: string): UntypedTable {
  return (supabase.from as unknown as (n: string) => UntypedTable)(name);
}

export function rpc<T>(fn: string, args: Row): PromiseLike<{ data: T | null; error: { message: string } | null }> {
  return (supabase.rpc as unknown as (
    f: string,
    a: Row,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>)(fn, args);
}
