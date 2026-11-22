// Acciones administrativas sobre cuentas (#27, #33). Sin APIs de Deno para
// poder probarla con Vitest; `admin` es un cliente con privilegios de servidor.

const ROLES = ['admin', 'teacher', 'student'];
const BAN_INDEFINIDO = '876000h';
const ROLE_CHANGE_BLOCKED = 'CA001';
const ACCOUNT_CHANGED = 'CA030';
const CUENTA_CAMBIO = 'Otro administrador cambió esta cuenta. Recarga e intenta de nuevo.';

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
  // El perfil y su auditoría se guardan juntos en create_profile (#67).
  const { error: profileError } = await admin.rpc('create_profile', {
    target_profile: userId,
    new_email: email,
    new_full_name: fullName,
    new_role: role,
    actor: callerId,
  });
  if (profileError) {
    // Sin perfil la cuenta quedaría huérfana y el correo, bloqueado.
    await admin.auth.admin.deleteUser(userId);
    throw new HttpError(500, 'No se pudo crear la cuenta.');
  }
  return { status: 201, body: { id: userId } };
}

async function actualizar(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = texto(body.userId);
  const fullName = exigirNombre(body.fullName);
  const role = exigirRol(body.role);
  const perfil = await exigirPerfil(admin, userId);
  if (perfil.status === 'deleted') throw new HttpError(409, 'La cuenta está eliminada.');
  if (perfil.role !== role) exigirOtraCuenta(userId, callerId);

  // El perfil y su auditoría se guardan juntos en update_profile (#67).
  const { error } = await admin.rpc('update_profile', {
    target_profile: userId,
    new_full_name: fullName,
    new_role: role,
    actor: callerId,
  });
  if (error) {
    if (error.code === ROLE_CHANGE_BLOCKED) {
      throw new HttpError(409, 'Retira primero sus grupos para cambiar el rol.');
    }
    if (error.code === ACCOUNT_CHANGED) throw new HttpError(409, CUENTA_CAMBIO);
    throw new HttpError(500, 'No se pudo actualizar la cuenta.');
  }
  return { status: 200, body: { id: userId } };
}

// Deja el bloqueo de Auth de acuerdo con el estado que quedó en la base. Si no
// se puede leer, bloquea: es preferible a dejar entrar una cuenta eliminada.
async function sincronizarBloqueo(admin: AdminClient, userId: string) {
  const perfil = await leerPerfil(admin, userId).catch(() => null);
  const ban = perfil?.status === 'active' ? 'none' : BAN_INDEFINIDO;
  await admin.auth.admin.updateUserById(userId, { ban_duration: ban });
}

async function cambiarEstado(
  admin: AdminClient,
  callerId: string,
  userId: string,
  estadoLeido: string,
  transicion: { status: string; ban: string; action: string },
  metadata: Record<string, unknown>,
) {
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: transicion.ban,
  });
  if (banError) throw new HttpError(502, 'No se pudo cambiar el acceso de la cuenta.');

  // El estado y su auditoría se guardan juntos, y solo si nadie cambió la cuenta
  // desde que se leyó (#67).
  const { error } = await admin.rpc('change_profile_status', {
    target_profile: userId,
    expected_status: estadoLeido,
    new_status: transicion.status,
    actor: callerId,
    audit_action: transicion.action,
    audit_metadata: metadata,
  });
  if (error) {
    await sincronizarBloqueo(admin, userId);
    if (error.code === ACCOUNT_CHANGED) throw new HttpError(409, CUENTA_CAMBIO);
    throw new HttpError(500, 'No se pudo actualizar la cuenta.');
  }
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
    perfil.status,
    { status: 'suspended', ban: BAN_INDEFINIDO, action: 'user.suspended' },
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
    perfil.status,
    { status: 'active', ban: 'none', action: 'user.reactivated' },
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
    perfil.status,
    { status: 'deleted', ban: BAN_INDEFINIDO, action: 'user.deleted' },
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
