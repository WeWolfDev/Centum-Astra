# Respuestas y preguntas pendientes del cliente

**Sistema:** Centum Astra  
**Fecha de registro:** 2026-11-01  
**Responsable de aprobación funcional y salida a producción:** cliente responsable del proyecto  
**Plataforma técnica acordada:** Supabase para PostgreSQL, Auth y Storage; Supabase CLI para desarrollo local y migraciones  
**Pagos:** sin pasarela de pagos; sí incluye un apartado para enviar y aprobar comprobantes

Este documento consolida las respuestas recibidas, evita volver a preguntar lo que ya está decidido y deja únicamente las aclaraciones necesarias para continuar la implementación sin inventar reglas de negocio.

## 1. Decisiones confirmadas

### 1.1 Alcance y responsables

- El sistema debe entregar todas las funciones definidas del producto integral desde la primera versión.
- La única función que puede quedar fuera de la primera versión es la pasarela de pagos.
- Las áreas iniciales son:
  - Pensamiento matemático.
  - Comprensión lectora.
  - Redacción indirecta.
  - Premedicina.
  - Ciencias de la salud.
- El cliente será responsable de aprobar las decisiones funcionales y dar el visto bueno para producción.
- La plataforma no cobrará en línea. El alumno paga por fuera y envía su comprobante para que un administrador lo apruebe (ver 1.8).

### 1.2 Cuentas, autenticación y permisos

- Un usuario nuevo debe proporcionar nombre, correo y contraseña.
- El administrador define el rol de la cuenta al momento de registrarla:
  - Alumno.
  - Maestro.
  - Administrador, únicamente cuando corresponda.
- Un usuario que ya tiene cuenta solo proporciona correo y contraseña.
- El correo debe verificarse antes de activar la cuenta.
- El administrador crea, edita, suspende y elimina cuentas.
- Cada cuenta tendrá un solo rol activo.
- Al suspender o eliminar una cuenta se conserva el historial.
- La cuenta no debe desaparecer físicamente: se conserva como suspendida o eliminada, con el motivo correspondiente.
- La recuperación de contraseña debe:
  1. Permitir seleccionar “Recuperar contraseña”.
  2. Enviar un código de verificación.
  3. Permitir establecer una nueva contraseña.
  4. Solicitar un nuevo inicio de sesión para confirmar el cambio.

**Nota técnica:** el rol será una decisión administrativa y no un dato controlado por el usuario desde el navegador. Esto evita que una persona se registre por su cuenta como administrador.

### 1.3 Cursos, grupos y acceso

- Un profesor puede pertenecer a múltiples grupos.
- Un alumno solo puede pertenecer a un grupo.
- Un alumno puede acceder a los módulos correspondientes a su área o curso registrado.
- El administrador asigna y retira alumnos y profesores de los grupos.
- El profesor solo puede ver a los alumnos de sus grupos.
- El administrador concede y revoca el acceso.
- La organización se manejará por generaciones.

### 1.4 Materiales, archivos y progreso

- Se permitirán:
  - Documentos de Word.
  - PDF.
  - Presentaciones.
  - Hojas de cálculo.
  - Imágenes.
  - Video.
- Administradores y maestros pueden subir y gestionar materiales.
- Los alumnos solo pueden visualizar los materiales.
- La jerarquía será:
  - Curso.
  - Grupo.
  - Módulo.
  - Tema.
  - Sesión.
- Si se sube un archivo en el mismo espacio, reemplaza al anterior.
- Si se necesita conservar el anterior, se crea otro espacio o material.
- Una clase se considera vista cuando el alumno abre sus archivos.
- Una clase se considera completada cuando el alumno resuelve todos los ejercicios o actividades relacionadas.

**Nota técnica:** aunque se indicó que no habrá límite de archivos, en producción debe existir un límite técnico por archivo y por proyecto para proteger costos, disponibilidad y seguridad. Ese límite puede ser amplio, pero no debe ser ilimitado.

### 1.5 Videoteca y Google Drive

- Los enlaces de Drive estarán restringidos a cuentas autorizadas.
- Solo los correos registrados en los cursos podrán acceder.
- Los alumnos necesitan una cuenta de Google compatible con los permisos de Drive.
- La organización administrará los videos y sus permisos.
- Los videos se abrirán en una pestaña nueva.
- El sistema registrará quién abrió cada video.
- El administrador será responsable de mantener los enlaces y resolver problemas de disponibilidad.

### 1.6 Evaluaciones

