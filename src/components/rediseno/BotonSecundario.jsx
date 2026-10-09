import Boton from './Boton';

// Wrapper retrocompatible. La API queda igual que antes; el render visual también.
// Para nuevos usos preferir <Boton variant="secundario" /> directamente.
// El prop `style` sigue siendo forwardeado (lo usan ExamSimulator, Material, StudentDashboard).
export default function BotonSecundario(props) {
  return <Boton variant="secundario" {...props} />;
}
