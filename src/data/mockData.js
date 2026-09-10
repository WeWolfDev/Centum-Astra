export const mockUsers = [
  { id: 1, name: 'Dr. Alejandro Torres', email: 'admin@centum.mx', password: 'admin123', role: 'admin', avatar: 'AT' },
  { id: 2, name: 'Mtra. Sofía Ramírez', email: 'sofia@centum.mx', password: 'prof123', role: 'teacher', subject: 'Pensamiento Matemático', avatar: 'SR' },
  { id: 3, name: 'Prof. Carlos Mendoza', email: 'carlos@centum.mx', password: 'prof123', role: 'teacher', subject: 'Comprensión Lectora', avatar: 'CM' },
  { id: 4, name: 'Ana García López', email: 'ana@centum.mx', password: 'alu123', role: 'student', progress: 68, avatar: 'AG' },
  { id: 5, name: 'Luis Hernández', email: 'luis@centum.mx', password: 'alu123', role: 'student', progress: 42, avatar: 'LH' },
];

export const mockStudents = [
  { id: 1, name: 'Ana García López', email: 'ana@centum.mx', progress: 68, quizzes: 12, avgScore: 82, status: 'activo', paymentStatus: 'aprobado', subject: 'Pre-medicina' },
  { id: 2, name: 'Luis Hernández Vega', email: 'luis@centum.mx', progress: 42, quizzes: 7, avgScore: 71, status: 'activo', paymentStatus: 'aprobado', subject: 'Ciencias de la Salud' },
  { id: 3, name: 'María Morales Cruz', email: 'maria@centum.mx', progress: 91, quizzes: 18, avgScore: 95, status: 'activo', paymentStatus: 'aprobado', subject: 'Pre-medicina' },
  { id: 4, name: 'Pedro Jiménez Ruiz', email: 'pedro@centum.mx', progress: 23, quizzes: 3, avgScore: 58, status: 'pendiente', paymentStatus: 'pendiente', subject: 'Ciencias de la Salud' },
  { id: 5, name: 'Valeria Torres Soto', email: 'valeria@centum.mx', progress: 55, quizzes: 9, avgScore: 76, status: 'activo', paymentStatus: 'aprobado', subject: 'Pre-medicina' },
  { id: 6, name: 'Diego Reyes Fuentes', email: 'diego@centum.mx', progress: 79, quizzes: 15, avgScore: 88, status: 'activo', paymentStatus: 'aprobado', subject: 'Ciencias de la Salud' },
];

export const mockModules = [
  {
    id: 1, type: 'transversal', title: 'Pensamiento Matemático',
    icon: '∑', color: 'blue', topics: 24, resources: 48, progress: 65,
    subtopics: ['Álgebra', 'Geometría', 'Estadística', 'Cálculo Diferencial', 'Probabilidad'],
  },
  {
    id: 2, type: 'transversal', title: 'Comprensión Lectora',
    icon: '📖', color: 'purple', topics: 18, resources: 36, progress: 72,
    subtopics: ['Textos Argumentativos', 'Textos Narrativos', 'Inferencia', 'Vocabulario en Contexto'],
  },
  {
    id: 3, type: 'transversal', title: 'Redacción Indirecta',
    icon: '✍️', color: 'emerald', topics: 15, resources: 30, progress: 58,
    subtopics: ['Estructura del Texto', 'Coherencia', 'Cohesión', 'Ortografía'],
  },
  {
    id: 4, type: 'specific', title: 'Pre-medicina',
    icon: '🩺', color: 'teal', topics: 32, resources: 64, progress: 40,
    subtopics: ['Biología Celular', 'Anatomía', 'Bioquímica', 'Fisiología', 'Química Orgánica'],
  },
  {
    id: 5, type: 'specific', title: 'Ciencias de la Salud',
    icon: '⚕️', color: 'cyan', topics: 28, resources: 56, progress: 30,
    subtopics: ['Epidemiología', 'Salud Pública', 'Nutrición', 'Microbiología'],
  },
];

