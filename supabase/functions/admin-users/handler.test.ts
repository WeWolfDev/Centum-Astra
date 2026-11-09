import { beforeEach, describe, expect, test, vi } from 'vitest';
import { handleAdminUsers } from './handler.ts';

const ADMIN = 'admin-id';
const TARGET = 'target-id';

function fakeAdmin(perfiles: Record<string, { role: string; status: string }>) {
  const log = { profileInserts: [] as unknown[], profileUpdates: [] as unknown[], audits: [] as Array<Record<string, unknown>> };
  const errores: { profileInsert?: unknown; profileUpdate?: unknown } = {};
  const auth = {
    inviteUserByEmail: vi.fn().mockResolvedValue({ data: { user: { id: 'nuevo-id' } }, error: null }),
    updateUserById: vi.fn().mockResolvedValue({ error: null }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
  };
  const admin = {
    auth: { admin: auth },
    from(tabla: string) {
      if (tabla === 'audit_logs') {
        return { insert: (fila: Record<string, unknown>) => { log.audits.push(fila); return Promise.resolve({ error: null }); } };
      }
      return {
        select: () => ({
          eq: (_c: string, id: string) => ({
            maybeSingle: () => Promise.resolve({ data: perfiles[id] ?? null, error: null }),
          }),
        }),
        insert: (fila: unknown) => {
          log.profileInserts.push(fila);
          return Promise.resolve({ error: errores.profileInsert ?? null });
        },
        update: (valores: unknown) => ({
          eq: () => {
            log.profileUpdates.push(valores);
            return Promise.resolve({ error: errores.profileUpdate ?? null });
          },
        }),
      };
    },
  };
  return { admin, auth, log, errores };
}

let ctx: ReturnType<typeof fakeAdmin>;

beforeEach(() => {
  ctx = fakeAdmin({
    [ADMIN]: { role: 'admin', status: 'active' },
    [TARGET]: { role: 'student', status: 'active' },
  });
});

describe('autorización', () => {
  test('rechaza a quien no es administrador', async () => {
    const r = await handleAdminUsers({ action: 'suspend', userId: ADMIN, reason: 'x' }, TARGET, ctx.admin);
    expect(r.status).toBe(403);
    expect(ctx.auth.updateUserById).not.toHaveBeenCalled();
  });

  test('rechaza a un administrador suspendido', async () => {
    const c = fakeAdmin({ [ADMIN]: { role: 'admin', status: 'suspended' } });
    const r = await handleAdminUsers({ action: 'invite' }, ADMIN, c.admin);
    expect(r.status).toBe(403);
  });

  test('rechaza una acción desconocida', async () => {
    const r = await handleAdminUsers({ action: 'borrar-todo' }, ADMIN, ctx.admin);
    expect(r.status).toBe(400);
  });
});

describe('invite', () => {
  const body = { action: 'invite', email: ' Ana@Centum.MX ', fullName: 'Ana', role: 'student' };

  test('invita, crea el perfil con el rol elegido y audita', async () => {
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(201);
    expect(ctx.auth.inviteUserByEmail).toHaveBeenCalledWith('ana@centum.mx');
    expect(ctx.log.profileInserts[0]).toEqual({ id: 'nuevo-id', email: 'ana@centum.mx', full_name: 'Ana', role: 'student' });
    expect(ctx.log.audits[0].action).toBe('user.invited');
  });

  test('rechaza un rol inválido sin invitar', async () => {
    const r = await handleAdminUsers({ ...body, role: 'superadmin' }, ADMIN, ctx.admin);
    expect(r.status).toBe(400);
    expect(ctx.auth.inviteUserByEmail).not.toHaveBeenCalled();
  });

  test('informa si el correo ya existe', async () => {
    ctx.auth.inviteUserByEmail.mockResolvedValue({ data: null, error: { code: 'email_exists', status: 422 } });
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
  });

  test('borra el usuario de Auth si falla el perfil', async () => {
    ctx.errores.profileInsert = { code: 'XX000' };
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.deleteUser).toHaveBeenCalledWith('nuevo-id');
  });
});

describe('update', () => {
  test('explica el bloqueo si la cuenta tiene grupos', async () => {
    ctx.errores.profileUpdate = { code: 'CA001' };
    const r = await handleAdminUsers({ action: 'update', userId: TARGET, fullName: 'Ana', role: 'teacher' }, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/grupos/);
  });

  test('impide cambiar el rol propio', async () => {
    const r = await handleAdminUsers({ action: 'update', userId: ADMIN, fullName: 'Yo', role: 'student' }, ADMIN, ctx.admin);
    expect(r.status).toBe(400);
  });

  test('permite editar el nombre propio', async () => {
    const r = await handleAdminUsers({ action: 'update', userId: ADMIN, fullName: 'Yo', role: 'admin' }, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
  });
});

describe('suspend, reactivate y delete', () => {
  test('suspender bloquea el acceso y guarda el motivo', async () => {
    const r = await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: ' Adeudo ' }, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
    expect(ctx.auth.updateUserById).toHaveBeenCalledWith(TARGET, { ban_duration: '876000h' });
    expect(ctx.log.profileUpdates[0]).toMatchObject({ status: 'suspended' });
    expect(ctx.log.audits[0]).toMatchObject({ action: 'user.suspended', metadata: { reason: 'Adeudo' } });
  });

  test('exige motivo para suspender', async () => {
    const r = await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: '  ' }, ADMIN, ctx.admin);
    expect(r.status).toBe(400);
    expect(ctx.auth.updateUserById).not.toHaveBeenCalled();
  });

  test('impide suspenderse a sí mismo', async () => {
    const r = await handleAdminUsers({ action: 'suspend', userId: ADMIN, reason: 'x' }, ADMIN, ctx.admin);
    expect(r.status).toBe(400);
  });

  test('revierte el bloqueo si falla el perfil', async () => {
    ctx.errores.profileUpdate = { code: 'XX000' };
    const r = await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: 'x' }, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: 'none' });
  });

  test('solo reactiva cuentas suspendidas', async () => {
    const r = await handleAdminUsers({ action: 'reactivate', userId: TARGET }, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
  });

  test('eliminar conserva la cuenta como eliminada, sin borrado físico', async () => {
    const r = await handleAdminUsers({ action: 'delete', userId: TARGET, reason: 'Baja' }, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
    expect(ctx.auth.deleteUser).not.toHaveBeenCalled();
    expect(ctx.log.profileUpdates[0]).toMatchObject({ status: 'deleted' });
  });
});
