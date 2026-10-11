// Copy por tipo de evaluación (simulador | quiz).
// Centralizado para que el modal, la card del maestro y el estado vacío
// no se ramifiquen por tipo en cada punto de uso.
export const TIPO_COPY = {
  simulador: {
    singular: 'simulador',
    singularMay: 'Simulador',
    nuevoTitulo: 'Nuevo simulador',
    nombrePh: 'Simulador EXANI-II · set 1',
    aparecera: 'Este simulador aparecerá para los alumnos y su puntaje alimenta su gráfica.',
    vacioTitulo: 'Aún no has creado simuladores',
    vacioDescripcion: 'Un simulador largo con puntaje Ceneval le sirve al alumno para medir su progreso.',
    vacioCta: 'Crear mi primer simulador',
    tono: 'tipo-simulador',
  },
  quiz: {
    singular: 'quiz',
    singularMay: 'Quiz',
    nuevoTitulo: 'Nuevo quiz',
    nombrePh: 'Álgebra básica · set 1',
    aparecera: 'Este quiz aparecerá para los alumnos como un cuestionario corto.',
    vacioTitulo: 'Aún no has creado quizzes',
    vacioDescripcion: 'Un quiz corto por tema te sirve para que tus alumnos repasen antes del simulador.',
    vacioCta: 'Crear mi primer quiz',
    tono: 'tipo-quiz',
  },
};
