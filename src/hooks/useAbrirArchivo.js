import { useCallback, useState } from 'react';
import { openFile } from '../lib/materialService';

// Abre un archivo de Storage en otra pestaña (#81, #82). La pestaña se abre
// antes de pedir la URL firmada: si se abriera después del await, el navegador
// la bloquearía como ventana emergente. Si aun así la bloquea, deja el enlace
// en `enlace` para ofrecerlo con un clic en vez de salir de la aplicación.
export default function useAbrirArchivo({ onError, onAbierto } = {}) {
  const [enlace, setEnlace] = useState(null);

  async function abrir(material) {
    setEnlace(null);
    const pestana = window.open('', '_blank');
    if (pestana) pestana.opener = null;
    try {
      const url = await openFile(material.id);
      if (pestana) pestana.location.href = url;
      else setEnlace({ titulo: material.title, url });
      onAbierto?.(material);
    } catch (e) {
      pestana?.close();
      onError?.(e.message);
    }
  }

  const cerrarEnlace = useCallback(() => setEnlace(null), []);
  return { abrir, enlace, cerrarEnlace };
}