export const mockVideos = [
  { id: 1, title: 'Álgebra Lineal: Matrices y Determinantes', subject: 'Pensamiento Matemático', date: '2025-08-28', duration: '1:45:30', instructor: 'Mtra. Sofía Ramírez', views: 187, thumbnail: 'PM' },
  { id: 2, title: 'Textos Argumentativos: Estructura y Análisis', subject: 'Comprensión Lectora', date: '2025-08-26', duration: '1:22:10', instructor: 'Prof. Carlos Mendoza', views: 143, thumbnail: 'CL' },
  { id: 3, title: 'Redacción: Coherencia y Cohesión en el Texto', subject: 'Redacción Indirecta', date: '2025-08-24', duration: '1:35:45', instructor: 'Mtra. Patricia Luna', views: 112, thumbnail: 'RI' },
  { id: 4, title: 'Biología Celular: Membrana y Organelos', subject: 'Pre-medicina', date: '2025-08-22', duration: '2:10:00', instructor: 'Dr. Ramón Solis', views: 95, thumbnail: 'PM' },
  { id: 5, title: 'Probabilidad y Estadística Inferencial', subject: 'Pensamiento Matemático', date: '2025-08-20', duration: '1:55:20', instructor: 'Mtra. Sofía Ramírez', views: 201, thumbnail: 'PM' },
  { id: 6, title: 'Epidemiología y Salud Pública', subject: 'Ciencias de la Salud', date: '2025-08-18', duration: '1:40:15', instructor: 'Dr. Ramón Solis', views: 78, thumbnail: 'CS' },
];


export const mockExamQuestions = [
  {
    id: 1, subject: 'Pensamiento Matemático',
    question: 'Si f(x) = 3x² - 2x + 1, ¿cuál es el valor de f(2)?',
    options: ['9', '11', '13', '15'],
    correct: 1,
    explanation: 'f(2) = 3(4) - 2(2) + 1 = 12 - 4 + 1 = 9... Espera: 3(4)=12, 12-4=8, 8+1=9. Opción A.',
  },
  {
    id: 2, subject: 'Pensamiento Matemático',
    question: 'Resuelve: ∫(2x + 3)dx',
    options: ['x² + 3x + C', '2x² + 3x + C', 'x² + C', '2 + C'],
    correct: 0,
    explanation: 'La integral de 2x es x², y la integral de 3 es 3x, sumando la constante C.',
  },
  {
    id: 3, subject: 'Comprensión Lectora',
    question: '"El silencio pesaba como una losa sobre la habitación." Esta expresión es un ejemplo de:',
    options: ['Metáfora', 'Símil', 'Hipérbole', 'Metonimia'],
    correct: 0,
    explanation: 'Es una metáfora porque compara directamente el silencio con una losa sin usar "como" o "tal como".',
  },
  {
    id: 4, subject: 'Redacción Indirecta',
    question: '¿Cuál de los siguientes enunciados tiene un error de coherencia?',
    options: [
      'El perro ladra fuerte; además, es muy tranquilo.',
      'Estudié toda la noche y aprobé el examen.',
      'Hace frío afuera, así que llevaré un abrigo.',
      'La reunión fue productiva y llegamos a acuerdos.',
    ],
    correct: 0,
    explanation: 'El primer enunciado es incoherente porque afirma que el perro ladra fuerte (ruidoso) y al mismo tiempo es tranquilo.',
  },
  {
    id: 5, subject: 'Pre-medicina',
    question: '¿Cuál es la función principal de la mitocondria?',
    options: ['Síntesis de proteínas', 'Producción de ATP', 'Digestión celular', 'División celular'],
    correct: 1,
    explanation: 'La mitocondria es el organelo responsable de la producción de energía en forma de ATP mediante la respiración celular.',
  },
  {
    id: 6, subject: 'Pre-medicina',
    question: 'El ADN está compuesto por nucleótidos. ¿Cuál de las siguientes bases nitrogenadas es exclusiva del ARN?',
    options: ['Adenina', 'Guanina', 'Uracilo', 'Citosina'],
    correct: 2,
    explanation: 'El Uracilo (U) es exclusivo del ARN, mientras que el ADN utiliza Timina (T) en su lugar.',
  },
  {
    id: 7, subject: 'Pensamiento Matemático',
    question: 'Una recta tiene pendiente m = 3 y pasa por el punto (1, 2). ¿Cuál es su ecuación?',
    options: ['y = 3x - 1', 'y = 3x + 1', 'y = 3x - 2', 'y = 3x + 2'],
    correct: 0,
    explanation: 'Usando y - y₁ = m(x - x₁): y - 2 = 3(x - 1) → y = 3x - 3 + 2 → y = 3x - 1',
  },
  {
    id: 8, subject: 'Comprensión Lectora',
    question: 'Según el contexto, ¿qué tipo de texto presenta argumentos a favor y en contra de una posición?',
    options: ['Narrativo', 'Descriptivo', 'Argumentativo', 'Expositivo'],
    correct: 2,
    explanation: 'El texto argumentativo presenta tesis, argumentos a favor y en contra, y llega a una conclusión.',
  },
];