- Existirán simuladores y quizzes por tema.
- Las evaluaciones se dividen en cuestionarios y simuladores: maestros y administradores trabajan los cuestionarios, y solo los administradores crean y aprueban los simuladores.
- Las preguntas y las opciones podrán aleatorizarse.
- Los simuladores no se pueden pausar.
- Si el alumno se desconecta o recarga, podrá continuar mientras no haya terminado el tiempo.
- Los quizzes sí podrán pausarse y retomarse.
- El alumno podrá realizar los ejercicios más de una vez; falta confirmar si esto aplica de igual forma a todos los quizzes y simuladores.
- Las respuestas correctas se mostrarán al finalizar la evaluación.
- El alumno verá sus respuestas y resultados.
- El maestro verá las respuestas de sus alumnos.
- El administrador verá todas las respuestas, el grupo o salón y el maestro que evaluó al grupo.
- El sistema de puntos se basará en el esquema de puntuación que actualmente maneja el prototipo para los simuladores EXANI-II.
- El administrador podrá corregir o anular resultados.
- Los intentos y resultados estarán disponibles durante todo el tiempo que dure el curso.

**Nota importante:** la decisión se refiere al funcionamiento del sistema de puntos, no a presentar el resultado como una certificación oficial de CENEVAL. La fórmula actual del prototipo es una conversión lineal de aciertos a un rango de 700 a 1300 puntos, con 138 preguntas como supuesto. Estos valores deben aprobarse antes de convertirlos en la fuente de verdad del backend.

### 1.7 Reportes, privacidad y operación

- Los reportes solo podrán exportarse por el administrador.
- El sistema operará en México y deberá cumplir los requisitos legales aplicables en México.
- La información personal mínima indicada es nombre y correo.
- No se permitirá iniciar sesión desde varios dispositivos simultáneamente.
- Se esperan aproximadamente entre 80 y 150 usuarios; falta distinguir registrados, activos y simultáneos.
- El tiempo máximo aproximado de respuesta esperado es de 5 segundos.
- Ante una desconexión no debería perderse más que la última pregunta antes de la desconexión.
- El presupuesto máximo indicado es de 2,500 MXN mensuales.
- No se requiere una región específica de almacenamiento.
- El cliente será propietario y el equipo del proyecto administrará las cuentas técnicas.
- Los contenidos estarán verificados y autorizados.
- El acceso público se limitará al login principal.
- El administrador proporcionará y validará reactivos, explicaciones, videos y derechos de uso.

### 1.8 Decisiones de la plática del 2026-11-08

**Materiales**

- El maestro publica sus clases sin aprobación previa y puede corregir sus archivos.
- El administrador retira el material publicado.
- El límite es de 50 MB por archivo.

**Acceso y grupos**

- El acceso se determina por grupo, y el grupo define qué módulos tiene habilitados el alumno.
- Un alumno puede estudiar más de un área si el sistema le da permiso a esos espacios específicos.
- Todos los alumnos tienen la misma fecha de inicio y de fin.
- El número de grupos varía y cada uno tiene un solo horario: entre semana (martes y jueves, 7:00 a 9:00 p. m.) o sabatino (sábados, 8:00 a. m. a 12:00 p. m.).
- Actualmente hay 5 maestros y la plataforma debe permitir agregar más.

**Evaluaciones**

- El curso no tiene calificación general; solo se califican quizzes, cuestionarios grandes y simuladores.
- Los quizzes se califican en porcentaje.
- Los cuestionarios grandes y los simuladores tipo Ceneval usan la escala de 700 a 1300.
- El cálculo propuesto es `700 + (aciertos / total de preguntas) × 600` y se presenta como puntaje estimado.
- No existe un puntaje general para aprobar: el resultado se compara con el corte de la facultad a la que aspira el alumno.

**Pagos**

- No habrá pasarela de pagos, pero sí un apartado para enviar comprobantes.
- El alumno paga por fuera de la plataforma, llena el formulario de pago y envía su comprobante; un administrador lo revisa y lo aprueba.
- El curso completo cuesta $4,500 MXN con la inscripción de $500 incluida.
- Las mensualidades con descuento son de $1,000 o $1,125 MXN, con un máximo de 3 meses contando la inscripción.
- El cliente define las condiciones de cada descuento y si la inscripción es uno de los pagos o se cobra aparte.

**Otras funciones**

