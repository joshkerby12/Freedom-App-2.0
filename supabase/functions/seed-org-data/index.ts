import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RoleSeed = {
  name: string;
  sort_order: number;
};

type PermissionMatrix = {
  permission_key: string;
  roles: string[];
};

type PaymentTermSeed = {
  name: string;
  days_until_due: number;
  sort_order: number;
};

type EstimateTypeSeed = {
  name: string;
  prefix: string;
  next_number: number;
  requires_signature: boolean;
  sort_order: number;
};

type ExpenseBucketSeed = {
  name: string;
  parent_name: string | null;
  cost_model: 'project' | 'bucket' | null;
  estimate_type_name: string | null;
  sort_order: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const roleSeeds: RoleSeed[] = [
  { name: 'Owner', sort_order: 10 },
  { name: 'Executive', sort_order: 20 },
  { name: 'Operations Director', sort_order: 30 },
  { name: 'Manager', sort_order: 40 },
  { name: 'Sales / Estimator', sort_order: 50 },
  { name: 'Marketing', sort_order: 60 },
  { name: 'Crew Lead / PM', sort_order: 70 },
  { name: 'Fleet Manager', sort_order: 80 },
  { name: 'Driver', sort_order: 90 },
  { name: 'Field', sort_order: 100 },
];

const permissionMatrix: PermissionMatrix[] = [
  { permission_key: 'clients.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator', 'Marketing'] },
  { permission_key: 'clients.create', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator'] },
  { permission_key: 'clients.edit', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator'] },
  { permission_key: 'clients.delete', roles: ['Owner', 'Executive', 'Operations Director'] },
  { permission_key: 'estimates.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator', 'Marketing'] },
  { permission_key: 'estimates.create', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator'] },
  { permission_key: 'estimates.edit', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator'] },
  { permission_key: 'estimates.delete', roles: ['Owner', 'Executive', 'Operations Director'] },
  { permission_key: 'jobs.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator', 'Crew Lead / PM', 'Driver', 'Field'] },
  { permission_key: 'jobs.create', roles: ['Owner', 'Executive', 'Operations Director', 'Manager'] },
  { permission_key: 'jobs.edit', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM'] },
  { permission_key: 'jobs.delete', roles: ['Owner', 'Executive', 'Operations Director'] },
  { permission_key: 'catalog.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator'] },
  { permission_key: 'catalog.manage', roles: ['Owner', 'Executive', 'Operations Director', 'Manager'] },
  { permission_key: 'employees.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager'] },
  { permission_key: 'employees.manage', roles: ['Owner', 'Executive', 'Operations Director'] },
  { permission_key: 'compensation.view', roles: ['Owner', 'Executive'] },
  { permission_key: 'settings.manage', roles: ['Owner', 'Executive'] },
  { permission_key: 'financials.view', roles: ['Owner', 'Executive', 'Operations Director'] },
  { permission_key: 'scheduling.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM', 'Driver', 'Field'] },
  { permission_key: 'scheduling.manage', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM'] },
  { permission_key: 'fleet.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM', 'Fleet Manager', 'Driver'] },
  { permission_key: 'fleet.manage', roles: ['Owner', 'Executive', 'Operations Director', 'Fleet Manager'] },
  { permission_key: 'equipment.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM', 'Fleet Manager', 'Driver'] },
  { permission_key: 'equipment.schedule', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Crew Lead / PM', 'Fleet Manager'] },
  { permission_key: 'equipment.approve', roles: ['Owner', 'Executive', 'Operations Director', 'Fleet Manager'] },
  { permission_key: 'reports.view', roles: ['Owner', 'Executive', 'Operations Director', 'Manager', 'Sales / Estimator', 'Marketing'] },
];

const paymentTermSeeds: PaymentTermSeed[] = [
  { name: 'Due on Receipt', days_until_due: 0, sort_order: 10 },
  { name: 'Net 7', days_until_due: 7, sort_order: 20 },
  { name: 'Net 15', days_until_due: 15, sort_order: 30 },
  { name: 'Net 30', days_until_due: 30, sort_order: 40 },
  { name: 'Net 45', days_until_due: 45, sort_order: 50 },
];

const estimateTypeSeeds: EstimateTypeSeed[] = [
  { name: 'Design/Build', prefix: 'DB', next_number: 10000, requires_signature: true, sort_order: 10 },
  { name: 'Special Projects', prefix: 'SP', next_number: 20000, requires_signature: false, sort_order: 20 },
  { name: 'Irrigation', prefix: 'IR', next_number: 30000, requires_signature: true, sort_order: 30 },
  { name: 'Maintenance', prefix: 'MTN', next_number: 40000, requires_signature: true, sort_order: 40 },
  { name: 'Snow', prefix: 'SN', next_number: 50000, requires_signature: true, sort_order: 50 },
];

