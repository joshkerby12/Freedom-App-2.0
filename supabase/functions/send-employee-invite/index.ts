import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InvitePayload = {
  employee_id: string;
  email: string;
  token: string;
  org_name?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Partial<InvitePayload>;
    const employeeId = body.employee_id?.trim();
    const email = body.email?.trim();
    const token = body.token?.trim();

    if (!employeeId || !email || !token) {
      return new Response(JSON.stringify({ error: 'employee_id, email, and token are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: inviteRow, error: inviteError } = await serviceClient
      .from('employee_invites')
      .select('id, org_id, status')
      .eq('employee_id', employeeId)
      .eq('token', token)
      .maybeSingle();

    if (inviteError) {
      throw inviteError;
    }

    if (!inviteRow) {
      return new Response(JSON.stringify({ error: 'Invite record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: membership, error: membershipError } = await serviceClient
      .from('org_members')
      .select('role')
      .eq('org_id', inviteRow.org_id as string)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership || !['owner', 'admin'].includes((membership.role as string) ?? '')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? 'freedomapp://invite';
    const inviteLink = `${appBaseUrl}/accept?token=${encodeURIComponent(token)}`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@freedomapp.local';
    const orgName = body.org_name?.trim() || 'Freedom Landscapes';

    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject: `You are invited to join ${orgName}`,
          text: [
            `You were invited to join ${orgName} on Freedom App.`,
            `Accept invite: ${inviteLink}`,
            'This link expires in 7 days.',
          ].join('\n\n'),
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        throw new Error(`Resend request failed: ${resendResponse.status} ${errorText}`);
      }
    } else {
      console.log(
        JSON.stringify({
          event: 'employee_invite_email_skipped',
          reason: 'RESEND_API_KEY not configured',
          email,
          invite_link: inviteLink,
        }),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        invite_link: inviteLink,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to send invite email',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
