# Decisiones arquitectónicas

**Sistema:** Centum Astra — plataforma educativa de preparación EXANI-II para carreras de salud  
**Estado:** propuesta acordada para la plataforma de datos; validar configuración y costos antes de producción  
**Alcance:** cuentas, cursos, grupos, materiales, videoteca basada en enlaces y resultados de evaluaciones.  
**Fuera de alcance por ahora:** pagos. El flujo de cobro y sus requisitos todavía no han sido validados con el cliente.

Este documento registra decisiones recomendadas, el problema que resuelven, sus razones y sus consecuencias. Supabase será la plataforma propuesta para PostgreSQL y se evaluará usar también Supabase Auth y Storage. La configuración concreta debe validarse con el cliente según presupuesto, región, capacidades del equipo y requisitos legales.

## 1. Contexto y objetivos

El frontend actual con React y Vite es un prototipo: autenticación y datos usan mocks o estado en memoria, y algunas operaciones de carga solo guardan metadatos localmente. El objetivo es llevarlo a un producto que gestione cuentas, materiales y resultados persistentes.

Principios para la primera versión:

1. Priorizar integridad, autorización y recuperación de datos por encima de una arquitectura distribuida sofisticada.
2. Mantener bajo el costo operativo mientras el volumen y el equipo sean pequeños.
3. Tratar el backend como fuente de verdad; el frontend no decide permisos, resultados oficiales ni estados persistentes.
4. Separar responsabilidades mediante módulos y contratos claros, conservando la opción de separar servicios si la escala lo exige.
5. No incluir funciones comerciales sin requisitos aprobados. En particular, pagos permanecen fuera de esta propuesta.

## 2. Vista de arquitectura propuesta

```text
Navegador
  │
  ├── HTTPS ── CDN / hosting estático
  │               └── React + Vite
  │
  └── HTTPS ── Supabase
                  ├── Auth
                  ├── APIs de datos + PostgreSQL/RLS
                  ├── Storage privado (documentos/imágenes)
                  └── Edge Functions / funciones SQL
                        ├── Operaciones de dominio sensibles
                        └── Google Drive (destino externo de videos)
```

El frontend se despliega como sitio estático y consume Supabase por HTTPS. Supabase proporciona PostgreSQL, autenticación, almacenamiento y APIs gestionadas. Las políticas RLS son obligatorias para proteger tablas y objetos; las operaciones críticas de dominio se ejecutan en funciones de servidor y/o procedimientos controlados, no confiando en el cliente. Los videos se alojan fuera de Centum Astra y la plataforma almacena sus referencias y permisos.

## 3. Decisiones

### DA-01 · Conservar React + Vite y servir el frontend como sitio estático

**Decisión:** mantener el stack existente y publicar el resultado de Vite detrás de un CDN/hosting estático. El frontend consume la API por HTTPS.

**Por qué:**

- Se reutiliza el trabajo del prototipo y se evita una reescritura que no aporta valor al producto.
- El CDN entrega archivos estáticos eficientemente y reduce trabajo del servidor de aplicación.
- Permite publicar cambios de interfaz sin desplegar necesariamente la API.

**Consecuencias y trabajo necesario:**

- Incorporar una capa de cliente API que gestione errores, estados de carga y expiración de sesión de forma consistente.
- Configurar rutas del lado del cliente si se requieren URLs directas, junto con fallback a `index.html` en el hosting.
- Configurar `base` de Vite conforme al dominio o subruta final.
- Considerar pública cualquier variable `VITE_*`; los secretos no se incluyen en el bundle.
- El hosting estático no protege por sí mismo datos ni operaciones: el backend debe autorizar cada solicitud.

### DA-02 · Usar Supabase como backend administrado y reservar lógica sensible para servidor

**Decisión:** usar las APIs gestionadas de Supabase para operaciones de datos CRUD que estén bien protegidas mediante RLS. Implementar reglas de negocio privilegiadas (por ejemplo, iniciar/entregar/calificar intentos) en Supabase Edge Functions y/o funciones SQL con permisos cuidadosamente definidos. No desplegar una API Fastify/NestJS independiente en la primera fase salvo que aparezcan requisitos que Supabase no cubra bien.

Organizar migraciones, políticas y funciones por dominios con límites explícitos:

