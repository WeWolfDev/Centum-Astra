import { useEffect, useRef, useState } from 'react';
import Boton from '../../components/rediseno/Boton';
import Input from '../../components/rediseno/Input';
import {
  cancelPasswordFlow,
  requestRecoveryCode,
  savePassword,
  verifyCode,
} from '../../lib/passwordFlow';

const TEXTOS = {
  recovery: {
    titulo: 'Recuperar contraseña',
    descripcion: 'Te enviaremos un código de verificación a tu correo.',
    exito: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
  },
  invite: {
    titulo: 'Activar mi cuenta',
    descripcion: 'Escribe el código que recibiste por correo y elige tu contraseña.',
    exito: 'Cuenta activada. Inicia sesión con tu nueva contraseña.',
  },
};

// tipo: 'recovery' pide primero el código; 'invite' ya lo recibió por correo.
export default function CodigoContrasena({ tipo, onVolver }) {
  const textos = TEXTOS[tipo];
  const [paso, setPaso] = useState(tipo === 'recovery' ? 'solicitar' : 'confirmar');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  // El código ya se validó y su sesión sigue abierta hasta guardar o salir.
  const [verificado, setVerificado] = useState(false);
  const sesionAbierta = useRef(false);

  useEffect(() => () => {
    if (sesionAbierta.current) void cancelPasswordFlow();
  }, []);

  async function ejecutar(accion) {
    setError('');
    setCargando(true);
    try {
      await accion();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function solicitar(e) {
    e.preventDefault();
    void ejecutar(async () => {
      await requestRecoveryCode(email);
      setAviso('Si el correo está registrado, recibirás un código en unos minutos.');
      setPaso('confirmar');
    });
  }

  function confirmar(e) {
    e.preventDefault();
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    void ejecutar(async () => {
      if (!verificado) {
        await verifyCode({ email, code: codigo, type: tipo });
        sesionAbierta.current = true;
        setVerificado(true);
      }
      await savePassword(password);
      sesionAbierta.current = false;
      onVolver(textos.exito);
    });
  }

  function volver() {
    if (sesionAbierta.current) {
      sesionAbierta.current = false;
      void cancelPasswordFlow();
    }
    onVolver('');
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="font-display text-xl font-bold text-white mb-1.5 tracking-tight">
          {textos.titulo}
        </h2>
        <p className="text-white/70 text-sm leading-snug">{textos.descripcion}</p>
      </div>

      <form onSubmit={paso === 'solicitar' ? solicitar : confirmar} className="flex flex-col gap-3.5">
        <Input
          id="codigo-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={verificado}
          required
        />

        {paso === 'confirmar' && (
          <>
            <Input
              id="codigo-otp"
              label="Código de verificación"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              disabled={verificado}
              required
            />
            <Input
              id="codigo-password"
              label="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Input
              id="codigo-confirmacion"
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={e => setConfirmacion(e.target.value)}
              required
            />
          </>
        )}

        {aviso && <p role="status" className="text-white/80 text-xs text-center">{aviso}</p>}
        {error && (
          <p role="alert" className="text-peligro text-xs text-center rounded-lg px-3 py-2 bg-peligro/5 border border-peligro/20">
            {error}
          </p>
        )}

        <Boton variant="primario" type="submit" isLoading={cargando} className="w-full mt-1">
          {paso === 'solicitar' ? 'Enviar código' : 'Guardar contraseña'}
        </Boton>
        <Boton variant="ghost" type="button" onClick={volver} className="w-full">
          Volver a iniciar sesión
        </Boton>
      </form>
    </>
  );
}