- Centum Notes: tareas hechas en Canva, en PDF, Word o PowerPoint, que suben maestros y administradores.
- Por ahora, los alumnos reciben por correo los avisos de mensualidades, pagos pendientes y cuestionarios.
- Racha: el alumno la mantiene al hacer sus actividades o volver a practicar cada día; se muestra la semana que lleva, de ser posible con estrellas.
- Modo claro en blanco y dorado.

## 2. Preguntas pendientes o que requieren aclaración

Estas son las únicas preguntas que deben volver al cliente. Las demás ya no necesitan repetirse.

### P-01. Acceso por área, curso y grupo

**Estado:** respondida en 1.8. Falta definir cómo se otorga el acceso a más de un área.

Se indicó que el alumno accede según el área donde se registró, pero también que pertenece a una generación y un grupo:

- ¿El acceso se determina por área, curso, grupo o una combinación?
- ¿Un alumno puede cambiar de área o curso?
- ¿Qué ocurre si un alumno necesita estudiar más de un área?
- ¿El grupo pertenece a una sola área o puede incluir varias?

### P-02. Vencimiento del acceso

**Estado:** parcial. Todos los alumnos tienen la misma fecha de inicio y de fin; faltan las extensiones individuales y qué ocurre con los resultados.

- ¿El acceso termina en una fecha fija del curso?
- ¿La fecha depende de la generación?
- ¿Un administrador puede extender el acceso individualmente?
- ¿Qué ocurre con los resultados cuando termina el curso?

### P-03. Aprobación de materiales

**Estado:** respondida en 1.8.

Se indicó que maestros y administradores pueden gestionar materiales:

- ¿El maestro puede publicar directamente?
- ¿O el administrador debe aprobar antes de que el material sea visible?
- ¿Quién puede reemplazar o retirar material publicado?

**Recomendación inicial:** permitir al maestro crear borradores; exigir publicación o aprobación del administrador para hacerlos visibles a los alumnos, salvo que el cliente prefiera publicación directa.

### P-04. Tipos y límites de archivo

**Estado:** parcial. El límite es de 50 MB por archivo; faltan las demás preguntas.

- ¿El “video” se cargará realmente a Supabase Storage o solo se guardará como enlace a Google Drive?
- ¿Cuál debe ser el límite máximo por archivo?
- ¿Cuál debe ser el límite total por curso?
- ¿Se permitirán archivos comprimidos, ejecutables o formatos distintos a los listados?

**Recomendación inicial:** los videos deben continuar como enlaces de Drive; definir un límite técnico para documentos e imágenes, aunque el usuario no perciba un límite comercial.

### P-05. Versiones y reemplazo de materiales

- Cuando se reemplace un archivo, ¿se elimina físicamente el anterior?
- ¿Se conserva internamente para auditoría?
- ¿El alumno que ya lo abrió debe seguir viendo la versión anterior?
- ¿El reemplazo debe conservar el mismo nombre y ubicación?

### P-06. Reactivos y formatos de evaluación

- ¿Los reactivos serán únicamente de opción múltiple?
- ¿Se permitirán varias respuestas correctas?
- ¿Se utilizarán imágenes, audios o videos dentro de las preguntas?
- ¿Se requieren respuestas abiertas?
- ¿Se mostrarán explicaciones después de cada pregunta o solo al terminar?

### P-07. Intentos de simuladores y quizzes

- ¿La cantidad de intentos es ilimitada para simuladores, quizzes o ambos?
- ¿Se conserva cada intento en el historial?
- ¿El profesor puede limitar los intentos para una evaluación específica?
- ¿Se toma el mejor resultado, el último resultado o todos los resultados?
- ¿Qué significa exactamente “no se puede pausar” para un simulador si el alumno puede recargar y continuar?

**Recomendación:** distinguir entre:

- Simulador: un intento activo con tiempo continuo; puede reanudarse después de una desconexión, pero no pausarse voluntariamente.
- Quiz: puede pausarse y retomarse.

### P-08. Sistema de puntos del simulador

**Estado:** parcial. La fórmula propuesta está en 1.8 y debe aprobarse; el total de preguntas ya no es fijo.

- ¿Se mantienen 138 preguntas como total del simulador?
- ¿Se mantiene el rango de 700 a 1300 puntos?
- ¿La conversión seguirá siendo lineal entre aciertos y puntos?
- ¿Todas las preguntas cuentan o existen preguntas adicionales que no cuentan?
- ¿Se mostrarán aciertos, porcentaje y puntos, o únicamente puntos?
- ¿El resultado debe llamarse “puntaje de práctica”, “puntaje estimado” u otro nombre?