export const mockSessionsByModule = {
  1: [
    { id: '1-s1', label: 'Primera clase: Ecuaciones de primer grado', visible: true, videoIds: [1], resources: [
      { name: 'Álgebra: Sistemas de Ecuaciones', ext: 'PDF', size: '2.4 MB', type: 'pdf' },
      { name: 'Ejercicios de Funciones', ext: 'PDF', size: '1.8 MB', type: 'pdf' },
    ]},
    { id: '1-s2', label: 'Segunda clase: Geometría Analítica', visible: true, videoIds: [], resources: [
      { name: 'Geometría Analítica — Resumen', ext: 'PDF', size: '3.1 MB', type: 'pdf' },
      { name: 'Banco de Preguntas Mat. 2024', ext: 'Excel', size: '1.2 MB', type: 'xlsx' },
    ]},
    { id: '1-s3', label: 'Tercera clase: Estadística y Probabilidad', visible: true, videoIds: [5], resources: [
      { name: 'Presentación Estadística', ext: 'PPT', size: '5.6 MB', type: 'ppt' },
    ]},
  ],
  2: [
    { id: '2-s1', label: 'Primera clase: Estrategias de Lectura Veloz', visible: true, videoIds: [], resources: [
      { name: 'Estrategias de Lectura Veloz', ext: 'PDF', size: '1.5 MB', type: 'pdf' },
    ]},
    { id: '2-s2', label: 'Segunda clase: Textos Argumentativos', visible: true, videoIds: [2], resources: [
      { name: 'Textos para Práctica', ext: 'PDF', size: '4.2 MB', type: 'pdf' },
    ]},
    { id: '2-s3', label: 'Tercera clase: Tipos de Inferencia', visible: true, videoIds: [], resources: [
      { name: 'Tipos de Inferencia — Guía', ext: 'PDF', size: '0.9 MB', type: 'pdf' },
    ]},
  ],
  3: [
    { id: '3-s1', label: 'Primera clase: Ortografía y Reglas Base', visible: true, videoIds: [3], resources: [
      { name: 'Reglas Ortográficas Completas', ext: 'PDF', size: '2.0 MB', type: 'pdf' },
    ]},
    { id: '3-s2', label: 'Segunda clase: Puntuación Avanzada', visible: true, videoIds: [], resources: [
      { name: 'Ejercicios de Puntuación', ext: 'PDF', size: '1.1 MB', type: 'pdf' },
    ]},
  ],
  4: [
    { id: '4-s1', label: 'Primera clase: Biología Celular', visible: true, videoIds: [4], resources: [
      { name: 'Biología Celular — Atlas', ext: 'PDF', size: '8.3 MB', type: 'pdf' },
    ]},
    { id: '4-s2', label: 'Segunda clase: Anatomía Humana', visible: true, videoIds: [], resources: [
      { name: 'Anatomía Humana Básica', ext: 'PDF', size: '12.1 MB', type: 'pdf' },
    ]},
    { id: '4-s3', label: 'Tercera clase: Bioquímica y Metabolismo', visible: true, videoIds: [], resources: [
      { name: 'Bioquímica: Metabolismo', ext: 'PDF', size: '5.4 MB', type: 'pdf' },
      { name: 'Preguntas EXANI Biología', ext: 'Excel', size: '2.1 MB', type: 'xlsx' },
    ]},
  ],
  5: [
    { id: '5-s1', label: 'Primera clase: Epidemiología Básica', visible: true, videoIds: [], resources: [
      { name: 'Epidemiología Básica', ext: 'PDF', size: '3.2 MB', type: 'pdf' },
    ]},
    { id: '5-s2', label: 'Segunda clase: Salud Pública y Prevención', visible: true, videoIds: [6], resources: [
      { name: 'Salud Pública y Prevención', ext: 'PDF', size: '2.8 MB', type: 'pdf' },
    ]},
  ],
};

export const mockStats = {
  overview: {
    totalStudents: 312,
    activeStudents: 287,
    avgProgress: 61,
    avgScore: 78,
  },
  progressData: [
    { name: 'Sem 1', promedio: 45, maxScore: 92 },
    { name: 'Sem 2', promedio: 52, maxScore: 95 },
    { name: 'Sem 3', promedio: 58, maxScore: 88 },
    { name: 'Sem 4', promedio: 64, maxScore: 97 },
    { name: 'Sem 5', promedio: 71, maxScore: 98 },
    { name: 'Sem 6', promedio: 78, maxScore: 99 },
  ],
  subjectPerformance: [
    { subject: 'Pensamiento Mat.', avg: 74, students: 312 },
    { subject: 'Comprensión Lect.', avg: 81, students: 312 },
    { subject: 'Redacción Ind.', avg: 69, students: 312 },
    { subject: 'Pre-medicina', avg: 77, students: 156 },
    { subject: 'Ciencias Salud', avg: 72, students: 156 },
  ],
};
