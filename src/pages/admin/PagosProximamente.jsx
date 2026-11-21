import { CreditCard } from 'lucide-react';
import EstadoVacio from '../../components/rediseno/EstadoVacio';

// Pagos del administrador mientras llega #53 (envío y aprobación de comprobantes).
export default function PagosProximamente() {
  return (
    <div className="bg-fondo-app p-[clamp(20px,4vw,40px)]">
      <EstadoVacio
        icono={<CreditCard size={24} strokeWidth={1.7} />}
        titulo="Pagos estará disponible pronto"
        descripcion="Aquí revisarás los comprobantes que suban los alumnos para aprobarlos o rechazarlos. La plataforma no cobra en línea."
      />
    </div>
  );
}