**Referencia actual del código:** 0 aciertos produce aproximadamente 700 puntos y el total de aciertos produce 1300 puntos. Esta conversión todavía está marcada como supuesto en el frontend y debe aprobarse antes de implementarse en servidor.

### P-09. Estadísticas del sistema

La pregunta original sobre indicadores no quedó respondida. Se necesita definir qué verá cada rol.

**Administrador:**

- ¿Total de alumnos, maestros y grupos?
- ¿Promedios por área y generación?
- ¿Alumnos activos?
- ¿Resultados por evaluación?

**Maestro:**

- ¿Promedio de sus grupos?
- ¿Progreso por módulo?
- ¿Alumnos con bajo desempeño?
- ¿Resultados por pregunta?

**Alumno:**

- ¿Progreso personal?
- ¿Historial de intentos?
- ¿Promedio por área?
- ¿Recomendaciones?

También se debe confirmar:

- ¿Las estadísticas serán por generación?
- ¿Por grupo?
- ¿Por curso?
- ¿Por semana, mes o todo el historial?

### P-10. Notificaciones

**Estado:** parcial. Por ahora, los alumnos reciben por correo los avisos definidos en 1.8.

- ¿Se necesitan correos o avisos dentro del sistema?
- ¿Qué eventos deben notificar?
  - Activación de cuenta.
  - Recuperación de contraseña.
  - Publicación de material.
  - Asignación de evaluación.
  - Publicación de resultados.
  - Cambio de grupo.
- ¿Quién recibe cada notificación?

### P-11. Menores de edad

- ¿Habrá alumnos menores de edad?
- Si los hay, ¿quién proporciona el consentimiento?
- ¿Se requiere autorización de padres o tutores?
- ¿El cliente proporcionará los textos legales y el mecanismo de consentimiento?

### P-12. Derechos de los usuarios sobre sus datos

Se indicó que no se permitirá solicitar copia o eliminación de datos. Se necesita confirmar:

- ¿El administrador atenderá manualmente esas solicitudes?
- ¿Se conservarán los datos por obligación legal o académica?
- ¿Qué información se elimina al desactivar una cuenta?
- ¿Durante cuánto tiempo se conservan cuentas, resultados, archivos y registros de actividad?

### P-13. Disponibilidad y soporte

- ¿En qué horarios debe estar disponible el sistema?
- ¿Existen fechas críticas de alta demanda?
- ¿Qué significa que el soporte sea “administrativo”?
- ¿El administrador recibirá alertas de fallas?
- ¿Quién atenderá a alumnos y maestros?
- ¿Cuál es el tiempo máximo de atención a un incidente?

### P-14. Usuarios simultáneos

La respuesta “80 a 150” necesita dividirse:

- ¿Cuántos usuarios estarán registrados en total?
- ¿Cuántos usuarios activos habrá mensualmente?
- ¿Cuántos usuarios podrían estar conectados al mismo tiempo?
- ¿Cuántos podrían iniciar o entregar una evaluación simultáneamente?

### P-15. Respaldos y recuperación

Para cerrar producción todavía falta confirmar:

- ¿Cuánto tiempo máximo puede estar fuera de servicio el sistema?
- ¿Cuánta información se podría perder como máximo?
- ¿Quién autoriza una restauración?
- ¿Cada cuánto se deben realizar respaldos?
- ¿Durante cuánto tiempo deben conservarse?

### P-16. Administración de cuentas técnicas

Se indicó que el cliente será propietario y el equipo administrará las cuentas. Falta precisar:

- ¿Qué persona del cliente tendrá la propiedad principal?
- ¿Qué integrantes del equipo tendrán acceso administrativo?
- ¿Cómo se revocará el acceso cuando alguien deje el proyecto?
- ¿El cliente conservará acceso de recuperación a Supabase, Drive, dominio y hosting?

## 3. Decisiones técnicas derivadas

Con las respuestas actuales, el sistema debe implementarse con estas reglas:

1. Supabase Auth administrará las credenciales, sesiones, verificación de correo y recuperación.
2. Los roles deben mantenerse en tablas protegidas y no confiarse al navegador.
3. Un alumno solo puede pertenecer a un grupo.
4. Un maestro puede pertenecer a varios grupos.
5. El administrador controla asignaciones, acceso y cuentas.
6. Los documentos e imágenes se almacenarán en Storage privado.
7. Los videos se manejarán mediante enlaces restringidos de Google Drive.
8. El frontend abrirá Drive en una pestaña nueva después de autorizar al usuario.
9. Cada apertura de video generará un registro de auditoría.
10. El servidor será la autoridad del tiempo, entrega y resultados de evaluaciones.
11. Los resultados se conservarán durante la vigencia del curso y sus reglas de retención.
12. No se implementará una pasarela de pagos; los pagos se registran con comprobantes aprobados por un administrador.

