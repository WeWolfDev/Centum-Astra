#!/usr/bin/env bash
# Concurrencia entre guardar una pregunta y empezar un intento (#104), con dos
# sesiones reales. pgTAP corre en una sola transacción y no puede probarlo.
#
# Solo contra la base LOCAL: confirma datos de prueba y los borra al final.
#   supabase start
#   bash scripts/probar-concurrencia-preguntas.sh
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
case "$DB_URL" in
  *127.0.0.1*|*localhost*) ;;
  *) echo "Solo corre contra la base local (DB_URL=$DB_URL)." >&2; exit 1 ;;
esac

sql() { psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -At "$@"; }

PROFE=c4000000-0000-0000-0000-000000000002
ALUMNO=c4000000-0000-0000-0000-000000000004
EVAL_A=c4500000-0000-0000-0000-000000000001 # el guardado llega primero
EVAL_B=c4500000-0000-0000-0000-000000000002 # el intento llega primero
PREG_A=c4600000-0000-0000-0000-000000000001
PREG_B=c4600000-0000-0000-0000-000000000002

limpiar() {
  sql <<SQL
delete from public.attempts where evaluation_id in ('$EVAL_A', '$EVAL_B');
delete from public.evaluations where id in ('$EVAL_A', '$EVAL_B');
delete from public.group_modules where group_id = 'c4200000-0000-0000-0000-000000000001';
delete from public.group_students where group_id = 'c4200000-0000-0000-0000-000000000001';
delete from public.group_teachers where group_id = 'c4200000-0000-0000-0000-000000000001';
delete from public.groups where id = 'c4200000-0000-0000-0000-000000000001';
delete from public.modules where id = 'c4300000-0000-0000-0000-000000000001';
delete from public.courses where id = 'c4100000-0000-0000-0000-000000000001';
delete from public.profiles where id in ('$PROFE', '$ALUMNO');
delete from auth.users where id in ('$PROFE', '$ALUMNO');
SQL
}
trap limpiar EXIT
limpiar

sql <<SQL
insert into auth.users (id, email) values ('$PROFE', 'conc-profe@test.mx'), ('$ALUMNO', 'conc-alumno@test.mx');
insert into public.profiles (id, email, full_name, role, status) values
  ('$PROFE', 'conc-profe@test.mx', 'Profe', 'teacher', 'active'),
  ('$ALUMNO', 'conc-alumno@test.mx', 'Alumno', 'student', 'active');
insert into public.courses (id, name) values ('c4100000-0000-0000-0000-000000000001', 'Curso concurrencia');
insert into public.groups (id, course_id, name, code)
  values ('c4200000-0000-0000-0000-000000000001', 'c4100000-0000-0000-0000-000000000001', 'Grupo concurrencia', 'CONC1');
insert into public.group_teachers (group_id, teacher_id) values ('c4200000-0000-0000-0000-000000000001', '$PROFE');
insert into public.group_students (group_id, student_id) values ('c4200000-0000-0000-0000-000000000001', '$ALUMNO');
insert into public.modules (id, course_id, title, position)
  values ('c4300000-0000-0000-0000-000000000001', 'c4100000-0000-0000-0000-000000000001', 'Módulo', 0);
insert into public.group_modules (group_id, module_id, course_id)
  values ('c4200000-0000-0000-0000-000000000001', 'c4300000-0000-0000-0000-000000000001', 'c4100000-0000-0000-0000-000000000001');
insert into public.evaluations (id, course_id, module_id, kind, title, created_by) values
  ('$EVAL_A', 'c4100000-0000-0000-0000-000000000001', 'c4300000-0000-0000-0000-000000000001', 'quiz', 'A', '$PROFE'),
  ('$EVAL_B', 'c4100000-0000-0000-0000-000000000001', 'c4300000-0000-0000-0000-000000000001', 'quiz', 'B', '$PROFE');
insert into public.questions (id, evaluation_id, position, prompt) values
  ('$PREG_A', '$EVAL_A', 0, 'Original'), ('$PREG_B', '$EVAL_B', 0, 'Original');
insert into public.question_options (question_id, position, body)
  select q, p, 'Opción ' || p from unnest(array['$PREG_A', '$PREG_B']::uuid[]) q, generate_series(0, 1) p;
insert into public.question_keys (question_id, correct_option_ids)
  select o.question_id, array[o.id] from public.question_options o
  where o.question_id in ('$PREG_A', '$PREG_B') and o.position = 0;
update public.evaluations set status = 'published' where id in ('$EVAL_A', '$EVAL_B');
SQL

como() { echo "set local role authenticated; select set_config('request.jwt.claims', '{\"sub\":\"$1\"}', true);"; }
guardar() { echo "select public.save_question('$1', '$2', 'Editada', array['Nueva 0', 'Nueva 1', 'Nueva 2'], array[2], null);"; }
falla=0

# ── A: el guardado llega primero y tarda; el alumno empieza en medio ─────────
sql -c "begin; $(como $PROFE) $(guardar $EVAL_A $PREG_A) select pg_sleep(2); commit;" >/dev/null &
guardado=$!
sleep 0.5
inicio=$(date +%s)
sql -c "begin; $(como $ALUMNO) select id from public.start_attempt('$EVAL_A'); commit;" >/dev/null
espera=$(( $(date +%s) - inicio ))
wait $guardado
opciones=$(sql -c "select count(*) from public.question_options where question_id = '$PREG_A'")
if [ "$espera" -ge 1 ] && [ "$opciones" = 3 ]; then
  echo "ok A: el intento esperó ${espera}s al guardado y la pregunta quedó completa (3 opciones)"
else
  echo "FALLA A: espera ${espera}s, opciones $opciones"; falla=1
fi

# ── B: el intento llega primero y tarda; el guardado llega en medio ──────────
sql -c "begin; $(como $ALUMNO) select id from public.start_attempt('$EVAL_B'); select pg_sleep(2); commit;" >/dev/null &
intento=$!
sleep 0.5
salida=$(sql -c "begin; $(como $PROFE) $(guardar $EVAL_B $PREG_B) commit;" 2>&1 || true)
wait $intento
prompt=$(sql -c "select prompt from public.questions where id = '$PREG_B'")
if echo "$salida" | grep -q "ya tiene intentos" && [ "$prompt" = Original ]; then
  echo "ok B: el guardado esperó al intento y falló con CA024; la pregunta no cambió"
else
  echo "FALLA B: salida '$salida', enunciado '$prompt'"; falla=1
fi

exit $falla