- Identidad y autorización.
- Usuarios, perfiles y asignaciones.
- Cursos, grupos, módulos y sesiones.
- Materiales y enlaces de videoteca.
- Banco de evaluaciones, intentos y resultados.
- Estadísticas y auditoría.

**Por qué:**

- Supabase reúne PostgreSQL, Auth y Storage en una plataforma administrada y reduce la cantidad de infraestructura propia que debe operar el equipo.
- Las APIs generadas pueden servir los casos CRUD habituales; las reglas sensibles pueden permanecer en servidor y usar transacciones de PostgreSQL.
- La separación por dominio mantiene el código y las políticas entendibles, con posibilidad de añadir una API propia cuando exista una necesidad real.

**Consecuencias y límites:**

- Se requiere disciplina estricta de RLS y grants: habilitar RLS en tablas expuestas no basta por sí solo; se deben conceder únicamente las operaciones necesarias y probar políticas como usuario anónimo, alumno, profesor y administrador.
- La clave `service_role` omite RLS y debe permanecer exclusivamente en servidor; nunca debe exponerse en el bundle frontend.
- Las Edge Functions no sustituyen las validaciones ni las restricciones de integridad de PostgreSQL.
- Si más adelante hay reglas complejas, integraciones que requieran procesos largos o necesidades de despliegue independientes, evaluar una API modular propia.
- No introducir Kubernetes, malla de servicios ni eventos distribuidos hasta que la escala o las necesidades operativas lo justifiquen.

### DA-03 · Usar Supabase PostgreSQL como fuente de verdad

**Decisión:** almacenar en PostgreSQL de Supabase los datos relacionales y transaccionales del producto; administrar el esquema mediante migraciones versionadas en el repositorio.

Entidades iniciales esperadas:

- Usuarios, roles, perfiles y estado de cuenta.
- Cursos, grupos, asignaciones, módulos y sesiones.
- Metadatos y permisos de documentos y videos.
- Evaluaciones y versiones de preguntas.
- Intentos, respuestas, resultados y progreso.
- Auditoría de operaciones administrativas relevantes.

**Por qué:**

- Las relaciones entre alumnos, grupos, docentes, cursos, evaluaciones e intentos son fundamentales para autorización e informes.
- Las claves foráneas, restricciones y transacciones ayudan a evitar estados inconsistentes.
- Las consultas SQL permiten crear informes segmentados sin duplicar prematuramente los datos en otro sistema.
- Supabase administra la infraestructura de PostgreSQL, reduciendo el trabajo operativo del motor.

**Consecuencias y límites:**

- Se deben mantener migraciones versionadas y compatibles con el proceso de despliegue.
- Desarrollar y probar las migraciones localmente/contra staging antes de aplicarlas a producción.
- Evaluar costo, región, límites de conexión/compute y respaldo del plan seleccionado antes de comprometer el lanzamiento.
- Definir índices a partir de consultas medidas; no optimizar por anticipado.
- No añadir Redis al inicio. Incorporarlo solo cuando mediciones identifiquen una necesidad de caché, coordinación o rate limiting que la plataforma elegida no cubra.

### DA-04 · Usar Supabase Auth y separar autenticación de autorización del dominio

**Decisión:** usar Supabase Auth como primera opción para autenticación (registro/invitación según el flujo aprobado, inicio de sesión y recuperación). Mantener en tablas propias los perfiles y permisos de negocio: roles educativos, pertenencia a grupos y cursos asignados.

**Por qué:**

- La autenticación incluye tareas sensibles y permanentes (credenciales, recuperación y sesiones). Delegarlas a un servicio probado reduce el código de seguridad propio.
- Los permisos educativos cambian con las relaciones del producto (por ejemplo, qué profesor atiende qué grupo), por lo que deben seguir bajo control de la API y su base de datos.
- OIDC proporciona un estándar de integración y reduce dependencia de una interfaz propietaria.

**Consecuencias y trabajo necesario:**

