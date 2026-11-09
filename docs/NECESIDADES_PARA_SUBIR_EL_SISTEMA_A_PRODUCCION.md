# Necesidades para subir el sistema a producción

**Sistema:** Centum Astra — plataforma de preparación EXANI-II para carreras de salud  
**Objetivo:** convertir el prototipo frontend actual en un producto operativo que gestione cuentas, pagos, materiales y resultados reales.  
**Estado actual:** el frontend usa usuarios y datos de demostración, y conserva algunos cambios solo en memoria del navegador. No se debe tratar el despliegue del frontend actual como lanzamiento de un servicio de producción.
**Plataforma de datos propuesta:** Supabase para PostgreSQL, Auth y Storage, sujeto a validar plan, región, costos, cuotas, copias de seguridad y requisitos de privacidad antes de producción. Los pagos siguen fuera del alcance mientras no se definan con el cliente.

## 1. Criterio de salida

El sistema estará listo para un lanzamiento real cuando:

- Las operaciones importantes se completen y confirmen en servicios backend; ningún mensaje visual debe afirmar que una cuenta, pago, publicación o resultado quedó guardado si el servicio no lo confirmó.
- La autorización se aplique en el servidor para cada recurso y operación, no solo ocultando botones en la interfaz.
- Los datos de producción estén aislados de desarrollo y pruebas, con respaldos cuya restauración haya sido probada.
- Los flujos de alta, pago, acceso, estudio, examen, resultado y soporte hayan sido validados de extremo a extremo en un ambiente de staging.
- El equipo pueda detectar fallas, responder a incidentes y volver a una versión estable.

## 2. Definiciones de negocio pendientes

Resolver y documentar antes de cerrar el diseño de datos y los flujos:

- [ ] Alcance del primer lanzamiento: cursos, módulos, áreas, roles, funciones incluidas y funciones que quedarán deshabilitadas.
- [ ] Catálogo de planes: precio, moneda, duración, vigencia, renovaciones, vencimiento y reglas de acceso.
- [ ] Flujo de compra: pago inmediato o revisión manual; pagos aceptados; cancelaciones, reembolsos, pagos duplicados y aclaraciones.
- [ ] Roles definitivos y matriz de permisos para administrador, profesor y alumno.
- [ ] Modelo de grupos y asignación de alumnos a profesores; confirmar si se requiere visibilidad por alumno, grupo o curso.
- [ ] Qué significa “progreso”, cómo se marca una clase como vista y qué métricas se muestran a cada rol.
- [ ] Reglas de aplicación de exámenes: límite de tiempo, intentos, reanudación, aleatoriedad, revisión y cuándo se publican resultados.
- [ ] Sistema de puntos: obtener la aprobación formal de la fórmula propuesta `700 + (aciertos / total de preguntas) × 600` para cuestionarios grandes y simuladores, usando el total de cada evaluación y no un total fijo de 138; definir qué preguntas cuentan y presentar el resultado como puntaje estimado, no oficial de CENEVAL.
- [ ] Política de conservación y eliminación de cuentas, pagos, archivos, intentos y datos de auditoría.
- [ ] Países de operación, requisitos legales/tributarios y tratamiento de datos de menores, si aplica.
- [ ] Afirmaciones de marketing, testimonios, resultados y cifras que pueden publicarse con evidencia y autorización.

## 3. Backend, API y base de datos — bloqueante

