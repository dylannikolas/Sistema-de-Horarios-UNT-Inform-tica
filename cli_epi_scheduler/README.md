# 🎓 Sistema de Horarios — Escuela de Informática 2026-2

Generador automático de horarios usando **Constraint Programming (OR-Tools CP-SAT)**.

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución

```bash
python main.py
```

## Estructura del proyecto

```
horario_2026_2/
├── main.py            # Menú principal (punto de entrada)
├── models.py          # Estructuras de datos
├── input_handler.py   # Recolección interactiva de datos (CLI)
├── solver.py          # Algoritmo CP-SAT (OR-Tools)
├── excel_export.py    # Generación de Excel (openpyxl)
├── version_manager.py # Guardado/carga de versiones (JSON)
├── requirements.txt
├── versions/          # Versiones guardadas automáticamente
└── outputs/           # Archivos Excel generados
```

## Flujo de trabajo

```
1. Registrar docentes
   └─ Nombre, rol (T/P / Lab / Ambos), disponibilidad por bloques de 2h

2. Registrar ciclos y cursos
   └─ Número del ciclo → cantidad de cursos → nombre de cada curso
      → ¿tiene laboratorio? → asignar docente de Teoría, Práctica, Lab

3. Solver CP-SAT resuelve la asignación respetando:
   ✔ Cada sesión ocupa exactamente 1 bloque (T/P) ó 2 consecutivos (Lab)
   ✔ Docentes solo asignados en su disponibilidad horaria
   ✔ Sin solapamiento de docentes (un docente en dos lugares a la vez)
   ✔ Sin solapamiento estudiantil (sección A no tiene dos clases a la vez)
   ✔ Laboratorio = 2 bloques consecutivos de 2h en el mismo día

4. Exportar a Excel
   └─ Una hoja por ciclo (Ciclo 2, Ciclo 4, …, Ciclo 10)
      Cada hoja muestra Sección A y Sección B
      con grilla semanal + tabla detalle de sesiones
```

## Horas por curso

| Tipo       | Horas | Bloques |
|------------|-------|---------|
| Teoría     | 2h    | 1 bloque de 2h |
| Práctica   | 2h    | 1 bloque de 2h |
| Laboratorio| 4h    | 2 bloques consecutivos de 2h |
| **Total**  | **8h**| |

> Cursos sin laboratorio tienen solo Teoría (2h) + Práctica (2h) = 4h

## Versiones

Cada horario generado se guarda como un archivo JSON en `versions/`.
Puedes:
- Reexportar cualquier versión a Excel
- Editar su descripción
- Eliminarla

## Bloques horarios disponibles

| Bloque | Horario |
|--------|---------|
| 1 | 07:00–09:00 |
| 2 | 09:00–11:00 |
| 3 | 11:00–13:00 |
| 4 | 13:00–15:00 |
| 5 | 15:00–17:00 |
| 6 | 17:00–19:00 |
| 7 | 19:00–21:00 |

Días disponibles: Lunes a Sábado
