import { withSupabase } from 'npm:@supabase/server@1';
import { handleAdminUsers } from './handler.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const body = await req.json().catch(() => null);
    const result = await handleAdminUsers(body, ctx.userClaims!.id, ctx.supabaseAdmin);
    return Response.json(result.body, { status: result.status });
  }),
};
