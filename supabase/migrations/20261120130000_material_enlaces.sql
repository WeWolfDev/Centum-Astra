-- Material con enlaces (#34): el maestro y el administrador agregan videos y
-- páginas a cada clase. Solo se aceptan enlaces http(s): un enlace javascript:
-- o data: ejecutaría código al abrirlo un alumno.
alter table public.materials
  add constraint materials_external_url_http
    check (external_url is null or external_url ~* '^https?://');