- [ ] Crear proyectos Supabase separados para desarrollo, staging y producción; validar región, plan, cuotas, costo, acceso del equipo y requisitos de residencia de datos.
- [ ] Usar PostgreSQL de Supabase como fuente de verdad y gestionar el esquema mediante migraciones versionadas en el repositorio.
- [ ] Definir qué operaciones usarán las APIs de datos de Supabase y cuáles requerirán Edge Functions o funciones SQL; las reglas sensibles no deben depender solo del código frontend.
- [ ] Definir contratos, validación de entrada, formato de errores, paginación y versionado para las funciones/API que exponga la aplicación.
- [ ] Como mínimo, modelar:
  - Usuarios, credenciales/identidades, roles y estado de cuenta.
  - Planes, pagos, transacciones y periodo de acceso.
  - Profesores, alumnos, grupos y asignaciones.
  - Cursos, módulos, sesiones, recursos y reglas de visibilidad.
  - Evaluaciones, preguntas, opciones, intentos, respuestas y resultados.
  - Eventos de auditoría para cambios administrativos y operaciones sensibles.
- [ ] Definir claves, restricciones, relaciones, marcas de tiempo, zonas horarias, eliminación lógica y política de retención mediante migraciones.
- [ ] Habilitar Row Level Security (RLS) en todas las tablas accesibles mediante APIs y configurar grants mínimos; una política por sí sola no reemplaza los permisos SQL.
- [ ] Escribir y probar políticas por rol y recurso: alumno, profesor asignado, administrador y usuario anónimo; denegar por defecto lo que no esté expresamente permitido.
- [ ] Añadir validación de permisos por operación y propiedad del recurso: un alumno solo puede consultar su información; un profesor solo sus grupos; administración según permisos autorizados.
- [ ] Evitar confiar en identificadores, puntajes, precios, estados de pago o roles enviados por el cliente; validar reglas de negocio en servidor.
- [ ] Implementar transacciones/idempotencia para evitar cuentas, cargos, intentos o resultados duplicados cuando se repitan solicitudes.
- [ ] Separar proyectos, datos, Auth, Storage y credenciales de desarrollo, staging y producción.
- [ ] No exponer la clave `service_role` en el navegador, Git o variables `VITE_*`: omite RLS. Reservarla exclusivamente para procesos confiables de servidor y solo cuando sea necesaria.

## 4. Cuentas, autenticación y autorización — bloqueante

- [ ] Sustituir `mockUsers` y el login local por Supabase Auth (sujeto a validar el flujo de alta/invitación, recuperación, correo y configuración del dominio).
- [ ] Vincular la identidad estable de `auth.users` con un perfil de aplicación mediante UUID; mantener roles, grupos y permisos educativos en tablas propias protegidas.
- [ ] Definir alta/activación, inicio y cierre de sesión, recuperación y cambio de contraseña, bloqueo y baja de cuenta.
- [ ] Delegar autenticación a Supabase Auth o a un proveedor aprobado; nunca guardar contraseñas en texto plano ni duplicar credenciales sin una necesidad justificada.
- [ ] Proteger sesiones con cookies `HttpOnly`, `Secure` y `SameSite` cuando la arquitectura lo permita; definir expiración, renovación e invalidación.
- [ ] Aplicar roles y permisos en backend y probar intentos de acceso cruzado entre alumnos, profesores y administradores.
- [ ] Definir reglas de verificación de correo, límites ante intentos de acceso y protección contra abuso.
- [ ] Eliminar accesos rápidos y credenciales de demostración del build de producción.

## 5. Pagos y acceso al producto — bloqueante si se cobrará en línea

- [ ] Seleccionar e integrar un proveedor de pagos adecuado para el país, moneda y modelo comercial.
- [ ] Crear órdenes y precios en backend; el navegador no debe decidir el importe ni marcar un pago como aprobado.
- [ ] Confirmar pagos mediante notificaciones firmadas del proveedor (webhooks), verificando autenticidad, repetición e idempotencia.
- [ ] Diseñar estados claros, por ejemplo: pendiente, aprobado, fallido, cancelado y reembolsado, junto con su historial.
- [ ] Activar o revocar el acceso según el estado confirmado del pago y las reglas del plan.
- [ ] Definir conciliación, reintentos, notificaciones al usuario, comprobantes, reembolsos y soporte para discrepancias.
- [ ] No almacenar números completos de tarjeta ni códigos de seguridad en Centum Astra.
- [ ] Probar pagos aprobados, rechazados, abandonados, duplicados, reembolsados y notificaciones recibidas fuera de orden en sandbox/staging.