- Relacionar los perfiles de la aplicación con el UUID de `auth.users`; no usar correo como clave primaria.
- Definir el mecanismo de sesión del cliente y evaluar un patrón BFF/cookie segura si los requisitos lo requieren. No guardar claves privilegiadas ni tokens de larga duración en almacenamiento accesible a JavaScript.
- Proteger cada tabla y operación expuesta con RLS y grants mínimos; probar explícitamente acceso de alumno, profesor, administrador y usuario sin sesión.
- Los roles y relaciones del dominio no se deben aceptar como datos confiables desde el navegador ni derivar de metadatos editables por el usuario.
- Usar Edge Functions o contexto servidor para operaciones privilegiadas; verificar el JWT y la autorización en cada solicitud.
- Confirmar costo, región, configuración de correo y límites del plan de Supabase Auth antes del lanzamiento.
- SSO institucional puede quedar para una fase posterior si no es requisito inicial.

### DA-05 · Mantener pagos fuera del diseño actual

**Decisión:** no diseñar tablas de transacciones, integración de gateway ni activación de acceso por compra hasta que el cliente confirme reglas y alcance.

**Por qué:**

- Aún no se revisaron por completo el modelo comercial y los requisitos con el cliente.
- Elegir un proveedor o asumir reglas de precio, reembolso y vigencia ahora produciría decisiones de negocio no aprobadas.
- El dominio de cursos y autorización debe poder evolucionar sin depender de un flujo de compra todavía indefinido.

**Consecuencias:**

- No mostrar estados de pago como si fueran reales ni habilitar cobros reales con los mocks actuales.
- El acceso puede modelarse con una política administrativa explícita y temporal, pero no simular confirmación de pago.
- Cuando se apruebe el alcance, registrar una decisión nueva que detalle proveedor, webhooks, conciliación, reembolsos, estados y requisitos legales. No almacenar datos de tarjeta en la plataforma.

### DA-06 · Videoteca como catálogo de enlaces externos a Google Drive

**Decisión:** Centum Astra no almacenará ni transmitirá los archivos de video en la primera versión. Guardará metadatos y enlaces de Drive; al seleccionar un video, la plataforma valida el acceso y redirige al destino.

**Metadatos sugeridos:**

- Título, descripción opcional, materia, curso, módulo/sesión.
- URL de Drive o identificador del archivo.
- Autor y fecha de publicación.
- Estado de publicación y reglas de acceso en la plataforma.

**Por qué:**

- El requerimiento actual es redireccionar a Drive; no es necesario construir ingesta, transcodificación, reproductor y entrega de video propios.
- Se reduce el costo de almacenamiento, transferencia y operación.
- El equipo puede administrar los videos con las herramientas que ya usa el cliente.

**Límites y consecuencias de seguridad:**

- La validación de Centum Astra protege el acceso iniciado desde la plataforma, pero no controla la política final del recurso una vez que el usuario llega a Drive.
- Un enlace configurado como “cualquier persona con el enlace” puede reenviarse; no equivale a acceso privado por usuario.
- Cuando se requiera acceso restringido, configurar Drive para usuarios o grupos permitidos y gestionar permisos fuera de la plataforma; comprobar que la experiencia de acceso sea viable para todos los alumnos.
- Usar una cuenta de organización administrada por el cliente, no una cuenta personal de un empleado. Definir propiedad, transferencia, retención y recuperación de los archivos.
- Los enlaces externos pueden romperse o cambiar permisos. Incluir validación administrativa, mensajes de recurso no disponible y revisión periódica de enlaces.
- No prometer analítica exacta de reproducción ni progreso individual si Drive no proporciona ese dato integrado al producto.
- Antes de operar comercialmente, confirmar que el plan, las cuotas y los términos de Drive sean adecuados para el volumen y uso previsto. Drive es práctico para piloto o distribución limitada, no se debe asumir como CDN de video con capacidad garantizada.

**Alternativas para evaluar si Drive deja de ser adecuado:**

- YouTube no listado para videos de muestra o contenido que pueda circular mediante enlace. Es fácil de distribuir y escala bien, pero cualquiera con el enlace puede reenviarlo y no es adecuado para contenido que requiera control de acceso. Confirmar condiciones, publicidad y experiencia de reproducción antes de adoptarlo.
- Servicio de streaming administrado de pago si se necesita reproductor integrado, adaptación de calidad, controles de acceso, analítica y operación más predecible. No añadirlo hasta que esos requisitos estén confirmados.

