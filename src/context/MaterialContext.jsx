// Contexto en memoria para lo que suben los maestros desde Material y
// MaestroQuizzes. No persiste al recargar (sin backend).
//
// Qué guarda:
//  - clasesExtraPorModulo:  { [moduleId]: Session[] }  (clases que agrega el maestro)
//  - pdfsExtraPorSesion:    { [sessionId]: Pdf[] }     (PDFs subidos a una clase)
//  - videosExtraPorSesion:  { [sessionId]: Video[] }   (videos subidos a una clase)
//  - videosDeVideoteca:     Video[]                    (videos marcados por el maestro
//                                                       para la Videoteca general)
//  - quizzesMaestro:        Quiz[]                     (cuestionarios del maestro)
import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const MaterialCtx = createContext(null);

function pushMap(prev, key, item) {
  return { ...prev, [key]: [...(prev[key] || []), item] };
}
function removeFromMap(prev, key, itemId) {
  const next = (prev[key] || []).filter(x => x.id !== itemId);
  return { ...prev, [key]: next };
}
function nuevoId(prefijo) {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MaterialProvider({ children }) {
  const [clasesExtraPorModulo, setClasesExtra] = useState({});
  const [pdfsExtraPorSesion, setPdfsExtra] = useState({});
  const [videosExtraPorSesion, setVideosExtra] = useState({});
  const [videosDeVideoteca, setVideotecaVideos] = useState([]);
  const [quizzesMaestro, setQuizzes] = useState([]);

  const agregarClase = useCallback((moduleId, label) => {
    const sesion = { id: nuevoId('clase'), label, resources: [], visible: true, nueva: true };
    setClasesExtra(prev => pushMap(prev, moduleId, sesion));
    return sesion;
  }, []);

  const agregarPdf = useCallback((sessionId, { name, size }) => {
    const pdf = { id: nuevoId('pdf'), name, size: size || null, type: 'pdf' };
    setPdfsExtra(prev => pushMap(prev, sessionId, pdf));
    return pdf;
  }, []);

  const agregarVideo = useCallback((sessionId, data, { enVideoteca = true, subject } = {}) => {
    const video = {
      id: nuevoId('video'),
      title: data.title,
      duration: data.duration || '',
      instructor: data.instructor || '',
      subject: subject || data.subject || '',
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      thumbnail: (data.title || '?').slice(0, 2).toUpperCase(),
      sessionId,
    };
    setVideosExtra(prev => pushMap(prev, sessionId, video));
    if (enVideoteca) {
      setVideotecaVideos(prev => [...prev, video]);
    }
    return video;
  }, []);

  const eliminarPdf = useCallback((sessionId, pdfId) => {
    setPdfsExtra(prev => removeFromMap(prev, sessionId, pdfId));
  }, []);

  const eliminarVideo = useCallback((sessionId, videoId) => {
    setVideosExtra(prev => removeFromMap(prev, sessionId, videoId));
    setVideotecaVideos(prev => prev.filter(v => v.id !== videoId));
  }, []);

  const agregarQuiz = useCallback((quiz) => {
    const nuevo = { id: nuevoId('quiz'), ...quiz, creadoEn: new Date().toISOString() };
    setQuizzes(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const eliminarQuiz = useCallback((quizId) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
  }, []);

  const value = useMemo(() => ({
    clasesExtraPorModulo,
    pdfsExtraPorSesion,
    videosExtraPorSesion,
    videosDeVideoteca,
    quizzesMaestro,
    agregarClase,
    agregarPdf,
    agregarVideo,
    eliminarPdf,
    eliminarVideo,
    agregarQuiz,
    eliminarQuiz,
  }), [
    clasesExtraPorModulo,
    pdfsExtraPorSesion,
    videosExtraPorSesion,
    videosDeVideoteca,
    quizzesMaestro,
    agregarClase,
    agregarPdf,
    agregarVideo,
    eliminarPdf,
    eliminarVideo,
    agregarQuiz,
    eliminarQuiz,
  ]);

  return <MaterialCtx.Provider value={value}>{children}</MaterialCtx.Provider>;
}

export function useMaterial() {
  const ctx = useContext(MaterialCtx);
  if (!ctx) throw new Error('useMaterial debe usarse dentro de <MaterialProvider>');
  return ctx;
}
