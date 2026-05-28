import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // Server-side admin check
    const { data: userRow, error: userErr } = await admin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (userErr || !userRow?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const jamId = typeof body?.jamId === 'string' ? body.jamId : null;
    const winners = Array.isArray(body?.winners) ? body.winners : null;
    if (!jamId || !winners) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: jam, error: jamErr } = await admin
      .from('jams')
      .select('id, title, thread_id')
      .eq('id', jamId)
      .maybeSingle();
    if (jamErr || !jam) {
      return new Response(JSON.stringify({ error: 'Jam not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!jam.thread_id) {
      return new Response(JSON.stringify({ error: 'Jam has no linked thread' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitize = (s: unknown, max = 200) =>
      String(s ?? '').replace(/[\r\n]+/g, ' ').slice(0, max);

    const lines = winners
      .map((w: any) => {
        const rank = Number(w?.rank);
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        const place = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
        return `${medal} **${place} place — ${sanitize(w?.productTitle)}** by ${sanitize(w?.creatorName)} · ${sanitize(w?.prize)}`;
      })
      .join('\n');

    const content = `🏆 **Winners Announced!**\n\nThank you to everyone who entered and voted in ${sanitize(jam.title)}. Here are your winners:\n\n${lines}\n\nPrizes will be paid out within 48 hours. Congratulations! 🎉`;

    const { error: insertErr } = await admin
      .from('forum_replies')
      .insert({ thread_id: jam.thread_id, author_id: userId, content });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to post announcement' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('announce-jam-winners error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
