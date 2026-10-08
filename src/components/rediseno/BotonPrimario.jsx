import Boton from './Boton';

// Wrapper retrocompatible. La API queda igual que antes; el render visual también.
// Para nuevos usos preferir <Boton variant="primario" /> directamente.
export default function BotonPrimario(props) {
  return <Boton variant="primario" {...props} />;
}