## 4. Próximo orden de aprobación

Para reducir más las dudas, el cliente solo necesita responder primero:

1. P-01 y P-02: acceso por área, curso, grupo y vencimiento.
2. P-03 a P-05: publicación, límites y reemplazo de materiales.
3. P-06 a P-08: formatos, intentos y sistema de puntos.
4. P-09 y P-10: estadísticas y notificaciones.
5. P-11 y P-12: privacidad, menores y retención.
6. P-13 a P-16: soporte, capacidad, recuperación y cuentas técnicas.

Con estas respuestas se podrá actualizar el esquema de Supabase, las políticas RLS, los flujos de frontend y los criterios de aceptación sin volver a revisar las 67 preguntas originales.

## 5. Preguntas complementarias de segunda ronda

Estas preguntas no bloquean la definición inicial del modelo, pero ayudan a evitar cambios tardíos durante la implementación, la prueba piloto y la operación.

### 5.1 Cuentas y seguridad

1. ¿El correo de una cuenta puede cambiarse después del registro?
2. ¿Quién puede cambiar el correo: el usuario, el administrador o ambos?
3. ¿Se debe cerrar la sesión en todos los dispositivos después de cambiar la contraseña?
4. ¿Cuántos intentos fallidos de inicio de sesión provocan un bloqueo temporal?
5. ¿Cuánto debe durar el bloqueo después de demasiados intentos?
6. ¿Se requiere un aviso cuando cambia la contraseña, el correo o el rol?
7. ¿Debe el administrador poder cerrar la sesión de un usuario desde el panel?
8. ¿Se necesita un historial de inicios de sesión, cambios de rol y suspensiones?
9. ¿Qué debe suceder si el correo de invitación nunca se confirma?
10. ¿Las cuentas suspendidas pueden recuperar su contraseña?

### 5.2 Alumnos, grupos y generaciones

11. ¿Un alumno puede cambiar de grupo durante una generación?
12. Si cambia de grupo, ¿conserva los materiales, progreso e intentos anteriores?
13. ¿Se permite que un alumno vuelva a una generación anterior?
14. ¿Un grupo puede tener fecha de inicio y finalización distintas a las del curso?
15. ¿Se puede cerrar un grupo sin cerrar el curso?
16. ¿Qué sucede con un profesor cuando se retira de un grupo?
17. ¿Otro profesor puede asumir el grupo y conservar el historial del profesor anterior?
18. ¿Se necesita una lista de espera cuando un grupo alcanza su capacidad?
19. ¿Existe un límite máximo de alumnos por grupo?
20. ¿Se necesita importar alumnos desde Excel o CSV?

### 5.3 Materiales y contenidos

21. ¿Los nombres de archivo deben seguir una convención obligatoria?
22. ¿Se deben bloquear archivos con contraseña, cifrados o protegidos contra copia?
23. ¿Se deben revisar los archivos con antivirus antes de publicarlos?
24. ¿Los materiales deben tener fecha de publicación y fecha de retiro?
25. ¿Un material puede pertenecer a más de un módulo o sesión?
26. ¿Se necesita ordenar manualmente los materiales dentro de una sesión?
27. ¿Se deben marcar los materiales como obligatorios u opcionales?
28. ¿El alumno debe confirmar que leyó o revisó un material?
29. ¿Abrir un archivo es suficiente para marcarlo como visto o se requiere un tiempo mínimo?
30. ¿Qué sucede si un alumno abre un material y después ese material es reemplazado?
31. ¿Se necesita una papelera para recuperar materiales eliminados?
32. ¿Quién puede ver materiales en borrador?

### 5.4 Google Drive y videoteca

33. ¿La cuenta de Google del alumno debe coincidir exactamente con el correo registrado en Centum Astra?
34. ¿Qué sucede si el alumno cambia su correo de Google después de ser asignado a un curso?
35. ¿Se debe comprobar que el enlace pertenece a Google Drive antes de guardarlo?
36. ¿Se aceptarán enlaces de carpetas o únicamente enlaces de archivos individuales?
37. ¿Se requiere guardar también el identificador de Drive, además de la URL?
38. ¿Con qué frecuencia debe revisarse que los enlaces sigan funcionando?
39. ¿Quién recibe una alerta cuando un enlace deja de estar disponible?
40. ¿Se debe ocultar un video automáticamente después de varios errores de acceso?
41. ¿Se debe registrar únicamente la apertura del video o también el resultado de la comprobación de acceso?
42. ¿El administrador puede ver el último acceso y la cantidad total de aperturas por video?