No se recomienda depender de un servicio “gratuito” como garantía de streaming privado e ilimitado: los planes gratuitos suelen tener cuotas, controles limitados o condiciones que pueden no ser adecuadas para contenido restringido. Verificar términos y límites vigentes directamente con cada proveedor antes de elegir.

### DA-07 · Usar Supabase Storage para documentos e imágenes privados

**Decisión:** evaluar Supabase Storage para PDFs, imágenes de reactivos y materiales que Centum Astra sí recibe, con buckets privados y políticas RLS en `storage.objects`. PostgreSQL conserva metadatos, relaciones y autorización, no el contenido binario.

**Por qué:**

- El almacenamiento de objetos está diseñado para archivos y permite escalar sin cargar la base de datos.
- Separar archivos de metadatos facilita backups, cuotas y políticas de ciclo de vida.
- Un bucket privado evita publicar contenido accidentalmente por defecto.

**Flujo recomendado:**

1. El usuario solicita una carga; la API verifica rol, curso y permisos.
2. La API autoriza una carga limitada (directa mediante URL firmada de corta duración o pasando por backend, según el proveedor).
3. Se valida tamaño, extensión y tipo real, y se ejecuta el análisis definido por el riesgo.
4. La API registra el metadato y deja el material disponible solo después de confirmar la carga.
5. Para descargar, la API vuelve a autorizar y genera acceso temporal.

**Consecuencias:**

- Confirmar cuotas, región, costo de almacenamiento/egreso, límites de carga y estrategia de recuperación del plan seleccionado.
- Las políticas de Storage se deben probar para cada rol y operación (subir, listar, descargar, reemplazar y eliminar).
- No usar buckets públicos para materiales restringidos. Las URLs firmadas deben tener duración limitada y emitirse solo después de verificar autorización.
- Los backups de la base de datos no equivalen a respaldos de los objetos almacenados; definir recuperación/exportación de archivos por separado.
- Aplicar validación de tipo/tamaño y análisis antimalware antes de publicar. RLS controla acceso, pero no inspecciona el contenido del archivo.

### DA-08 · Hacer del servidor la autoridad de evaluaciones y resultados

**Decisión:** persistir las evaluaciones, sus versiones, intentos, respuestas y resultados. El backend decide cuándo inicia y vence un intento, valida su entrega y calcula el resultado según reglas documentadas.

**Por qué:**

- El reloj del navegador se puede pausar, alterar o perder al cerrar la página.
- Enviar la clave correcta antes de tiempo facilita su exposición.
- Persistir el intento permite reanudación controlada, historial entre dispositivos y métricas reproducibles.
- Versionar la evaluación permite explicar con qué preguntas y reglas se calculó un resultado.

**Consecuencias y decisiones que debe cerrar el producto:**

- Definir límite de tiempo, número de intentos, reanudación, aleatoriedad, revisión y revelación de respuestas.
- Guardar inicio, vencimiento, entrega, duración, versión de examen y resultados relevantes.
- Hacer la entrega idempotente para que un reintento de red no cree resultados duplicados.
- Validar la fórmula de puntuación. No etiquetar un resultado como puntaje oficial CENEVAL sin una metodología aprobada.
- El backend puede mantener la respuesta correcta inaccesible al alumno hasta el momento definido para mostrar retroalimentación.

### DA-09 · Mantener correo y tareas asíncronas simples al inicio

**Decisión:** utilizar un proveedor de correo transaccional si recuperación de cuenta o notificaciones son parte del alcance. No desplegar una plataforma de mensajería propia de inicio.

**Por qué:**

- El correo es una dependencia operativa; un proveedor administrado evita mantener servidores SMTP propios.
- Una cola y workers separados añaden complejidad. Para una primera versión, las tareas pueden permanecer en el backend si son breves y fiables.

**Evolución:** añadir cola administrada y worker cuando existan tareas largas (por ejemplo, análisis de archivos o informes), necesidad de reintentos durables o volumen que no convenga procesar dentro de la solicitud HTTP. Registrar fallas y reintentos; no perder tareas críticas silenciosamente.

### DA-10 · Desplegar ambientes separados y promocionar artefactos probados

**Decisión:** mantener staging y producción con dominios, credenciales, datos y servicios aislados. Validar un artefacto en staging y promover ese mismo artefacto a producción.

