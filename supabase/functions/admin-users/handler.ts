// Acciones administrativas sobre cuentas (#27, #33). Sin APIs de Deno para
// poder probarla con Vitest; `admin` es un cliente con privilegios de servidor.

const ROLES = ['admin', 'teacher', 'student'];
const BAN_INDEFINIDO = '876000h';
const ROLE_CHANGE_BLOCKED = 'CA001';

type Result = { status: number; body: Record<string, unknown> };
// deno-lint-ignore no-explicit-any
type AdminClient = any;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function exigirRol(role: unknown): string {
  if (typeof role !== 'string' || !ROLES.includes(role)) {
    throw new HttpError(400, 'Selecciona un rol válido.');
  }
  return role;
}

function exigirNombre(valor: unknown): string {
  const nombre = texto(valor);
  if (!nombre) throw new HttpError(400, 'Escribe el nombre completo.');
  return nombre;
}

function exigirMotivo(valor: unknown): string {
  const motivo = texto(valor);
  if (!motivo) throw new HttpError(400, 'Escribe el motivo.');
  return motivo;
}

function exigirOtraCuenta(userId: string, callerId: string) {
  if (userId === callerId) {
    throw new HttpError(400, 'No puedes aplicar esta acción a tu propia cuenta.');
  }
}

async function leerPerfil(admin: AdminClient, id: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new HttpError(500, 'No se pudo consultar la cuenta.');
  return data as { role: string; status: string } | null;
}

async function exigirPerfil(admin: AdminClient, id: string) {
  const perfil = await leerPerfil(admin, id);
  if (!perfil) throw new HttpError(404, 'La cuenta no existe.');
  return perfil;
}

async function auditar(
  admin: AdminClient,
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: 'profile',
    entity_id: entityId,
    metadata,
  });
  if (error) throw new HttpError(500, 'El cambio se aplicó, pero no se registró en auditoría.');
}

async function invitar(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const email = texto(body.email).toLowerCase();
  if (!email.includes('@')) throw new HttpError(400, 'Escribe un correo válido.');
  const fullName = exigirNombre(body.fullName);
  const role = exigirRol(body.role);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    if (error.code === 'email_exists' || error.status === 422) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
    }
    throw new HttpError(502, 'No se pudo enviar la invitación.');
  }

  const userId = data.user.id;
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: userId, email, full_name: fullName, role });
  if (profileError) {
    // Sin perfil la cuenta quedaría huérfana y el correo, bloqueado.
    await admin.auth.admin.deleteUser(userId);
    throw new HttpError(500, 'No se pudo crear la cuenta.');
  }

  await auditar(admin, callerId, 'user.invited', userId, { role });
  return { status: 201, body: { id: userId } };
}

async function actualizar(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = texto(body.userId);
  const fullName = exigirNombre(body.fullName);
  const role = exigirRol(body.role);
  const perfil = await exigirPerfil(admin, userId);
  if (perfil.status === 'deleted') throw new HttpError(409, 'La cuenta está eliminada.');
  if (perfil.role !== role) exigirOtraCuenta(userId, callerId);

  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName, role, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) {
    if (error.code === ROLE_CHANGE_BLOCKED) {
      throw new HttpError(409, 'Retira primero sus grupos para cambiar el rol.');
    }
    throw new HttpError(500, 'No se pudo actualizar la cuenta.');
  }

  await auditar(admin, callerId, 'user.updated', userId, { role, previous_role: perfil.role });
  return { status: 200, body: { id: userId } };
}

async function cambiarEstado(
  admin: AdminClient,
  callerId: string,
  userId: string,
  transicion: { status: string; ban: string; action: string; revertirBan: string },
  metadata: Record<string, unknown>,
) {
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: transicion.ban,
  });
  if (banError) throw new HttpError(502, 'No se pudo cambiar el acceso de la cuenta.');

  const { error } = await admin
    .from('profiles')
    .update({ status: transicion.status, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: transicion.revertirBan });
    throw new HttpError(500, 'No se pudo actualizar la cuenta.');
  }

  await auditar(admin, callerId, transicion.action, userId, metadata);
  return { status: 200, body: { id: userId } };
}

async function suspender(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = texto(body.userId);
  exigirOtraCuenta(userId, callerId);
  const reason = exigirMotivo(body.reason);
  const perfil = await exigirPerfil(admin, userId);
  if (perfil.status !== 'active') throw new HttpError(409, 'Solo se suspenden cuentas activas.');
  return cambiarEstado(
    admin,
    callerId,
    userId,
    { status: 'suspended', ban: BAN_INDEFINIDO, action: 'user.suspended', revertirBan: 'none' },
    { reason },
  );
}

async function reactivar(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = texto(body.userId);
  const perfil = await exigirPerfil(admin, userId);
  if (perfil.status !== 'suspended') {
    throw new HttpError(409, 'Solo se reactivan cuentas suspendidas.');
  }
  return cambiarEstado(
    admin,
    callerId,
    userId,
    { status: 'active', ban: 'none', action: 'user.reactivated', revertirBan: BAN_INDEFINIDO },
    {},
  );
}

async function eliminar(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = texto(body.userId);
  exigirOtraCuenta(userId, callerId);
  const reason = exigirMotivo(body.reason);
  const perfil = await exigirPerfil(admin, userId);
  if (perfil.status === 'deleted') throw new HttpError(409, 'La cuenta ya está eliminada.');
  return cambiarEstado(
    admin,
    callerId,
    userId,
    {
      status: 'deleted',
      ban: BAN_INDEFINIDO,
      action: 'user.deleted',
      revertirBan: perfil.status === 'suspended' ? BAN_INDEFINIDO : 'none',
    },
    { reason, previous_status: perfil.status },
  );
}

const ACCIONES: Record<
  string,
  (admin: AdminClient, callerId: string, body: Record<string, unknown>) => Promise<Result>
> = {
  invite: invitar,
  update: actualizar,
  suspend: suspender,
  reactivate: reactivar,
  delete: eliminar,
};

export async function handleAdminUsers(
  body: Record<string, unknown> | null,
  callerId: string,
  admin: AdminClient,
): Promise<Result> {
  try {
    const caller = await leerPerfil(admin, callerId);
    if (caller?.role !== 'admin' || caller.status !== 'active') {
      throw new HttpError(403, 'No tienes permiso para administrar cuentas.');
    }
    const accion = typeof body?.action === 'string' ? ACCIONES[body.action] : undefined;
    if (!body || !accion) throw new HttpError(400, 'Acción no válida.');
    return await accion(admin, callerId, body);
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: { error: error.message } };
    }
    console.error('admin-users', error);
    return { status: 500, body: { error: 'Ocurrió un error inesperado.' } };
  }
}
