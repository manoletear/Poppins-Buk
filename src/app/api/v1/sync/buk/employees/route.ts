import { createServiceClient } from '@/lib/supabase/service';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!['org_admin', 'super_admin'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const service = createServiceClient();

  // 1. Get org BUK credentials
  const { data: org, error: orgError } = await service
    .from('organizations')
    .select('buk_tenant_url, buk_api_token_encrypted')
    .eq('id', ctx.orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
  }

  if (!org.buk_tenant_url || !org.buk_api_token_encrypted) {
    return NextResponse.json({ error: 'BUK no configurado' }, { status: 400 });
  }

  // 2. Log sync start
  const startedAt = new Date().toISOString();
  const { data: syncLog } = await service
    .from('buk_sync_log')
    .insert({
      org_id: ctx.orgId,
      endpoint: '/api/v1/chile/employees',
      direction: 'pull',
      status: 'success',
      records_synced: 0,
      records_failed: 0,
      started_at: startedAt,
    })
    .select()
    .single();

  const syncLogId = syncLog?.id;

  // 3. Fetch employees from BUK
  let bukEmployees: any[] = [];
  try {
    const response = await fetch(`${org.buk_tenant_url}/api/v1/chile/employees`, {
      headers: {
        Authorization: `Token token=${org.buk_api_token_encrypted}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      if (syncLogId) {
        await service
          .from('buk_sync_log')
          .update({
            status: 'error',
            error_message: `BUK API error ${response.status}: ${errText}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }
      return NextResponse.json({ error: `BUK API error: ${response.status}` }, { status: 502 });
    }

    const json = await response.json();
    bukEmployees = Array.isArray(json) ? json : (json.employees ?? json.data ?? []);
  } catch (fetchError) {
    const errMsg = fetchError instanceof Error ? fetchError.message : 'Error de conexión a BUK';
    if (syncLogId) {
      await service
        .from('buk_sync_log')
        .update({
          status: 'error',
          error_message: errMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);
    }
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  // 4. Upsert employees into Supabase
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const bukEmp of bukEmployees) {
    const employeePayload = {
      org_id: ctx.orgId,
      buk_id: String(bukEmp.id),
      rut: bukEmp.rut ?? null,
      nombre: bukEmp.nombre ?? null,
      apellido: bukEmp.apellido_paterno ?? null,
      segundo_apellido: bukEmp.apellido_materno ?? null,
      email: bukEmp.email ?? null,
      telefono: bukEmp.telefono ?? null,
      fecha_ingreso: bukEmp.fecha_ingreso ?? null,
      estado: bukEmp.activo === true ? 'activo' : 'inactivo',
      buk_synced_at: new Date().toISOString(),
    };

    const { error: upsertError } = await service
      .from('employees')
      .upsert(employeePayload, { onConflict: 'org_id,buk_id' });

    if (upsertError) {
      failed++;
      errors.push(`${bukEmp.id}: ${upsertError.message}`);
    } else {
      synced++;
    }
  }

  // 5. Update sync log with result
  const finalStatus = failed === 0 ? 'success' : synced > 0 ? 'partial' : 'error';
  if (syncLogId) {
    await service
      .from('buk_sync_log')
      .update({
        status: finalStatus,
        records_synced: synced,
        records_failed: failed,
        error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLogId);
  }

  return NextResponse.json({ synced, failed, status: finalStatus });
}