**Por qué:**

- Staging permite encontrar errores de configuración e integración sin impactar cuentas reales.
- Promover el artefacto probado evita diferencias entre lo que se validó y lo que se publica.
- El aislamiento reduce el riesgo de contaminar datos de producción con pruebas.

**Pipeline esperado:**

1. Pull request: instalación reproducible, lint, pruebas y build.
2. Merge: despliegue automático a staging.
3. Smoke tests de autenticación, permisos, materiales y flujos de examen.
4. Aprobación antes de producción.
5. Despliegue con monitoreo y procedimiento de rollback documentado.

La configuración de Vite debe usar caché larga para assets con hash y revalidación/no-cache para el HTML. HTTPS, CORS limitado a orígenes autorizados y cabeceras de seguridad deben configurarse antes de abrir acceso público. Los secretos se gestionan en el proveedor de despliegue; nunca se guardan en el repositorio ni en el bundle.

### DA-11 · Usar Supabase y servicios administrados; posponer Kubernetes

**Decisión:** usar Supabase para PostgreSQL/Auth/Storage y Edge Functions según encaje con los flujos; alojar React/Vite en hosting estático/CDN. No introducir Kubernetes ni microservicios en la primera versión.

**Por qué:**

- Reduce la carga de parches, operación de infraestructura, disponibilidad y backups.
- Centra el esfuerzo del equipo en la experiencia educativa, los permisos y la integridad de los resultados.
- La arquitectura modular deja margen para escalar sin pagar el costo distribuido antes de necesitarlo.

La elección del hosting del frontend y la verificación del proyecto/plan/región de Supabase quedan sujetas a presupuesto, soporte, requisitos de residencia de datos y experiencia del equipo. Supabase es la plataforma de datos propuesta, pero el plan de producción se debe validar antes de depender de sus límites, SLA o características de respaldo.

### DA-12 · Priorizar observabilidad, backups y recuperación

**Decisión:** tratar monitoreo y recuperación como parte de la arquitectura de producción, no como trabajo posterior.

**Mínimos:**

- Registros estructurados y métricas de API, errores, latencia, disponibilidad y operaciones de evaluaciones.
- Identificadores de correlación para investigar un flujo sin registrar contraseñas, tokens o información personal innecesaria.
- Alertas con un responsable y procedimiento de atención.
- Backups cifrados de PostgreSQL y de archivos, con retención definida y restauraciones probadas.
- Objetivos acordados de recuperación (RPO/RTO) y runbook de incidente/rollback.

**Por qué:** cuentas, permisos, materiales y resultados son datos de valor para alumnos e institución. Un backup que nunca se ha restaurado ni una alerta sin responsable no ofrecen recuperación comprobada.

## 4. Opciones deliberadamente pospuestas

| Opción | Decisión actual | Motivo para posponerla |
|---|---|---|
| Microservicios | No adoptar al inicio | Mayor complejidad de despliegue, red, observabilidad y consistencia; no hay evidencia de escala que lo requiera. |
| Kubernetes | No adoptar al inicio | Aumenta la carga operativa; un servicio administrado de aplicación cubre el primer despliegue. |
| Redis | No adoptar al inicio | No hay una necesidad medida de caché o coordinación que justifique operarlo. |
| Plataforma dedicada de streaming | No adoptar por ahora | La videoteca solo guardará enlaces a Drive; reevaluar si cambian los requisitos de privacidad, reproducción o analítica. |
| API Fastify/NestJS independiente | No adoptar al inicio | Las APIs de Supabase y Edge Functions cubren el alcance inicial; reconsiderar si la lógica/operación excede sus capacidades. |
| Pagos en línea | Fuera de alcance actual | Reglas y proveedor todavía no aprobados por el cliente. |
| SSO institucional | Pendiente de confirmar | No es necesario imponerlo si el primer lanzamiento usa autenticación estándar y no se solicita integración institucional. |
| Analítica avanzada | Posponer | Primero construir métricas correctas a partir de intentos y datos persistidos. |

## 5. Decisiones abiertas antes de seleccionar proveedores

