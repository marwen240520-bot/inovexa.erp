// lib/sectorLabels.ts
// Vocabulaire des modules « Rendez-vous » et « Projets » selon le secteur d'activité de la société.
// Le même module s'appelle « Réservations » dans un restaurant, « Séances » dans un centre de formation,
// « Chantiers » dans le bâtiment : la barre latérale et les écrans parlent le langage du métier.
// Pas de "use client" : lisible partout.

type Lang = "fr" | "en" | "es" | "ar";
type Text = Record<Lang, string>;
const pick = (text: Text, lang: string): string => text[lang as Lang] ?? text.fr;

export interface AppointmentVocabulary {
  /** Nom du module dans le menu et en titre de page. */
  title: Text;
  /** Un élément, au singulier (« Nouveau … »). */
  one: Text;
  /** Ce qui est occupé par le créneau : praticien, table, salle, pont d'atelier… */
  resource: Text;
  /** Ce qui est prévu pendant le créneau. */
  service: Text;
  /** Nombre de personnes : renseigné seulement là où il a un sens (couverts, participants). */
  party: Text | null;
  /** La personne reçue. */
  client: Text;
  /** Féminin en français (« une réservation », « une séance ») : accorde « Nouvelle », « enregistrée »… */
  feminine: boolean;
}

const APPOINTMENTS: Record<string, AppointmentVocabulary> = {
  default: {
    title: { fr: "Rendez-vous", en: "Appointments", es: "Citas", ar: "المواعيد" },
    one: { fr: "rendez-vous", en: "appointment", es: "cita", ar: "موعد" },
    resource: { fr: "Collaborateur ou salle", en: "Staff member or room", es: "Colaborador o sala", ar: "الموظف أو القاعة" },
    service: { fr: "Objet du rendez-vous", en: "Purpose", es: "Motivo", ar: "موضوع الموعد" },
    party: null,
    client: { fr: "Client", en: "Customer", es: "Cliente", ar: "الحريف" },
    feminine: false,
  },
  healthcare: {
    title: { fr: "Rendez-vous", en: "Appointments", es: "Citas", ar: "المواعيد" },
    one: { fr: "rendez-vous", en: "appointment", es: "cita", ar: "موعد" },
    resource: { fr: "Praticien ou cabinet", en: "Practitioner or room", es: "Profesional o consulta", ar: "الطبيب أو العيادة" },
    service: { fr: "Motif de consultation", en: "Reason for visit", es: "Motivo de consulta", ar: "سبب الزيارة" },
    party: null,
    client: { fr: "Patient", en: "Patient", es: "Paciente", ar: "المريض" },
    feminine: false,
  },
  beauty: {
    title: { fr: "Rendez-vous", en: "Appointments", es: "Citas", ar: "المواعيد" },
    one: { fr: "rendez-vous", en: "appointment", es: "cita", ar: "موعد" },
    resource: { fr: "Coiffeuse, esthéticienne ou cabine", en: "Stylist, beautician or booth", es: "Estilista, esteticista o cabina", ar: "المصفّفة أو المختصّة أو الكابينة" },
    service: { fr: "Prestation", en: "Service", es: "Servicio", ar: "الخدمة" },
    party: null,
    client: { fr: "Client", en: "Customer", es: "Cliente", ar: "الحريف" },
    feminine: false,
  },
  automotive: {
    title: { fr: "Rendez-vous atelier", en: "Workshop bookings", es: "Citas de taller", ar: "مواعيد الورشة" },
    one: { fr: "rendez-vous", en: "booking", es: "cita", ar: "موعد" },
    resource: { fr: "Pont ou mécanicien", en: "Bay or mechanic", es: "Elevador o mecánico", ar: "الرافعة أو الميكانيكي" },
    service: { fr: "Intervention (véhicule, immatriculation)", en: "Job (vehicle, plate number)", es: "Intervención (vehículo, matrícula)", ar: "التدخّل (السيارة، رقم التسجيل)" },
    party: null,
    client: { fr: "Client", en: "Customer", es: "Cliente", ar: "الحريف" },
    feminine: false,
  },
  restaurant: {
    title: { fr: "Réservations", en: "Reservations", es: "Reservas", ar: "الحجوزات" },
    one: { fr: "réservation", en: "reservation", es: "reserva", ar: "حجز" },
    resource: { fr: "Table ou salle", en: "Table or room", es: "Mesa o sala", ar: "الطاولة أو القاعة" },
    service: { fr: "Occasion ou demande particulière", en: "Occasion or special request", es: "Ocasión o petición especial", ar: "المناسبة أو طلب خاص" },
    party: { fr: "Couverts", en: "Guests", es: "Comensales", ar: "عدد الأشخاص" },
    client: { fr: "Client", en: "Guest", es: "Cliente", ar: "الحريف" },
    feminine: true,
  },
  education: {
    title: { fr: "Séances et planning", en: "Sessions and schedule", es: "Sesiones y horario", ar: "الحصص والجدول" },
    one: { fr: "séance", en: "session", es: "sesión", ar: "حصة" },
    resource: { fr: "Salle ou formateur", en: "Room or trainer", es: "Aula o formador", ar: "القاعة أو المكوّن" },
    service: { fr: "Formation ou matière", en: "Course or subject", es: "Curso o materia", ar: "التكوين أو المادة" },
    party: { fr: "Participants", en: "Participants", es: "Participantes", ar: "المشاركون" },
    client: { fr: "Apprenant ou groupe", en: "Learner or group", es: "Alumno o grupo", ar: "المتعلّم أو المجموعة" },
    feminine: true,
  },
};

export interface ProjectVocabulary {
  title: Text;
  one: Text;
  location: Text;
  feminine: boolean;
}

const PROJECTS: Record<string, ProjectVocabulary> = {
  default: {
    title: { fr: "Projets", en: "Projects", es: "Proyectos", ar: "المشاريع" },
    one: { fr: "projet", en: "project", es: "proyecto", ar: "مشروع" },
    location: { fr: "Lieu", en: "Location", es: "Lugar", ar: "المكان" },
    feminine: false,
  },
  construction: {
    title: { fr: "Chantiers", en: "Job sites", es: "Obras", ar: "الحضائر" },
    one: { fr: "chantier", en: "job site", es: "obra", ar: "حضيرة" },
    location: { fr: "Adresse du chantier", en: "Site address", es: "Dirección de la obra", ar: "عنوان الحضيرة" },
    feminine: false,
  },
  services: {
    title: { fr: "Projets et missions", en: "Projects and assignments", es: "Proyectos y misiones", ar: "المشاريع والمهمّات" },
    one: { fr: "projet", en: "project", es: "proyecto", ar: "مشروع" },
    location: { fr: "Lieu de la mission", en: "Assignment location", es: "Lugar de la misión", ar: "مكان المهمّة" },
    feminine: false,
  },
};

export const appointmentWords = (sector?: string | null): AppointmentVocabulary => APPOINTMENTS[String(sector || "")] || APPOINTMENTS.default;
export const projectWords = (sector?: string | null): ProjectVocabulary => PROJECTS[String(sector || "")] || PROJECTS.default;

/** Nom d'un module dans la langue de l'interface, tel que le métier de la société l'appelle. */
export function moduleLabel(module: "appointments" | "projects", sector: string | null | undefined, lang: string): string {
  return pick(module === "appointments" ? appointmentWords(sector).title : projectWords(sector).title, lang);
}

export const word = pick;