## 6. Materiales, archivos y videoteca — bloqueante para publicar contenido real

- [ ] Usar Supabase Storage u otro proveedor aprobado para guardar PDFs, imágenes de reactivos y adjuntos en buckets privados; la decisión debe considerar cuota, región, costo y salida de datos.
- [ ] Subir archivos mediante el backend o URLs firmadas de corta duración, autorizadas para el usuario y recurso correspondientes.
- [ ] Configurar y probar políticas RLS de `storage.objects` para carga, lectura, reemplazo y eliminación por rol; no habilitar buckets públicos para materiales restringidos.
- [ ] Validar en servidor tamaño, extensión y tipo real del archivo; aplicar el límite acordado de 50 MB por archivo. Definir por separado las cuotas totales por curso/proyecto y los formatos permitidos; los videos se manejan como enlaces de Drive.
- [ ] Definir análisis antimalware y procedimiento para archivos no válidos o sospechosos antes de publicarlos.
- [ ] Evitar buckets públicos y URLs permanentes; registrar quién publica, edita, elimina o descarga material cuando corresponda.
- [ ] Guardar metadatos y relaciones de materiales en base de datos; permitir edición, reemplazo, borrado y recuperación conforme a política.
- [ ] Definir acceso, proveedor y experiencia de reproducción de video; medir progreso solo si se necesita y se informa al usuario.
- [ ] Implementar visibilidad de clases y recursos por curso/grupo/alumno en servidor.
- [ ] Mostrar estados de carga, éxito y error basados en respuestas reales; actualmente varios modales solo guardan metadatos localmente.
- [ ] Definir respaldos y recuperación de objetos por separado de PostgreSQL: las copias de la base no sustituyen las copias de archivos almacenados en Storage.

## 7. Evaluaciones y resultados — bloqueante para publicar exámenes reales

- [ ] Persistir banco de preguntas, opciones, respuesta correcta, explicación, imágenes, versión y autoría.
- [ ] Restringir las respuestas correctas a personal autorizado; no enviarlas al cliente antes de que corresponda.
- [ ] Persistir cada intento y su estado, inicio, vencimiento, entrega, respuestas y resultado.
- [ ] Aplicar en backend las reglas de tiempo, intentos, entrega y cálculo de puntaje; el contador del navegador no es autoridad.
- [ ] Hacer que la entrega sea idempotente y recuperar con seguridad frente a desconexión o repetición de solicitudes.
- [ ] Definir cuándo se revela retroalimentación y resultados, y cómo se corrigen o anulan intentos.
- [ ] Vincular resultados reales con alumno, grupo, curso y versión del examen para que el historial y las estadísticas sean reproducibles.
- [ ] Completar y probar el flujo del alumno: hoy el CTA de inicio está deshabilitado y la pantalla `ExamSimulator.jsx` no es el flujo conectado a los roles actuales.
- [ ] Mostrar claramente el alcance del puntaje y no afirmar equivalencia oficial con CENEVAL sin metodología validada.

## 8. Frontend y experiencia de usuario

- [ ] Conectar la interfaz a la API con estados de carga, error, vacío, confirmación y reintento adecuados.
- [ ] Revisar la navegación por rol: Estadísticas no tiene acceso visible; Videoteca solo está en el menú del alumno; Pagos es una pantalla pendiente.
- [ ] Completar los flujos de administración de alumnos y pagos; los botones actuales “Ver” y “Aprobar” no persisten cambios.
- [ ] Completar publicación y reproducción de materiales; actualmente las selecciones de archivo no envían el archivo.
- [ ] Reemplazar o etiquetar datos mock, puntajes/historial sintéticos, testimonios y métricas promocionales antes de mostrar información real.
- [ ] Definir URLs/rutas compartibles si se necesitan enlaces directos a cursos, sesiones o evaluaciones; configurar fallback SPA en el hosting si se agregan.
- [ ] Probar responsive desde el ancho móvil mínimo acordado y en los navegadores soportados.
- [ ] Revisar accesibilidad: teclado, foco, nombres accesibles, etiquetas, mensajes de error, contraste, lectores de pantalla y movimiento reducido.
- [ ] Localizar textos y formatos para español de México, fechas, moneda y puntajes.