### 5.5 Evaluaciones y calificación

43. ¿Una evaluación publicada puede editarse o debe crearse una nueva versión?
44. ¿Qué ocurre con los intentos existentes cuando se crea una nueva versión?
45. ¿Se puede retirar una pregunta después de que ya fue usada?
46. ¿Qué ocurre con los resultados si una pregunta se invalida?
47. ¿Las respuestas sin contestar cuentan como incorrectas?
48. ¿Existe penalización por responder incorrectamente?
49. ¿El alumno puede regresar a preguntas anteriores?
50. ¿El alumno puede cambiar una respuesta antes de entregar?
51. ¿Se debe mostrar cuántas preguntas faltan por responder?
52. ¿Se debe advertir al alumno antes de entregar una evaluación incompleta?
53. ¿Qué sucede si el alumno abre la misma evaluación en dos pestañas?
54. ¿Qué sucede si intenta entregar desde dos dispositivos?
55. ¿El profesor puede conceder tiempo adicional a un alumno específico?
56. ¿El administrador puede reabrir un intento cerrado?
57. ¿Debe quedar registrado quién modificó, anuló o reabrió un intento?
58. ¿Los resultados se publican automáticamente o el profesor debe liberarlos?
59. ¿El alumno puede ver la explicación de cada respuesta inmediatamente después de terminar?
60. ¿Se requiere un certificado o constancia al completar un curso?

### 5.6 Estadísticas y reportes

61. ¿Los promedios se calculan con todos los intentos o solo con el mejor intento?
62. ¿Los intentos incompletos aparecen en las estadísticas?
63. ¿Se debe distinguir entre progreso de contenido y rendimiento en evaluaciones?
64. ¿Las estadísticas deben actualizarse inmediatamente o una vez al día?
65. ¿Qué datos debe contener un reporte exportado?
66. ¿Los reportes deben incluir información personal completa o datos parcialmente ocultos?
67. ¿Se necesita filtrar reportes por generación, curso, grupo, área y periodo?
68. ¿Se debe guardar un registro de quién exportó cada reporte?
69. ¿Los reportes deben poder descargarse en Excel, CSV, PDF o más de un formato?
70. ¿Se necesita comparar grupos entre sí o solo consultar cada grupo por separado?

### 5.7 Privacidad y comunicación

71. ¿El cliente proporcionará el aviso de privacidad y los términos de uso?
72. ¿Se requiere que el usuario acepte esos documentos antes de activar la cuenta?
73. ¿Debe guardarse la versión del aviso que aceptó cada usuario?
74. ¿Se permitirá enviar comunicaciones informativas por correo?
75. ¿Se necesita consentimiento separado para comunicaciones promocionales?
76. ¿Qué información nunca debe aparecer en correos, reportes o notificaciones?
77. ¿Qué procedimiento se seguirá si un usuario solicita corregir sus datos?
78. ¿Quién autoriza la entrega de información personal a un tercero?
79. ¿Se requiere ocultar el correo de los alumnos frente a otros alumnos?
80. ¿Los profesores pueden descargar una lista de sus alumnos?

### 5.8 Producción y soporte

81. ¿Cuál es la fecha objetivo de lanzamiento?
82. ¿Se realizará un piloto antes de abrir el sistema a todos los usuarios?
83. ¿Cuántos usuarios participarán en el piloto?
84. ¿Quién proporcionará las cuentas y datos de prueba?
85. ¿Qué errores impedirán el lanzamiento?
86. ¿Quién firmará la aceptación de staging?
87. ¿Habrá horarios de mantenimiento comunicados previamente?
88. ¿Quién autoriza un rollback en producción?
89. ¿Cuál será el canal oficial para reportar incidentes?
90. ¿Se necesita un manual de operación para el administrador?
91. ¿Se necesita capacitación para maestros y administradores?
92. ¿Quién atenderá el soporte fuera del horario normal?
93. ¿Se requiere un historial de incidentes y acciones tomadas?
94. ¿Qué proveedores deben tener facturación a nombre del cliente?
95. ¿Qué ocurre si se supera el presupuesto mensual aprobado?
