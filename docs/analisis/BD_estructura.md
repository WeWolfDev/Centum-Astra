# Entidad ADMINISTRADOR

## 1. Descripción

La entidad `ADMINISTRADOR` representa a los usuarios encargados de gestionar y supervisar las operaciones de la plataforma educativa.

## 2. Atributos

| Atributo | Tipo de dato | Descripción |
|---|---|---|
| id_administrador | BIGINT (PK, FK) | Identificador único, relacionado con la entidad `USUARIO`. |
| fecha_asignacion | TIMESTAMP | Fecha en la que se asignó el rol de administrador. |
| nivel_permiso | VARCHAR(30) | Nivel de privilegios del administrador. |

Los datos personales y de autenticación, como nombre, correo y contraseña, se almacenarán en la entidad `USUARIO`.

## 3. Acciones del administrador

El administrador podrá realizar las siguientes operaciones:

| Acción | Descripción | Entidad relacionada |
|---|---|---|
| Aprobar calificaciones | Revisar y aprobar las calificaciones obtenidas por los alumnos. | `RESULTADO_EXAMEN` |
| Autorizar acceso | Habilitar el acceso de alumnos que hayan realizado su pago. | `INSCRIPCION` |
| Crear módulos | Registrar nuevos módulos educativos dentro de los cursos. | `MODULO` |
| Añadir maestros | Registrar nuevos maestros en la plataforma. | `MAESTRO` |
| Crear simuladores | Crear y configurar nuevos simuladores de examen. | `SIMULADOR` |
| Revisar simuladores | Consultar simuladores existentes y las respuestas registradas por los alumnos. | `SIMULADOR`, `RESPUESTA_ALUMNO` |

## 4. Relaciones con otras entidades

Las acciones del administrador se representarán mediante atributos en las entidades relacionadas.

| Entidad | Atributo propuesto | Descripción |
|---|---|---|
| `RESULTADO_EXAMEN` | aprobado_por (FK) | Administrador que aprobó la calificación. |
| `INSCRIPCION` | autorizado_por (FK) | Administrador que habilitó el acceso. |
| `MODULO` | creado_por (FK) | Administrador que creó el módulo. |
| `MAESTRO` | registrado_por (FK) | Administrador que registró al maestro. |
| `SIMULADOR` | creado_por (FK) | Administrador que creó el simulador. |
| `REVISION_SIMULADOR` | revisado_por (FK) | Administrador que realizó una revisión formal de las respuestas de un intento. |

Estos atributos serán claves foráneas que referencian a `ADMINISTRADOR(id_administrador)`.

## 5. Consideraciones

- La entidad `ADMINISTRADOR` almacenará únicamente los atributos propios de su rol.
- Las acciones administrativas no serán atributos de `ADMINISTRADOR`, sino operaciones relacionadas con otras entidades.
- Un administrador podrá crear, aprobar o gestionar múltiples registros.
- La consulta de simuladores y respuestas no requiere almacenar una relación adicional, salvo que se desee conservar un historial de revisiones.




