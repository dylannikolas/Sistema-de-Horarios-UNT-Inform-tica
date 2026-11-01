"""
models.py — Estructuras de datos del sistema de horarios EPI-UNT.
Incluye sistema de adjudicación de carga horaria por categoría docente.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict
from enum import Enum

DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
TIME_SLOTS = [
    "07:00-09:00", "09:00-11:00", "11:00-13:00",
    "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00",
]
NUM_DAYS, NUM_SLOTS = len(DAYS), len(TIME_SLOTS)

# ── Categorías docentes y horas reglamentarias ────────────────────────────────
class TeacherCategory(Enum):
    PRINCIPAL  = "Principal"    # Docente nombrado principal
    ASOCIADO   = "Asociado"     # Docente nombrado asociado
    AUXILIAR   = "Auxiliar"     # Docente nombrado auxiliar
    CONTRATADO = "Contratado"   # Docente contratado por horas

# Horas semanales OBLIGATORIAS por categoría (UNT reglamento)
CATEGORY_REQUIRED_HOURS: Dict[str, int] = {
    "Principal":  20,
    "Asociado":   18,
    "Auxiliar":   16,
    "Contratado": 12,
}

# Orden de prelación en el proceso de adjudicación
CATEGORY_SELECTION_ORDER = ["Principal", "Asociado", "Auxiliar", "Contratado"]

# ── Período académico ─────────────────────────────────────────────────────────
class AcademicPeriod(Enum):
    PAR        = "par"
    IMPAR      = "impar"
    NIVELACION = "nivelacion"

CYCLE_PARITY = {1:"impar",2:"par",3:"impar",4:"par",5:"impar",
                6:"par",7:"impar",8:"par",9:"impar",10:"par"}

PRIMARY_CYCLES = {
    AcademicPeriod.PAR:        [2,4,6,8,10],
    AcademicPeriod.IMPAR:      [1,3,5,7,9],
    AcademicPeriod.NIVELACION: list(range(1,11)),
}
REPEAT_CYCLES = {
    AcademicPeriod.PAR:        [1,3,5,7,9],
    AcademicPeriod.IMPAR:      [2,4,6,8,10],
    AcademicPeriod.NIVELACION: [],
}

# ── Malla curricular real UNT 2017 ────────────────────────────────────────────
# (codigo, nombre, tipo, HT, HP, HL, creditos, has_lab)
MALLA_REAL = {
    1:[("13024","Desarrollo personal",                          "EG",2,2,0,3,False),
       ("13029","Lectura crítica y redacción de textos acad.",  "EG",2,2,0,3,False),
       ("13027","Física general",                               "EG",2,4,0,4,False),
       ("13021","Algoritmos y programación",                    "ES",2,2,2,4,True),
       ("13023","Desarrollo del pensamiento lógico matemático", "EG",1,4,0,3,False),
       ("13028","Introducción al análisis matemático",          "EG",2,4,0,4,False),
       ("13031","Taller de liderazgo y trabajo en equipo",      "EG",0,2,0,1,False)],
    3:[("13629","Geometría analítica",                          "EE",2,4,0,4,False),
       ("13630","Paradigmas de lenguajes de programación",      "ES",2,2,2,4,True),
       ("13631","Estrategias algorítmicas",                     "ES",2,2,2,4,True),
       ("13632","Matemática discreta",                          "EE",2,4,0,4,False),
       ("13633","Física para ciencia de la computación",        "EE",2,0,2,3,True),
       ("13634","Análisis numérico",                            "EE",2,0,2,3,True)],
    5:[("13641","Base de datos I",                              "ES",2,2,2,4,True),
       ("13642","Ingeniería de software I",                     "ES",2,2,2,4,True),
       ("13643","Inteligencia artificial I",                    "ES",2,2,2,4,True),
       ("13644","Compiladores",                                 "ES",2,2,2,4,True),
       ("13645","Técnicas digitales para computación",          "ES",2,2,2,4,True),
       ("13646","Metodología de la investigación científica",   "ES",2,0,0,2,False)],
    7:[("14074","Base de datos avanzada",                       "ES",2,2,2,4,True),
       ("14075","Desarrollo de software",                       "ES",2,2,2,4,True),
       ("14076","Percepción y visión por computadora",          "ES",2,2,2,4,True),
       ("14077","Redes de computadoras I",                      "ES",2,2,2,4,True),
       ("14078","Sistemas operativos I",                        "ES",2,2,2,4,True),
       ("14079","Gestión de proyectos informáticos",            "ES",0,2,2,2,True)],
    9:[("14084","Interacción humano-computador",                "ES",2,2,2,4,True),
       ("14085","Tópicos en base de datos",                     "ES",2,2,2,4,True),
       ("INF34","Tópicos en ingeniería de software",            "ES",2,2,2,4,True),
       ("14087","Ingeniería de software avanzada",              "ES",2,2,2,4,True),
       ("14088","Seguridad informática",                        "ES",2,2,2,4,True),
       ("14089","Proyecto de tesis",                            "ES",1,2,0,2,False)],
    2:[("13040","Ética, convivencia humana y ciudadanía",       "EG",2,2,0,3,False),
       ("13043","Sociedad, cultura y ecología",                 "EG",1,4,0,3,False),
       ("13036","Cultura investigativa y pensamiento crítico",  "EG",2,2,0,3,False),
       ("13039","Estructura de datos",                          "ES",2,2,2,4,True),
       ("13038","Estadística general",                          "EG",2,4,0,4,False),
       ("13034","Análisis matemático",                          "EG",2,4,0,4,False),
       ("13046","Taller de manejo de TIC",                      "EG",0,2,0,1,False)],
    4:[("13635","Computación gráfica",                          "ES",2,2,2,4,True),
       ("13636","Organización de archivos",                     "ES",2,0,2,3,True),
       ("13637","Algoritmos y complejidad",                     "ES",2,2,2,4,True),
       ("13638","Lenguajes formales y autómatas",               "ES",2,2,2,4,True),
       ("13639","Electrónica para computación",                 "ES",2,2,2,4,True),
       ("13640","Innovación y emprendimiento",                  "ES",2,2,0,3,False)],
    6:[("14068","Computación gráfica avanzada",                 "ES",2,2,2,4,True),
       ("14069","Base de datos II",                             "ES",2,2,2,4,True),
       ("14070","Ingeniería de software II",                    "ES",2,2,2,4,True),
       ("14071","Inteligencia artificial II",                   "ES",0,2,2,2,True),
       ("14072","Comunicación de datos",                        "ES",2,2,2,4,True),
       ("14073","Arquitectura y org. de computadoras",          "ES",2,2,2,4,True)],
    8:[("14080","Robótica",                                     "ES",2,2,2,4,True),
       ("14081","Redes de computadoras II",                     "ES",2,2,2,4,True),
       ("14082","Sistemas operativos II",                       "ES",2,2,2,4,True),
       ("14083","Prácticas pre-profesionales",                  "ES",1,9,9,10,False)],
   10:[("14090","Tópicos en tecnologías inmersivas",            "ES",2,2,2,4,True),
       ("14091","Sistemas de información",                      "ES",2,0,2,3,True),
       ("14092","Ética para profesionales en informática",      "ES",2,2,0,3,False),
       ("14093","Proyecto de competencia",                      "ES",0,2,2,2,True),
       ("14094","Proyecto integrador",                          "ES",2,4,0,4,False),
       ("INF43","Tesis",                                        "ES",0,2,0,1,False)],
}

# ── Dataclasses ───────────────────────────────────────────────────────────────

@dataclass
class Teacher:
    """
    Docente con categoría, posición en lista de adjudicación y horas reglamentarias.

    Atributos clave:
        category       : Principal | Asociado | Auxiliar | Contratado
        orden          : posición dentro de su categoría (1 = primero en elegir)
        required_hours : horas semanales que DEBE cubrir exactamente
        assigned_hours : horas ya adjudicadas durante el proceso de selección
    """
    teacher_id: str
    name: str
    category: str = "Contratado"
    orden: int    = 999
    availability: List[Tuple[int,int]] = field(default_factory=list)
    required_hours: int = 0     # 0 → se calcula automáticamente desde la categoría
    assigned_hours: int = 0     # acumulador durante la adjudicación
    role: str = "ambos"

    def __post_init__(self):
        if self.required_hours == 0:
            self.required_hours = CATEGORY_REQUIRED_HOURS.get(self.category, 12)

    @property
    def remaining_hours(self) -> int:
        return self.required_hours - self.assigned_hours

    @property
    def hours_ok(self) -> bool:
        return self.assigned_hours == self.required_hours

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items()}

    @classmethod
    def from_dict(cls, d: dict) -> "Teacher":
        d["availability"] = [tuple(x) for x in d["availability"]]
        return cls(**d)


@dataclass
class CourseSession:
    """
    Una sesión de un curso (Teoría / Práctica / Lab) disponible para adjudicación.
    Se usa durante el proceso de selección de carga horaria.
    """
    course_id: str
    course_name: str
    cycle: int
    section: str        # "A" o "B"
    session_type: str   # "Teoría" | "Práctica" | "Laboratorio"
    hours: int          # 2h para T/P, 4h para Lab
    teacher_id: Optional[str] = None   # None = disponible

    @property
    def is_available(self) -> bool:
        return self.teacher_id is None

    @property
    def label(self) -> str:
        return f"{self.cycle}°{self.section} | {self.course_name} | {self.session_type} ({self.hours}h)"


@dataclass
class Course:
    course_id: str
    name: str
    cycle: int
    tipo: str = "ES"
    hours_theory: int   = 2
    hours_practice: int = 2
    hours_lab: int      = 0
    n_theory_blocks: int   = 1
    n_practice_blocks: int = 1
    has_lab: bool          = False
    requires_scheduling: bool = True
    credits: int = 4
    course_type: str = "regular"
    theory_teacher_id:   Optional[str] = None
    practice_teacher_id: Optional[str] = None
    lab_teacher_id:      Optional[str] = None

    def to_dict(self) -> dict:
        return self.__dict__.copy()

    @classmethod
    def from_dict(cls, d: dict) -> "Course":
        return cls(**d)

    @classmethod
    def from_malla(cls, ciclo: int, idx: int, row: tuple,
                   theory_tid=None, practice_tid=None,
                   lab_tid=None, course_type="regular") -> "Course":
        cod, nom, tipo, ht, hp, hl, cr, has_lab = row
        return cls(
            course_id=f"{cod}{idx}", name=nom, cycle=ciclo, tipo=tipo,
            hours_theory=ht, hours_practice=hp, hours_lab=hl,
            n_theory_blocks=max(0, (ht+1)//2),
            n_practice_blocks=max(0, (hp+1)//2),
            has_lab=has_lab,
            requires_scheduling=(cod != "14083"),
            credits=cr, course_type=course_type,
            theory_teacher_id=theory_tid,
            practice_teacher_id=practice_tid,
            lab_teacher_id=lab_tid,
        )


@dataclass
class SectionData:
    cycle: int
    section: str
    academic_period: str = "par"
    section_type: str    = "regular"
    courses: List[Course] = field(default_factory=list)

    @property
    def section_id(self) -> str:
        return f"{self.cycle}{self.section}"

    @property
    def schedulable_courses(self) -> List[Course]:
        return [c for c in self.courses if c.requires_scheduling]

    def to_dict(self) -> dict:
        return {"cycle": self.cycle, "section": self.section,
                "academic_period": self.academic_period,
                "section_type": self.section_type,
                "courses": [c.to_dict() for c in self.courses]}

    @classmethod
    def from_dict(cls, d: dict) -> "SectionData":
        return cls(cycle=d["cycle"], section=d["section"],
                   academic_period=d.get("academic_period","par"),
                   section_type=d.get("section_type","regular"),
                   courses=[Course.from_dict(c) for c in d["courses"]])


@dataclass
class ScheduledSession:
    course_name: str
    section_id: str
    session_type: str
    teacher_name: str
    day_idx: int
    slot_idx: int
    duration_slots: int = 1
    course_type: str = "regular"

    @property
    def day_name(self) -> str:
        return DAYS[self.day_idx]

    @property
    def time_str(self) -> str:
        s = TIME_SLOTS[self.slot_idx]
        if self.duration_slots == 2 and self.slot_idx + 1 < NUM_SLOTS:
            return s.split("-")[0] + "-" + TIME_SLOTS[self.slot_idx+1].split("-")[1]
        return s


@dataclass
class ScheduleResult:
    version_id: str
    description: str
    created_at: str
    academic_period: str = "par"
    sessions: List[ScheduledSession] = field(default_factory=list)
    status: str = "PENDIENTE"

    def get_section_sessions(self, sid: str) -> List[ScheduledSession]:
        return [s for s in self.sessions if s.section_id == sid]

    def get_cycle_sessions(self, cycle: int) -> List[ScheduledSession]:
        return [s for s in self.sessions if s.section_id.startswith(str(cycle))]


def category_rank_key(teacher: "Teacher"):
    """Clave de ordenamiento para el proceso de adjudicación."""
    rank = {cat: i for i, cat in enumerate(CATEGORY_SELECTION_ORDER)}
    return (rank.get(teacher.category, 99), teacher.orden)