const expenseBucketSeeds: ExpenseBucketSeed[] = [
  { name: 'Projects', parent_name: null, cost_model: null, estimate_type_name: null, sort_order: 10 },
  { name: 'Design/Build', parent_name: 'Projects', cost_model: 'project', estimate_type_name: 'Design/Build', sort_order: 20 },
  { name: 'Special Projects', parent_name: 'Projects', cost_model: 'project', estimate_type_name: 'Special Projects', sort_order: 30 },
  { name: 'Irrigation Install', parent_name: 'Projects', cost_model: 'project', estimate_type_name: 'Irrigation', sort_order: 40 },
  { name: 'Maintenance', parent_name: null, cost_model: null, estimate_type_name: null, sort_order: 50 },
  { name: 'Residential Maintenance', parent_name: 'Maintenance', cost_model: 'bucket', estimate_type_name: 'Maintenance', sort_order: 60 },
  { name: 'Commercial Maintenance', parent_name: 'Maintenance', cost_model: 'bucket', estimate_type_name: 'Maintenance', sort_order: 70 },
  { name: 'Snow', parent_name: null, cost_model: null, estimate_type_name: null, sort_order: 80 },
  { name: 'Residential Snow', parent_name: 'Snow', cost_model: 'bucket', estimate_type_name: 'Snow', sort_order: 90 },
  { name: 'Commercial Snow', parent_name: 'Snow', cost_model: 'bucket', estimate_type_name: 'Snow', sort_order: 100 },
  { name: 'Irrigation', parent_name: null, cost_model: null, estimate_type_name: null, sort_order: 110 },
  { name: 'Irrigation Service', parent_name: 'Irrigation', cost_model: 'bucket', estimate_type_name: 'Irrigation', sort_order: 120 },
  { name: 'Overhead', parent_name: null, cost_model: null, estimate_type_name: null, sort_order: 130 },
  { name: 'Admin', parent_name: 'Overhead', cost_model: 'bucket', estimate_type_name: null, sort_order: 140 },
  { name: 'Vehicles & Equipment', parent_name: 'Overhead', cost_model: 'bucket', estimate_type_name: null, sort_order: 150 },
  { name: 'Payroll / Labor (non-job)', parent_name: 'Overhead', cost_model: 'bucket', estimate_type_name: null, sort_order: 160 },
];

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

    const requestBody = await req.json();
    const orgId: string | undefined = requestBody?.org_id;

    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
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

    const { data: membership, error: membershipError } = await serviceClient
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roleNameToId = await seedRoles(serviceClient, orgId);
    const estimateTypeNameToId = await seedEstimateTypes(serviceClient, orgId);

    const permissionsInserted = await seedRolePermissions(serviceClient, orgId, roleNameToId);
    const paymentTermsInserted = await seedPaymentTerms(serviceClient, orgId);
    const estimateTypesInserted = estimateTypeNameToId.size;
    const expenseBucketsInserted = await seedExpenseBuckets(serviceClient, orgId, estimateTypeNameToId);

    return new Response(
      JSON.stringify({
        success: true,
        org_id: orgId,
        roles_seeded: roleNameToId.size,
        role_permissions_inserted: permissionsInserted,
        payment_terms_seeded: paymentTermsInserted,
        estimate_types_seeded: estimateTypesInserted,
        expense_buckets_seeded: expenseBucketsInserted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Seed failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function seedRoles(serviceClient: ReturnType<typeof createClient>, orgId: string) {
  const { data: existingRoles, error: existingRolesError } = await serviceClient
    .from('roles')
    .select('id,name')
    .eq('org_id', orgId);

  if (existingRolesError) {
    throw existingRolesError;
  }

  const existingByName = new Map((existingRoles ?? []).map((role) => [role.name as string, role.id as string]));

  const missingRoles = roleSeeds
    .filter((role) => !existingByName.has(role.name))
    .map((role) => ({
      org_id: orgId,
      name: role.name,
      is_system: true,
      sort_order: role.sort_order,
    }));

  if (missingRoles.length > 0) {
    const { error: insertRoleError } = await serviceClient.from('roles').insert(missingRoles);
    if (insertRoleError) {
      throw insertRoleError;
    }
  }

  const { data: allRoles, error: allRolesError } = await serviceClient
    .from('roles')
    .select('id,name')
    .eq('org_id', orgId);

  if (allRolesError) {
    throw allRolesError;
  }

  return new Map((allRoles ?? []).map((role) => [role.name as string, role.id as string]));
}

async function seedRolePermissions(
  serviceClient: ReturnType<typeof createClient>,
  orgId: string,
  roleNameToId: Map<string, string>,
) {
  const { data: existingPermissions, error: existingPermissionsError } = await serviceClient
    .from('role_permissions')
    .select('role_id,permission_key')
    .eq('org_id', orgId);

  if (existingPermissionsError) {
    throw existingPermissionsError;
  }

  const existingKeySet = new Set(
    (existingPermissions ?? []).map(
      (permission) => `${permission.role_id as string}:${permission.permission_key as string}`,
    ),
  );

  const inserts: { org_id: string; role_id: string; permission_key: string; granted: boolean }[] = [];

  for (const permission of permissionMatrix) {
    for (const roleName of permission.roles) {
      const roleId = roleNameToId.get(roleName);
      if (!roleId) {
        continue;
      }

      const compositeKey = `${roleId}:${permission.permission_key}`;
      if (existingKeySet.has(compositeKey)) {
        continue;
      }

      inserts.push({
        org_id: orgId,
        role_id: roleId,
        permission_key: permission.permission_key,
        granted: true,
      });
    }
  }

  if (inserts.length > 0) {
    const { error: insertPermissionsError } = await serviceClient
      .from('role_permissions')
      .insert(inserts);

    if (insertPermissionsError) {
      throw insertPermissionsError;
    }
  }

  return inserts.length;
}

async function seedPaymentTerms(serviceClient: ReturnType<typeof createClient>, orgId: string) {
  const { data: existingTerms, error: existingTermsError } = await serviceClient
    .from('payment_terms')
    .select('name')
    .eq('org_id', orgId);

  if (existingTermsError) {
    throw existingTermsError;
  }

  const existingNames = new Set((existingTerms ?? []).map((term) => term.name as string));

  const inserts = paymentTermSeeds
    .filter((term) => !existingNames.has(term.name))
    .map((term) => ({
      org_id: orgId,
      name: term.name,
      days_until_due: term.days_until_due,
      sort_order: term.sort_order,
      is_active: true,
    }));

  if (inserts.length > 0) {
    const { error: insertTermsError } = await serviceClient.from('payment_terms').insert(inserts);
    if (insertTermsError) {
      throw insertTermsError;
    }
  }

  return inserts.length;
}

async function seedEstimateTypes(serviceClient: ReturnType<typeof createClient>, orgId: string) {
  const { data: existingEstimateTypes, error: existingEstimateTypesError } = await serviceClient
    .from('estimate_types')
    .select('id,name')
    .eq('org_id', orgId);

  if (existingEstimateTypesError) {
    throw existingEstimateTypesError;
  }

  const existingByName = new Map(
    (existingEstimateTypes ?? []).map((estimateType) => [estimateType.name as string, estimateType.id as string]),
  );

  const inserts = estimateTypeSeeds
    .filter((estimateType) => !existingByName.has(estimateType.name))
    .map((estimateType) => ({
      org_id: orgId,
      name: estimateType.name,
      prefix: estimateType.prefix,
      next_number: estimateType.next_number,
      requires_signature: estimateType.requires_signature,
      sort_order: estimateType.sort_order,
      is_active: true,
    }));

  if (inserts.length > 0) {
    const { error: insertEstimateTypesError } = await serviceClient
      .from('estimate_types')
      .insert(inserts);

    if (insertEstimateTypesError) {
      throw insertEstimateTypesError;
    }
  }

  const { data: allEstimateTypes, error: allEstimateTypesError } = await serviceClient
    .from('estimate_types')
    .select('id,name')
    .eq('org_id', orgId);

  if (allEstimateTypesError) {
    throw allEstimateTypesError;
  }

  return new Map(
    (allEstimateTypes ?? []).map((estimateType) => [estimateType.name as string, estimateType.id as string]),
  );
}

async function seedExpenseBuckets(
  serviceClient: ReturnType<typeof createClient>,
  orgId: string,
  estimateTypeNameToId: Map<string, string>,
) {
  const { data: existingBuckets, error: existingBucketsError } = await serviceClient
    .from('expense_buckets')
    .select('id,name')
    .eq('org_id', orgId);

  if (existingBucketsError) {
    throw existingBucketsError;
  }

  const nameToId = new Map((existingBuckets ?? []).map((bucket) => [bucket.name as string, bucket.id as string]));
  let insertedCount = 0;

  for (const seed of expenseBucketSeeds) {
    if (nameToId.has(seed.name)) {
      continue;
    }

    const parentBucketId = seed.parent_name ? nameToId.get(seed.parent_name) ?? null : null;
    const estimateTypeId = seed.estimate_type_name
      ? estimateTypeNameToId.get(seed.estimate_type_name) ?? null
      : null;

    const { data: insertedBucket, error: insertBucketError } = await serviceClient
      .from('expense_buckets')
      .insert({
        org_id: orgId,
        name: seed.name,
        parent_bucket_id: parentBucketId,
        cost_model: seed.cost_model,
        estimate_type_id: estimateTypeId,
        is_active: true,
        sort_order: seed.sort_order,
      })
      .select('id,name')
      .single();

    if (insertBucketError) {
      throw insertBucketError;
    }

    nameToId.set(insertedBucket.name as string, insertedBucket.id as string);
    insertedCount += 1;
  }

  return insertedCount;
}