- [ ] Plan, región, presupuesto, cuotas y configuración de producción de Supabase.
- [ ] Confirmar Supabase Auth como proveedor y definir sesión, correo y flujo de alta/invitación.
- [ ] Diseñar y probar políticas RLS y grants para todas las tablas y buckets expuestos.
- [ ] Definir qué operaciones irán por APIs Supabase, Edge Functions y/o funciones SQL.
- [ ] Confirmar Supabase Storage para PDFs e imágenes; establecer cuotas, análisis de archivos y recuperación.
- [ ] Definir política de respaldos de PostgreSQL y exportación/restauración de objetos de Storage; probar restauración.
- [ ] Si los enlaces de Drive serán privados por cuenta/grupo o accesibles por enlace, y cómo se administrará el alta/baja de permisos.
- [ ] Requisitos de retención, respaldo, RPO/RTO y volumen concurrente esperado.
- [ ] Necesidad de correo transaccional, reportes descargables y notificaciones.
- [ ] Política de puntuación y reglas de intentos/reanudación de evaluaciones.
- [ ] Requisitos legales de privacidad y operación según jurisdicción.
- [ ] Presupuesto y responsables de operación, soporte y respuesta a incidentes.

## 6. Consecuencia principal para el estado actual

Estas decisiones requieren cambios de producto además de infraestructura. El prototipo no se convierte en sistema operativo solo por publicar `dist/`: hay que reemplazar datos mock, conectar autenticación y persistencia, completar el flujo de evaluación, revisar accesos por rol y hacer que los estados de éxito correspondan a operaciones confirmadas por backend. Hasta entonces, el despliegue debe etiquetarse y limitarse como demo.

## 7. Estado de implementación frente a los issues

La siguiente matriz evita marcar como resuelto un issue únicamente porque la arquitectura ya fue definida:

| Issue | Estado actual | Evidencia o bloqueo |
|---|---|---|
| #24 · Reglas del producto | Bloqueado por cliente | Faltan decisiones aprobadas sobre altas, roles, grupos, materiales, evaluaciones, Drive y retención. |
| #25 · Supabase CLI | Implementado localmente | Existe `supabase/config.toml`, `supabase/seed.sql` e instrucciones en `supabase/README.md`; la ejecución local queda pendiente de iniciar Docker. |
| #26 · Modelo de datos | Base implementada | La migración cubre perfiles, cursos, grupos, asignaciones, módulos, sesiones, materiales y auditoría; evaluaciones, intentos y resultados quedan en el issue #30. |
| #27 · Auth y RLS | Parcial | Auth del frontend y RLS de `profiles` están implementados; faltan las tablas y políticas del dominio completo. |
| #28 · Storage | Pendiente | Requiere modelo de materiales, cuotas, políticas de objetos y procedimiento de recuperación. |
| #29 · Catálogo Drive | Pendiente | Requiere tabla de videos, reglas de publicación y permisos aprobados por el cliente. |
| #30 · Evaluaciones | Pendiente | Requiere reglas de tiempo, intentos, reanudación, calificación y publicación de resultados. |
| #31 · Estadísticas | Pendiente | No se deben reemplazar las métricas mock hasta persistir intentos y resultados reales. |
| #32 · Auth del frontend | Implementado en la rama | Usa Supabase Auth cuando se configuran `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; requiere revisión y merge del PR correspondiente. |
| #33–#37 · Integración de frontend | Pendiente | Las pantallas principales todavía consumen mocks o estado en memoria. |
| #38 · Ambientes | Parcial | La configuración local existe; faltan proyectos independientes de desarrollo, staging y producción. |
| #39 · Migraciones | Parcial | Hay una migración inicial; falta el flujo de validación y promoción con Supabase CLI. |
| #40 · Recuperación y monitoreo | Pendiente | Faltan plan, responsables, restauración probada y objetivos RPO/RTO. |
| #41 · Aceptación y lanzamiento | Bloqueado | Solo procede después de cerrar los issues técnicos y obtener aprobación en staging. |

El primer entregable técnico no debe publicarse como producción hasta que #24 esté aprobado, las políticas RLS del dominio hayan sido probadas con los tres roles y #41 tenga evidencia de aceptación. Los cambios de autenticación deben conservarse aunque se pospongan los demás módulos, porque eliminan la validación de credenciales en el navegador y establecen la integración inicial con Supabase.
