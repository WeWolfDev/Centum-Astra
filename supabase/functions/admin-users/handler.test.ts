import { beforeEach, describe, expect, test, vi } from 'vitest';
import { handleAdminUsers } from './handler.ts';

const ADMIN = 'admin-id';
const TARGET = 'target-id';

function fakeAdmin(perfiles: Record<string, { role: string; status: string }>) {
  const log = { rpcs: [] as Array<{ fn: string; args: Record<string, unknown> }> };
  const errores: { select?: unknown; rpc?: unknown } = {};
  // Permite simular lo que hizo otro administrador justo antes de esta llamada.
  const antesDeRpc = { fn: () => {} };
  const auth = {
    inviteUserByEmail: vi.fn().mockResolvedValue({ data: { user: { id: 'nuevo-id' } }, error: null }),
    updateUserById: vi.fn().mockResolvedValue({ error: null }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
  };
  const admin = {
    auth: { admin: auth },
    rpc(fn: string, args: Record<string, unknown>) {
      antesDeRpc.fn();
      log.rpcs.push({ fn, args });
      const error = errores.rpc ?? null;
      // Como la base: el estado cambia solo si la llamada sale bien.
      if (!error && fn === 'change_profile_status') {
        perfiles[args.target_profile as string].status = args.new_status as string;
      }
      return Promise.resolve({ error });
    },
    from() {
      return {
        select: () => ({
          eq: (_c: string, id: string) => ({
            maybeSingle: () => Promise.resolve(
              errores.select && id !== ADMIN ? { data: null, error: errores.select } : { data: perfiles[id] ?? null, error: null },
            ),
          }),
        }),
      };
    },
  };
  return { admin, auth, log, errores, perfiles, antesDeRpc };
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

  test('invita y crea el perfil con su auditoría en una sola llamada', async () => {
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(201);
    expect(ctx.auth.inviteUserByEmail).toHaveBeenCalledWith('ana@centum.mx');
    expect(ctx.log.rpcs).toEqual([{
      fn: 'create_profile',
      args: { target_profile: 'nuevo-id', new_email: 'ana@centum.mx', new_full_name: 'Ana', new_role: 'student', actor: ADMIN },
    }]);
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

  test('borra el usuario de Auth si falla el perfil o su auditoría', async () => {
    ctx.errores.rpc = { code: '23503' };
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.deleteUser).toHaveBeenCalledWith('nuevo-id');
  });
});

describe('update', () => {
  const body = { action: 'update', userId: TARGET, fullName: 'Ana', role: 'teacher' };

  test('guarda nombre, rol y auditoría en una sola llamada', async () => {
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
    expect(ctx.log.rpcs).toEqual([{
      fn: 'update_profile',
      args: { target_profile: TARGET, new_full_name: 'Ana', new_role: 'teacher', actor: ADMIN },
    }]);
  });

  test('explica el bloqueo si la cuenta tiene grupos', async () => {
    ctx.errores.rpc = { code: 'CA001' };
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/grupos/);
  });

  test('avisa si otro administrador eliminó la cuenta mientras tanto', async () => {
    ctx.errores.rpc = { code: 'CA030' };
    const r = await handleAdminUsers(body, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/Otro administrador/);
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
  test('suspender bloquea el acceso y guarda estado y motivo juntos', async () => {
    const r = await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: ' Adeudo ' }, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
    expect(ctx.auth.updateUserById).toHaveBeenCalledWith(TARGET, { ban_duration: '876000h' });
    expect(ctx.log.rpcs[0]).toEqual({
      fn: 'change_profile_status',
      args: {
        target_profile: TARGET,
        expected_status: 'active',
        new_status: 'suspended',
        actor: ADMIN,
        audit_action: 'user.suspended',
        audit_metadata: { reason: 'Adeudo' },
      },
    });
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

  test('si falla el estado o su auditoría, el acceso vuelve a lo que dice la base', async () => {
    ctx.errores.rpc = { code: '23514' };
    const r = await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: 'x' }, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: 'none' });
  });

  test('una reactivación que pierde contra una eliminación deja la cuenta bloqueada', async () => {
    ctx.perfiles[TARGET].status = 'suspended';
    ctx.antesDeRpc.fn = () => { ctx.perfiles[TARGET].status = 'deleted'; };
    ctx.errores.rpc = { code: 'CA030' };
    const r = await handleAdminUsers({ action: 'reactivate', userId: TARGET }, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
    expect(ctx.log.rpcs[0].args).toMatchObject({ expected_status: 'suspended', new_status: 'active' });
    expect(ctx.auth.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: '876000h' });
  });

  test('si otro administrador reactiva mientras se compensa, la cuenta queda desbloqueada', async () => {
    // A falla al reactivar y lee "suspended"; justo cuando A bloquea, B ya había
    // reactivado con éxito. A vuelve a leer y corrige.
    ctx.perfiles[TARGET].status = 'suspended';
    ctx.errores.rpc = { code: 'XX000' };
    ctx.auth.updateUserById.mockImplementation((_id: string, { ban_duration }: { ban_duration: string }) => {
      if (ban_duration === '876000h') ctx.perfiles[TARGET].status = 'active';
      return Promise.resolve({ error: null });
    });
    const r = await handleAdminUsers({ action: 'reactivate', userId: TARGET }, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: 'none' });
  });

  test('tras un cambio exitoso no vuelve a escribir en Auth si ya coincide', async () => {
    await handleAdminUsers({ action: 'suspend', userId: TARGET, reason: 'x' }, ADMIN, ctx.admin);
    expect(ctx.auth.updateUserById).toHaveBeenCalledTimes(1);
  });

  test('si no puede leer la cuenta tras un fallo, la deja bloqueada', async () => {
    ctx.perfiles[TARGET].status = 'suspended';
    ctx.antesDeRpc.fn = () => { ctx.errores.select = { code: 'XX000' }; };
    ctx.errores.rpc = { code: 'XX000' };
    const r = await handleAdminUsers({ action: 'reactivate', userId: TARGET }, ADMIN, ctx.admin);
    expect(r.status).toBe(500);
    expect(ctx.auth.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: '876000h' });
  });

  test('solo reactiva cuentas suspendidas', async () => {
    const r = await handleAdminUsers({ action: 'reactivate', userId: TARGET }, ADMIN, ctx.admin);
    expect(r.status).toBe(409);
  });

  test('eliminar conserva la cuenta como eliminada, sin borrado físico', async () => {
    const r = await handleAdminUsers({ action: 'delete', userId: TARGET, reason: 'Baja' }, ADMIN, ctx.admin);
    expect(r.status).toBe(200);
    expect(ctx.auth.deleteUser).not.toHaveBeenCalled();
    expect(ctx.log.rpcs[0].args).toMatchObject({
      expected_status: 'active',
      new_status: 'deleted',
      audit_metadata: { reason: 'Baja', previous_status: 'active' },
    });
  });
});