## 9. Seguridad, privacidad y cumplimiento

- [ ] Habilitar HTTPS en todos los ambientes públicos y redirección desde HTTP.
- [ ] Mantener secretos en un gestor de secretos o configuración privada del servidor. Las variables `VITE_*` forman parte del bundle público y no pueden contener claves privadas.
- [ ] Configurar CORS para los orígenes explícitamente autorizados; no habilitar comodines con credenciales.
- [ ] Configurar CSP, protección contra framing, `X-Content-Type-Options`, `Referrer-Policy` y HSTS una vez que HTTPS sea permanente.
- [ ] Definir límites de solicitudes, protección ante abuso y alertas sobre patrones anómalos.
- [ ] Revisar dependencias, permisos, almacenamiento, endpoints, validación de entradas y exposición de datos antes del lanzamiento.
- [ ] Preparar aviso de privacidad, consentimiento, términos, condiciones de compra y contacto para solicitudes de privacidad.
- [ ] Determinar obligaciones aplicables de protección de datos y consumo según jurisdicción, incluyendo el tratamiento de datos de menores si aplica; obtener revisión legal competente.
- [ ] Minimizar datos recopilados y limitar su acceso y retención.
- [ ] No incluir contraseñas, tokens, datos de pago ni información personal innecesaria en logs, analítica o reportes de errores.
- [ ] Definir gestión de incidentes: responsables, canal de contacto, contención, investigación y comunicación.

## 10. Infraestructura y despliegues

- [ ] Elegir hosting para frontend estático/CDN y confirmar Supabase como plataforma de PostgreSQL/Auth/Storage/funciones; validar los límites y características del plan de producción.
- [ ] Configurar dominio, DNS, certificados TLS y proyectos/ambientes separados de Supabase para desarrollo, staging y producción.
- [ ] Definir variables por ambiente y validarlas al iniciar/build sin registrar su contenido.
- [ ] Alinear Node.js entre `.nvmrc`, `engines` de `package.json` y CI.
- [ ] Añadir workflow de despliegue: el repositorio actual tiene validación de PR (`lint`, pruebas y build), pero no se encontró pipeline de publicación.
- [ ] Desplegar a staging después de validar PR; promover a producción con aprobación y artefacto ya probado.
- [ ] Ejecutar migraciones de base de datos de forma controlada, compatible con rollback y con respaldo previo para cambios de riesgo.
- [ ] Aplicar migraciones de Supabase primero en local/staging, revisar el diff y probar la aplicación y las políticas RLS antes de producción.
- [ ] Definir estrategia de rollback de aplicación, API y migraciones; no depender de revertir datos destructivamente.
- [ ] Configurar caché larga para assets con hash y revalidación/no-cache para `index.html`.
- [ ] Configurar `base` de Vite y verificar assets en el dominio o subruta real.
- [ ] Añadir endpoint de salud/readiness para servicios backend y comprobaciones de disponibilidad externas.
- [ ] Dimensionar límites de recursos, conexiones, almacenamiento y egreso de red según el uso esperado.

## 11. Respaldo, observabilidad y soporte

