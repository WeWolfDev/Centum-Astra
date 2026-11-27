// Evaluaciones que se pueden contestar en el modo demo (sin Supabase), para que
// el alumno vea el flujo completo: contestar, ver su resultado y ganar estrella.
// `correcta` es el id de la opción correcta.

function pregunta(id, texto, opciones, correcta) {
  return { id, texto, opciones: opciones.map((t, i) => ({ id: `${id}-${i}`, texto: t })), correcta: `${id}-${correcta}` };
}

export const quizzesEjemplo = [
  {
    id: 'demo-biologia-celular',
    tipo: 'quiz',
    titulo: 'Biología celular',
    materia: 'Pre-medicina',
    preguntas: [
      pregunta('bc1', '¿Qué organelo produce la mayor parte del ATP de la célula?', ['Ribosoma', 'Mitocondria', 'Aparato de Golgi', 'Lisosoma'], 1),
      pregunta('bc2', '¿Dónde está la mayor parte del ADN en una célula eucariota?', ['Membrana plasmática', 'Citoplasma', 'Núcleo', 'Vacuola'], 2),
      pregunta('bc3', 'La síntesis de proteínas ocurre en los…', ['Ribosomas', 'Lisosomas', 'Centriolos', 'Peroxisomas'], 0),
      pregunta('bc4', '¿Qué transporte usa energía para mover sustancias contra su gradiente?', ['Difusión simple', 'Ósmosis', 'Difusión facilitada', 'Transporte activo'], 3),
      pregunta('bc5', '¿Qué estructura tienen las células vegetales y no las animales?', ['Pared celular', 'Membrana plasmática', 'Mitocondria', 'Ribosomas'], 0),
    ],
  },
  {
    id: 'demo-geometria-analitica',
    tipo: 'quiz',
    titulo: 'Geometría analítica',
    materia: 'Matemáticas',
    preguntas: [
      pregunta('ga1', '¿Cuál es la pendiente de la recta que pasa por (1, 2) y (3, 8)?', ['2', '3', '4', '6'], 1),
      pregunta('ga2', '¿Cuál es la distancia entre (0, 0) y (3, 4)?', ['4', '5', '6', '7'], 1),
      pregunta('ga3', '¿Cuál es el punto medio entre (2, 4) y (6, 8)?', ['(4, 6)', '(8, 12)', '(3, 5)', '(4, 4)'], 0),
      pregunta('ga4', 'Circunferencia con centro en el origen y radio 3:', ['x² + y² = 3', 'x² + y² = 6', 'x² + y² = 9', 'x + y = 3'], 2),
      pregunta('ga5', 'Recta con pendiente 2 que corta al eje y en −1:', ['y = 2x + 1', 'y = 2x − 1', 'y = −x + 2', 'y = x − 2'], 1),
    ],
  },
];

export const simuladorMuestra = {
  id: 'demo-simulador-muestra',
  tipo: 'simulador',
  titulo: 'Simulador de muestra',
  materia: 'EXANI-II',
  preguntas: [
    pregunta('sm1', 'Si 3x + 5 = 20, ¿cuánto vale x?', ['3', '5', '15', '25/3'], 1),
    pregunta('sm2', '¿Cuánto es el 25 % de 80?', ['20', '25', '32', '40'], 0),
    pregunta('sm3', 'Elige el sinónimo de «efímero».', ['Eterno', 'Enorme', 'Pasajero', 'Oculto'], 2),
    pregunta('sm4', '¿Qué órgano filtra la sangre para formar la orina?', ['Hígado', 'Riñón', 'Páncreas', 'Bazo'], 1),
    pregunta('sm5', '¿Cuál es la fórmula química del agua?', ['CO₂', 'H₂O₂', 'NaCl', 'H₂O'], 3),
    pregunta('sm6', 'Elige la palabra bien escrita.', ['Exhausto', 'Exausto', 'Ecsausto', 'Exháusto'], 0),
    pregunta('sm7', '¿Qué células de la sangre transportan oxígeno?', ['Leucocitos', 'Plaquetas', 'Eritrocitos', 'Linfocitos'], 2),
    pregunta('sm8', 'El número atómico de un elemento indica su número de…', ['Neutrones', 'Protones', 'Isótopos', 'Electrones de valencia'], 1),
  ],
};