- [ ] Definir objetivos de recuperación (RPO/RTO), frecuencia de respaldo y retención para PostgreSQL y archivos de Storage.
- [ ] Cifrar respaldos y probar restauración en un ambiente aislado antes del lanzamiento y periódicamente después.
- [ ] Revisar el plan Supabase elegido para confirmar frecuencia/retención de backups y opciones de recuperación (incluido PITR si se necesita); no depender de una función sin confirmar su disponibilidad y costo.
- [ ] Programar/exportar respaldos externos cuando los objetivos de recuperación lo requieran y probar la restauración de la base y de los objetos de Storage por separado.
- [ ] Registrar errores del frontend/backend y eventos críticos con identificadores de correlación, sin incluir secretos ni datos personales innecesarios.
- [ ] Monitorear disponibilidad, latencia, errores de API, fallas de pago/webhook, carga de archivos y errores de examen.
- [ ] Configurar alertas con responsables y umbrales acordados; probar que llegan y que existe un procedimiento de atención.
- [ ] Definir soporte para usuarios: canales, horarios, gestión de accesos bloqueados, pagos no conciliados y reportes de contenido.
- [ ] Preparar panel operativo para cuentas, pagos, materiales y evaluaciones con historial de cambios y permisos restringidos.

## 12. Pruebas y autorización de lanzamiento

- [ ] CI debe ejecutar instalación reproducible (`npm ci`), lint, pruebas y build.
- [ ] Añadir pruebas de políticas RLS/grants por rol, Edge Functions, integración de base de datos y Storage; pagos sandbox/webhooks solo cuando se apruebe ese alcance.
- [ ] Añadir pruebas de carga para el volumen concurrente esperado, especialmente inicio de examen, entrega, resultados y descarga de recursos.
- [ ] Ejecutar pruebas de extremo a extremo en staging: registro, acceso, pago, asignación de curso/grupo, publicación, estudio, examen, resultado, cierre de sesión y recuperación.
- [ ] Probar errores y recuperación: servicio no disponible, solicitudes repetidas, pérdida de conexión, archivo inválido, webhook duplicado y restauración de respaldo.
- [ ] Ejecutar revisión de seguridad, privacidad, accesibilidad y responsive; resolver hallazgos bloqueantes.
- [ ] Hacer una prueba piloto con usuarios y soporte antes de abrir el registro general.
- [ ] Confirmar que existen responsables de producto, operación, seguridad, soporte y aprobación de despliegue.

## 13. Orden recomendado

### P0 — No lanzar con cuentas o transacciones reales sin esto

1. Alcance, reglas de negocio, planes, privacidad y matriz de permisos definidos.
2. Backend, API, base de datos, autenticación y autorización reales.
3. Pagos confirmados por servidor, si habrá cobro en línea.
4. Persistencia y control de acceso para recursos y resultados.
5. HTTPS, gestión de secretos, respaldos restaurables, monitoreo y rollback.
6. Pruebas de extremo a extremo de los flujos de producción en staging.

### P1 — Necesario antes de abrir las funciones correspondientes

- Videoteca y subida segura de archivos si se publicarán videos/documentos.
- Estadísticas con datos reales y filtrado correcto por rol/grupo.
- Notificaciones por correo y herramientas de soporte, si forman parte del compromiso del producto.
- Rutas compartibles, exportación de reportes y mejoras operativas adicionales según el alcance acordado.

### P2 — Mejoras que pueden planificarse después del lanzamiento inicial

- SSO institucional, caché avanzada, analítica ampliada y optimizaciones que las mediciones justifiquen.
- Integraciones opcionales de comunicación o streaming, siempre que los flujos críticos ya tengan soporte y monitoreo adecuados.

## 14. Decisión de lanzamiento

- **Demo pública:** puede publicarse el frontend como prototipo si se etiqueta claramente como demostración, no se recopilan datos personales reales, no se reciben pagos y se explica que los cambios no persisten.
- **Producto real:** no abrir cuentas, pagos, publicaciones ni evaluaciones reales hasta completar los bloqueantes P0, probar su operación en staging y aprobar formalmente el go/no-go.
