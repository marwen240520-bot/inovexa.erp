"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import Spinner from "@/components/ui/Spinner";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

// ==================== SVG ICONS ====================
const Icon = ({ children, size = 16, style = {} }: { children: React.ReactNode; size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconHome = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon>);
const IconDashboard = ({ size = 16 }: { size?: number }) => (<Icon size={size}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></Icon>);
const IconChat = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>);
const IconPredictions = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M2 20L12 4L22 20" /><path d="M6 14H18" /><path d="M12 8V14" /></Icon>);
const IconRecommendations = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><path d="M16 21.94A10 10 0 0 0 22 12" /></Icon>);
const IconAnalytics = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M21 12a9 9 0 1 1-9-9" /><path d="M12 3v9h9" /></Icon>);
const IconRobot = ({ size = 16 }: { size?: number }) => (<Icon size={size}><rect x="3" y="8" width="18" height="12" rx="3" /><path d="M9 11h.01M15 11h.01" /><path d="M9 15s1 1 3 1 3-1 3-1" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1" /><path d="M3 14h-1M22 14h-1" /></Icon>);
const IconRevenue = ({ size = 16 }: { size?: number }) => (<Icon size={size}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>);
const IconProfit = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Icon>);
const IconTrendingUp = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Icon>);
const IconTrendingDown = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></Icon>);
const IconUsers = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>);
const IconUser = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>);
const IconPackage = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Icon>);
const IconTrophy = ({ size = 16 }: { size?: number }) => (<Icon size={size}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></Icon>);
const IconStar = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>);
const IconWarning = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>);
const IconDanger = ({ size = 16 }: { size?: number }) => (<Icon size={size}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></Icon>);
const IconInfo = ({ size = 16 }: { size?: number }) => (<Icon size={size}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Icon>);
const IconCheckCircle = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>);
const IconSend = ({ size = 16 }: { size?: number }) => (<Icon size={size}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>);
const IconRefresh = ({ size = 16 }: { size?: number }) => (<Icon size={size}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" /><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" /></Icon>);
const IconArrowRight = ({ size = 12 }: { size?: number }) => (<Icon size={size}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>);
const IconShoppingCart = ({ size = 16 }: { size?: number }) => (<Icon size={size}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Icon>);
const IconSpinner = ({ size = 32, color = "#6366f1" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const IconZap = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>);
const IconCopy = ({ size = 16 }: { size?: number }) => (<Icon size={size}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>);
const IconTrash = ({ size = 16 }: { size?: number }) => (<Icon size={size}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>);
const IconMenu = ({ size = 24 }: { size?: number }) => (<Icon size={size}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>);
const IconX = ({ size = 24 }: { size?: number }) => (<Icon size={size}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>);

const animations = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
  @keyframes typing { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
  @keyframes glow { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 70% { box-shadow: 0 0 0 10px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }
  @media (max-width: 768px) {
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  }
`;

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoé", "Sep", "Oct", "Nov", "Déc"];

// TRADUCTIONS MULTILANGUES
const translations = {
  fr: {
    dashboard: "Tableau de bord", chat: "Chat IA", forecasts: "Prévisions", recommendations: "Recommandations", analytics: "Analyses",
    revenue: "Chiffre d'affaires", profit: "Bénéfice net", activeClients: "Clients actifs", products: "Produits",
    salesEvolution: "évolution des ventes", profitEvolution: "évolution du bénéfice", topProducts: "Top produits", topClients: "Top clients",
    forecastGrowth: "Croissance prévue", projectedRevenue: "CA projeté", projectedProfit: "Bénéfice projeté",
    instantAnswers: "Réponses instantanées", vsPrevShort: "vs préc.", vsPrevPeriod: "vs période précédente", nextMonthShort: "prochain mois", nextMonthLong: "pour le prochain mois", estimateShort: "estimation", estimateMargin: "estimation à 35% de marge", recommendedLabel: "Recommandé :", unitsWord: "unités", breakdownTitle: "Répartition", keyKpis: "KPIs clés",
    threeMonths: "3 mois", sixMonths: "6 mois", twelveMonths: "12 mois",
    optimistic: "Optimiste", realistic: "Réaliste", pessimistic: "Pessimiste",
    salesForecast: "Prévisions des ventes", lowStock: "produit(s) en stock faible", outOfStock: "produit(s) en rupture",
    pendingOrders: "commande(s) en attente", send: "Envoyer", newChat: "Nouveau chat", online: "En ligne",
    loading: "Chargement...", questionPlaceholder: "Posez votre question", refreshing: "Actualisation...",
    welcome: "Bonjour", whatCanIDo: "Ce que je peux faire", tryQuestions: "Essayez",
    askRevenue: "Quel est mon chiffre d'affaires ?", askSummary: "Résumé de mon activité",
    askTopProducts: "Top produits", askStock: "état du stock", askForecast: "Prévisions",
    viewStock: "Voir stock", restock: "Réapprovisionner", viewOrders: "Voir commandes",
    dashboardBtn: "Tableau de bord", aiAssistant: "Assistant IA", aiSubtitle: "Intelligence artificielle pour l'analyse et les prévisions",
    priorityHigh: "Haute priorité", priorityMedium: "Priorité moyenne", priorityLow: "Priorité faible",
    orderNow: "Commander maintenant", stockStatus: "état du stock", monthlyDemand: "Demande mensuelle",
    recommendedStock: "Stock recommandé", urgency: "Urgence", action: "Action",
    confidence: "Niveau de confiance", highConfidence: "Confiance élevée", mediumConfidence: "Confiance moyenne",
    upperBound: "Scénario optimiste", lowerBound: "Scénario pessimiste", roi: "Retour sur investissement",
    backToDashboard: "Retour au tableau de bord", quickActions: "Actions rapides", aiThoughts: "L'IA analyse vos données...",
    typeMessage: "Tapez votre message...", newMessage: "Nouveau message", copyConversation: "Copier la conversation",
    clearConversation: "Effacer la conversation", conversationCopied: "Conversation copiée !", conversationCleared: "Conversation effacée",
    typing: "en train d'écrire...", aiResponding: "L'IA répond...",
    suggestedQuestions: "Questions suggérées", askQuestion: "Poser une question", welcomeBack: "Bon retour",
    totalSales: "Ventes totales", averageTicket: "Ticket moyen", growthRate: "Taux de croissance",
    profitMargin: "Marge bénéficiaire", totalExpenses: "Dépenses totales", conversionRate: "Taux de conversion",
    inventoryTurnover: "Rotation stock", productivity: "Productivité par employé"
  },
  es: {
    dashboard: "Tablero", chat: "Chat IA", forecasts: "Previsiones", recommendations: "Recomendaciones", analytics: "Anélisis",
    revenue: "Ingresos", profit: "Beneficio neto", activeClients: "Clientes activos", products: "Productos",
    salesEvolution: "Evolucién de ventas", profitEvolution: "Evolucién del beneficio", topProducts: "Top productos", topClients: "Top clientes",
    forecastGrowth: "Crecimiento previsto", projectedRevenue: "Ingreso proyectado", projectedProfit: "Beneficio proyectado",
    instantAnswers: "Respuestas instantáneas", vsPrevShort: "vs ant.", vsPrevPeriod: "vs período anterior", nextMonthShort: "próximo mes", nextMonthLong: "para el próximo mes", estimateShort: "estimación", estimateMargin: "estimación con 35% de margen", recommendedLabel: "Recomendado:", unitsWord: "unidades", breakdownTitle: "Distribución", keyKpis: "KPIs clave",
    threeMonths: "3 meses", sixMonths: "6 meses", twelveMonths: "12 meses",
    optimistic: "Optimista", realistic: "Realista", pessimistic: "Pesimista",
    salesForecast: "Previsién de ventas", lowStock: "producto(s) con stock bajo", outOfStock: "producto(s) agotado(s)",
    pendingOrders: "pedido(s) pendiente(s)", send: "Enviar", newChat: "Nuevo chat", online: "En lénea",
    loading: "Cargando...", questionPlaceholder: "Haz tu pregunta", refreshing: "Actualizando...",
    welcome: "Hola", whatCanIDo: "Lo que puedo hacer", tryQuestions: "Prueba",
    askRevenue: "éCuél es mi facturacién?", askSummary: "Resumen de mi actividad",
    askTopProducts: "Top productos", askStock: "Estado del stock", askForecast: "Previsiones",
    viewStock: "Ver stock", restock: "Reabastecer", viewOrders: "Ver pedidos",
    dashboardBtn: "Tablero", aiAssistant: "Asistente IA", aiSubtitle: "Inteligencia artificial para anélisis y previsiones",
    priorityHigh: "Alta prioridad", priorityMedium: "Prioridad media", priorityLow: "Prioridad baja",
    orderNow: "Pedir ahora", stockStatus: "Estado del stock", monthlyDemand: "Demanda mensual",
    recommendedStock: "Stock recomendado", urgency: "Urgencia", action: "Accién",
    confidence: "Nivel de confianza", highConfidence: "Confianza alta", mediumConfidence: "Confianza media",
    upperBound: "Escenario optimista", lowerBound: "Escenario pesimista", roi: "Retorno de inversién",
    backToDashboard: "Volver al tablero", quickActions: "Acciones répidas", aiThoughts: "La IA analiza tus datos...",
    typeMessage: "Escribe tu mensaje...", newMessage: "Nuevo mensaje", copyConversation: "Copiar conversacién",
    clearConversation: "Borrar conversacién", conversationCopied: "éConversacién copiada!", conversationCleared: "Conversacién borrada",
    typing: "escribiendo...", aiResponding: "La IA responde...",
    suggestedQuestions: "Preguntas sugeridas", askQuestion: "Hacer pregunta", welcomeBack: "Bienvenido",
    totalSales: "Ventas totales", averageTicket: "Ticket promedio", growthRate: "Tasa de crecimiento",
    profitMargin: "Margen de beneficio", totalExpenses: "Gastos totales", conversionRate: "Tasa de conversién",
    inventoryTurnover: "Rotacién de stock", productivity: "Productividad por empleado"
  },
  en: {
    dashboard: "Dashboard", chat: "AI Chat", forecasts: "Forecasts", recommendations: "Recommendations", analytics: "Analytics",
    revenue: "Revenue", profit: "Net profit", activeClients: "Active clients", products: "Products",
    salesEvolution: "Sales evolution", profitEvolution: "Profit evolution", topProducts: "Top products", topClients: "Top clients",
    forecastGrowth: "Forecast growth", projectedRevenue: "Projected revenue", projectedProfit: "Projected profit",
    instantAnswers: "Instant answers", vsPrevShort: "vs prev.", vsPrevPeriod: "vs previous period", nextMonthShort: "next month", nextMonthLong: "for next month", estimateShort: "estimate", estimateMargin: "estimated at 35% margin", recommendedLabel: "Recommended:", unitsWord: "units", breakdownTitle: "Breakdown", keyKpis: "Key KPIs",
    threeMonths: "3 months", sixMonths: "6 months", twelveMonths: "12 months",
    optimistic: "Optimistic", realistic: "Realistic", pessimistic: "Pessimistic",
    salesForecast: "Sales forecast", lowStock: "low stock product(s)", outOfStock: "out of stock product(s)",
    pendingOrders: "pending order(s)", send: "Send", newChat: "New chat", online: "Online",
    loading: "Loading...", questionPlaceholder: "Ask your question", refreshing: "Refreshing...",
    welcome: "Hello", whatCanIDo: "What I can do", tryQuestions: "Try",
    askRevenue: "What is my revenue?", askSummary: "Summary of my activity",
    askTopProducts: "Top products", askStock: "Stock status", askForecast: "Forecasts",
    viewStock: "View stock", restock: "Restock", viewOrders: "View orders",
    dashboardBtn: "Dashboard", aiAssistant: "AI Assistant", aiSubtitle: "Artificial intelligence for analysis and forecasting",
    priorityHigh: "High priority", priorityMedium: "Medium priority", priorityLow: "Low priority",
    orderNow: "Order now", stockStatus: "Stock status", monthlyDemand: "Monthly demand",
    recommendedStock: "Recommended stock", urgency: "Urgency", action: "Action",
    confidence: "Confidence level", highConfidence: "High confidence", mediumConfidence: "Medium confidence",
    upperBound: "Optimistic scenario", lowerBound: "Pessimistic scenario", roi: "Return on investment",
    backToDashboard: "Back to dashboard", quickActions: "Quick actions", aiThoughts: "AI is analyzing your data...",
    typeMessage: "Type your message...", newMessage: "New message", copyConversation: "Copy conversation",
    clearConversation: "Clear conversation", conversationCopied: "Conversation copied!", conversationCleared: "Conversation cleared",
    typing: "typing...", aiResponding: "AI is responding...",
    suggestedQuestions: "Suggested questions", askQuestion: "Ask a question", welcomeBack: "Welcome back",
    totalSales: "Total sales", averageTicket: "Average ticket", growthRate: "Growth rate",
    profitMargin: "Profit margin", totalExpenses: "Total expenses", conversionRate: "Conversion rate",
    inventoryTurnover: "Inventory turnover", productivity: "Productivity per employee"
  }
};

export default function IAPage() {
  const router = useRouter();
  const { language, t: globalT } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  
  const t = translations[language as keyof typeof translations] || translations.fr;
  
  // Détection mobile améliorée
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    // Détection du clavier mobile
    const handleResize = () => {
      if (isMobile) {
        setKeyboardVisible(window.innerHeight < 500);
      }
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);
  
  // Styles responsifs optimisés
  const responsive = {
    contentPadding: isMobile ? "12px" : "20px",
    cardPadding: isMobile ? "12px" : "16px",
    cardRadius: isMobile ? "12px" : "12px",
    titleSize: isMobile ? "18px" : "22px",
    subtitleSize: "11px",
    kpiValueSize: isMobile ? "16px" : "24px",
    kpiLabelSize: isMobile ? "9px" : "10px",
    gapSmall: isMobile ? "8px" : "12px",
    gapMedium: isMobile ? "12px" : "16px",
    gapLarge: isMobile ? "16px" : "24px"
  };
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any>(null); // brut multi-modules pour le contexte RAG
  const [alerts, setAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [animateCards, setAnimateCards] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [forecastPeriod, setForecastPeriod] = useState("6months");
  const [loadingAI, setLoadingAI] = useState(false);
  const [historicalSales, setHistoricalSales] = useState<number[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<"optimistic" | "realistic" | "pessimistic">("realistic");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea pour mobile
  useEffect(() => {
    if (textareaRef.current && isMobile) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [chatInput, isMobile]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) router.push("/auth/login");
    if (userData) setCurrentUser(JSON.parse(userData));
    fetchAllData();
    refreshIntervalRef.current = setInterval(() => refreshData(), 300000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatMessages, streamingContent, isTyping]);

  useEffect(() => {
    setTimeout(() => setAnimateCards(true), 100);
  }, [stats]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    try {
      const [sales, purchases, products, clients, orders, invoices, employees] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/sales`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/purchases`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/products`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/clients`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/invoices`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/employees`)
      ]);

      // Conserver le brut de chaque module pour le contexte RAG du chat IA
      setRawData({ sales, purchases, products, clients, orders, invoices, employees });

      const totalRevenue = sales.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
      const totalExpenses = purchases.reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0);
      const lowStockCount = products.filter((p: any) => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
      const outOfStockCount = products.filter((p: any) => (p.quantity || 0) === 0).length;
      const totalProductsValue = products.reduce((sum: number, p: any) => sum + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0);
      const activeClients = clients.filter((c: any) => c.status === "active").length;
      const pendingOrders = orders.filter((o: any) => o.status === "pending").length;

      setStats({
        sales: { revenue: totalRevenue, total: sales.length, average: sales.length > 0 ? totalRevenue / sales.length : 0 },
        purchases: { spent: totalExpenses, total: purchases.length },
        products: { total: products.length, lowStock: lowStockCount, outOfStock: outOfStockCount, totalValue: totalProductsValue },
        clients: { total: clients.length, active: activeClients },
        orders: { total: orders.length, pending: pendingOrders },
        employees: { total: employees.length }
      });

      const newAlerts: { type: string; icon: ({ size }: { size?: number }) => JSX.Element; message: string; action: { label: string; path: string } }[] = [];
      if (lowStockCount > 0) newAlerts.push({ type: "warning", icon: IconWarning, message: `${lowStockCount} ${t.lowStock}`, action: { label: t.viewStock, path: "/dashboard/stock" } });
      if (outOfStockCount > 0) newAlerts.push({ type: "danger", icon: IconDanger, message: `${outOfStockCount} ${t.outOfStock}`, action: { label: t.restock, path: "/dashboard/purchases" } });
      if (pendingOrders > 0) newAlerts.push({ type: "info", icon: IconInfo, message: `${pendingOrders} ${t.pendingOrders}`, action: { label: t.viewOrders, path: "/dashboard/orders" } });
      setAlerts(newAlerts);

      const monthlySales = Array(12).fill(0);
      const monthlyProfit = Array(12).fill(0);
      sales.forEach((s: any) => {
        if (s.createdAt) {
          const m = new Date(s.createdAt).getMonth();
          monthlySales[m] += Number(s.total) || 0;
          monthlyProfit[m] += Number(s.total) || 0;
        }
      });
      purchases.forEach((p: any) => {
        if (p.createdAt) {
          const m = new Date(p.createdAt).getMonth();
          monthlyProfit[m] -= Number(p.total) || 0;
        }
      });

      setSalesData(MONTHS.map((m, i) => ({ month: m, sales: monthlySales[i] })));
      setProfitData(MONTHS.map((m, i) => ({ month: m, profit: monthlyProfit[i] })));
      setHistoricalSales(monthlySales);

      const productSales: Record<string, number> = {};
      sales.forEach((s: any) => {
        const name = s.productName || s.product;
        if (name) productSales[name] = (productSales[name] || 0) + (Number(s.total) || 0);
      });
      const topProductsList = Object.entries(productSales).map(([name, amount]) => ({ name, amount, sales: Math.round(amount / 100), growth: 0 })).sort((a, b) => b.amount - a.amount).slice(0, 5);
      setTopProducts(topProductsList);

      const clientSales: Record<string, number> = {};
      sales.forEach((s: any) => { if (s.clientName) clientSales[s.clientName] = (clientSales[s.clientName] || 0) + (Number(s.total) || 0); });
      const topClientsList = Object.entries(clientSales).map(([name, amount]) => ({ name, amount, orders: Math.round(amount / 5000), growth: 0 })).sort((a, b) => b.amount - a.amount).slice(0, 5);
      setTopClients(topClientsList);

      const dynamicRecs = products.filter((p: any) => (p.quantity || 0) < 30).map((p: any) => ({
        productName: p.name,
        currentStock: p.quantity || 0,
        monthlyDemand: Math.max(5, Math.round((sales.filter((s: any) => (s.productName === p.name || s.product === p.name)).reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) / 3) || 5)),
        recommendedStock: Math.max(30, Math.round((p.quantity || 0) * 1.5)),
        urgency: (p.quantity || 0) < 5 ? "high" : (p.quantity || 0) < 15 ? "medium" : "low"
      })).sort((a: any, b: any) => (({ high: 0, medium: 1, low: 2 } as Record<string, number>)[a.urgency as string] ?? 0) - (({ high: 0, medium: 1, low: 2 } as Record<string, number>)[b.urgency as string] ?? 0)).slice(0, 10);
      setRecommendations(dynamicRecs);

      const nonZeroSales = monthlySales.filter(v => v > 0);
      const avgMonthly = nonZeroSales.length ? nonZeroSales.reduce((a, b) => a + b, 0) / nonZeroSales.length : 0;
      const last3Months = monthlySales.slice(-3).filter(v => v > 0);
      const trend = last3Months.length >= 2 ? ((last3Months[last3Months.length - 1] - last3Months[0]) / last3Months[0]) * 100 : 0;
      const volatility = Math.abs(trend) / 2;
      
      setPredictions({
        revenueForecast: { 
          growthRate: Math.max(-15, Math.min(35, trend)).toFixed(1), 
          confidence: Math.min(95, Math.max(65, 85 - volatility)).toFixed(0),
          trend: trend > 5 ? "up" : trend < -5 ? "down" : "stable",
          avgMonthly: avgMonthly
        },
        roi: (trend * 1.2).toFixed(1),
        ebitda: (totalRevenue * 0.25).toFixed(0)
      });

      if (chatMessages.length === 0) {
        setChatMessages([{ role: "assistant", content: getWelcomeMessage(), timestamp: new Date(), actions: getWelcomeActions() }]);
      }

    } catch (error) {
      console.error("Erreur fetch:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeActions = () => {
    return [
      { label: t.askRevenue, icon: IconRevenue, query: t.askRevenue },
      { label: t.askSummary, icon: IconDashboard, query: t.askSummary },
      { label: t.askTopProducts, icon: IconTrophy, query: t.askTopProducts },
      { label: t.askStock, icon: IconPackage, query: t.askStock },
      { label: t.askForecast, icon: IconPredictions, query: t.askForecast }
    ];
  };

  const getForecastData = () => {
    const multiplier = { optimistic: 1.25, realistic: 1.0, pessimistic: 0.85 }[selectedScenario];
    let monthsToForecast = 6;
    if (forecastPeriod === "3months") monthsToForecast = 3;
    else if (forecastPeriod === "6months") monthsToForecast = 6;
    else if (forecastPeriod === "12months") monthsToForecast = 12;
    
    const lastValues = historicalSales.filter(v => v > 0).slice(-3);
    const baseValue = lastValues.length ? lastValues.reduce((a, b) => a + b, 0) / lastValues.length : (predictions?.revenueForecast?.avgMonthly || 0);
    const growthRate = Number(predictions?.revenueForecast?.growthRate || 0) / 100;
    
    let forecast: number[] = [];
    let current = baseValue;
    
    for (let i = 0; i < monthsToForecast; i++) {
      const monthlyGrowth = growthRate * multiplier * (1 + (i * 0.03));
      current = current * (1 + monthlyGrowth);
      forecast.push(Math.round(current));
    }
    return forecast;
  };

  const getForecastLabels = () => {
    const monthsToForecast = forecastPeriod === "3months" ? 3 : forecastPeriod === "6months" ? 6 : 12;
    const labels: string[] = [];
    for (let i = 1; i <= monthsToForecast; i++) labels.push("M+" + i);
    return labels;
  };

  const getUpperBoundData = () => getForecastData().map(v => Math.round(v * 1.12));
  const getLowerBoundData = () => getForecastData().map(v => Math.round(v * 0.88));

  // ────────────────────────────────────────────────────────────────
  //  Contexte RAG : instantané multi-modules envoyé au modèle
  // ────────────────────────────────────────────────────────────────
  const buildErpContext = () => {
    const r = rawData || {};
    const n = (v: any) => Number(v) || 0;
    const cap = (arr: any, k: number) => (Array.isArray(arr) ? arr.slice(0, k) : []);
    const last = (arr: any, k: number) => (Array.isArray(arr) ? arr.slice(-k).reverse() : []);

    return {
      generatedAt: new Date().toISOString(),
      currency: "DT (TND)",
      stats,
      predictions,
      topProducts,
      topClients,
      recommendations,
      alerts: (alerts || []).map((a: any) => ({ type: a.type, message: a.message })),
      lowStock: (r.products || [])
        .filter((p: any) => n(p.quantity) > 0 && n(p.quantity) < 10)
        .map((p: any) => ({ name: p.name, quantity: n(p.quantity) }))
        .slice(0, 50),
      outOfStock: (r.products || [])
        .filter((p: any) => n(p.quantity) === 0)
        .map((p: any) => ({ name: p.name }))
        .slice(0, 50),
      counts: {
        products: (r.products || []).length,
        clients: (r.clients || []).length,
        sales: (r.sales || []).length,
        orders: (r.orders || []).length,
        invoices: (r.invoices || []).length,
        purchases: (r.purchases || []).length,
        employees: (r.employees || []).length,
      },
      samples: {
        products: cap(r.products, 120).map((p: any) => ({
          name: p.name,
          category: p.category ?? p.categoryName ?? null,
          price: n(p.price),
          quantity: n(p.quantity),
          ref: p.sku ?? p.reference ?? null,
        })),
        recentSales: last(r.sales, 60).map((s: any) => ({
          date: s.createdAt ?? s.date ?? null,
          client: s.clientName ?? null,
          product: s.productName ?? s.product ?? null,
          qty: n(s.quantity),
          total: n(s.total),
        })),
        clients: cap(r.clients, 80).map((c: any) => ({
          name: c.name,
          status: c.status ?? null,
          email: c.email ?? null,
          phone: c.phone ?? null,
        })),
        orders: last(r.orders, 60).map((o: any) => ({
          ref: o.reference ?? o.id ?? null,
          client: o.clientName ?? null,
          status: o.status ?? null,
          total: n(o.total),
          date: o.createdAt ?? null,
        })),
        invoices: last(r.invoices, 60).map((iv: any) => ({
          ref: iv.reference ?? iv.number ?? iv.id ?? null,
          client: iv.clientName ?? null,
          status: iv.status ?? null,
          total: n(iv.total),
          dueDate: iv.dueDate ?? null,
          date: iv.createdAt ?? null,
        })),
        purchases: last(r.purchases, 40).map((p: any) => ({
          supplier: p.supplierName ?? p.supplier ?? null,
          total: n(p.total),
          date: p.createdAt ?? null,
        })),
        employees: cap(r.employees, 40).map((e: any) => ({
          name: e.name ?? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
          role: e.role ?? e.position ?? null,
          department: e.department ?? null,
        })),
      },
      note: "Les listes 'samples' sont tronquees ; 'counts' donne les totaux reels.",
    };
  };

  // Animation d'ecriture mot-a-mot (reutilisee par l'IA et par le repli local)
  const streamAssistant = (response: string, actions: any[]) => {
    setIsTyping(false);
    setIsStreaming(true);
    setStreamingContent("");
    let fullResponse = "";
    const words = response.split(/(\s+)/);
    let index = 0;
    const interval = setInterval(() => {
      if (index < words.length) {
        fullResponse += words[index];
        setStreamingContent(fullResponse);
        index++;
      } else {
        clearInterval(interval);
        setChatMessages(prev => [...prev, { role: "assistant", content: fullResponse, timestamp: new Date(), actions }]);
        setLoadingAI(false);
        setIsStreaming(false);
        setStreamingContent("");
      }
    }, isMobile ? 20 : 15);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || loadingAI) return;
    const userMessage = chatInput;

    // Historique (incluant le nouveau message) normalise pour l'API.
    const history = [...chatMessages, { role: "user", content: userMessage }]
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role, content: String(m.content || "") }))
      .slice(-12);

    setChatMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setChatInput("");
    setLoadingAI(true);
    setIsTyping(true);

    const actions = getContextualActions(userMessage);

    // 1) Vrai assistant IA (route serveur + contexte RAG). 2) Repli local si indispo.
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, context: buildErpContext(), messages: history }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data?.text || "").trim();
        if (text) {
          streamAssistant(text, actions);
          return;
        }
      }
      // 503 (cle absente), reponse vide, etc. -> repli local ci-dessous.
    } catch {
      // Erreur reseau -> repli local.
    }

    // Repli hors-ligne : matcher par mots-cles existant.
    streamAssistant(generateAIResponse(userMessage), actions);
  };

  const generateAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    const revenue = stats?.sales?.revenue || 0;
    const profit = revenue - (stats?.purchases?.spent || 0);
    const growth = predictions?.revenueForecast?.growthRate || 0;
    const confidence = predictions?.revenueForecast?.confidence || 0;
    const forecastData = getForecastData();
    const roi = predictions?.roi || 0;
    const ebitda = predictions?.ebitda || 0;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

    const rd = rawData || {};
    const arr = (x: any): any[] => (Array.isArray(x) ? x : []);
    const money = (v: any) => formatCurrency(Number(v) || 0);
    const firstName = currentUser?.name?.split(' ')[0] || "";
    const nm = firstName ? " " + firstName : "";

    // Dictionnaire de réponses — fr / en / es (phrases hors étiquettes `t`).
    const AI_L: Record<string, any> = {
      fr: {
        colon: " :",
        assistant: "Assistant Inovexa",
        greet: (n: string) => `Bonjour${n} ! Je peux analyser **tous vos modules** : ventes, bénéfices, stock, produits, clients, commandes, factures, achats, fournisseurs, RH et prévisions.`,
        greetTry: `Essayez : « résumé de mon activité », « état du stock », « factures impayées », « top clients » ou « prévisions ».`,
        aiAnalysis: "Analyse", total: "Total",
        revTier: ["Croissance exceptionnelle, félicitations !", "Bonne dynamique commerciale.", "Croissance à surveiller de près."],
        ebitdaEst: "EBITDA estimé",
        profitTier: ["Marge excellente, continuez ainsi !", "Bonne marge — pensez à optimiser vos coûts.", "Marge à améliorer : analysez vos dépenses."],
        report: "RAPPORT D'ACTIVITÉ",
        finances: "Finances", clientsH: "Clients", productsH: "Produits", ordersH: "Commandes", forecastH: "Prévisions",
        catalog: "Catalogue", stockValue: "Valeur du stock", recommendation: "Recommandation",
        summaryTier: ["Capitalisez sur cette dynamique !", "Optimisez vos processus pour accélérer la croissance."],
        ca: "CA", salesUnits: "Ventes", units: "unités",
        coreBiz: "Ces produits sont le cœur de votre activité. Concentrez vos efforts marketing sur ces références !",
        purchasesL: "Achats", ordersL: "Commandes",
        loyalty: "Mettez en place un programme de fidélité premium pour ces clients stratégiques !",
        overview: "Vue d'ensemble", outOfStock: "Ruptures", totalValue: "Valeur totale",
        restockUrgent: "RÉAPPROVISIONNEMENTS PRIORITAIRES", demand: "demande", perMonth: "mois",
        restockAction: (n: number) => `Action recommandée : réapprovisionnez ${n} produit(s) en priorité.`,
        stockOk: "Aucune urgence — niveau de stock sain.", stockBravo: "Votre gestion des stocks est optimale.",
        trends: "Tendances détectées", estimated: "estimé", ebitdaProj: "EBITDA projeté",
        monthlyProj: "Projections mensuelles", strategicAdvice: "Conseil stratégique",
        forecastTier: ["Anticipez la forte croissance : renforcez vos stocks et votre équipe commerciale.", "Croissance modérée en vue : maintenez vos investissements.", "Soyez prudent sur les investissements et optimisez vos coûts."],
        guide: "GUIDE D'UTILISATION", possibleQ: "Questions possibles", askRoi: "Quel est mon ROI ?", askPerf: "Performance globale",
        quickActions: "Actions rapides", qa: ["Analyse des ventes", "Suivi du stock", "Prévisions financières", "Recommandations produits"],
        tip: "Astuce : plus votre question est précise, plus la réponse est pertinente.",
        ordersLog: "Commandes & logistique", pending: "En attente", cumValue: "Valeur cumulée", byStatus: "Par statut",
        orderAction: (n: number) => `Action : ${n} commande(s) à traiter.`, noPending: "Aucune commande en attente.",
        invoices: "Factures", noInvoices: "Aucune facture dans les données chargées. Consultez le module Factures.",
        amount: "Montant total", unpaid: "Impayées / en attente",
        invAction: (n: number) => `Action : relancez ${n} facture(s) impayée(s).`, allPaid: "Toutes les factures sont réglées.",
        purchasesSuppliers: "Achats & fournisseurs", spent: "Total dépensé", purchaseCount: "Nombre d'achats", distinctSuppliers: "Fournisseurs distincts",
        seePurchases: "Consultez le module Achats pour le détail.",
        hr: "Ressources humaines", headcount: "Effectif", payroll: "Masse salariale (mensuelle)", seeHr: "Consultez le module RH pour la gestion des employés.",
        categories: "Catégories", distinctCats: "Catégories distinctes", distribution: "Répartition (produits)", noCat: "Sans catégorie",
        clients: "Clients", active: "Actifs", askTopClients: "Demandez « top clients » pour vos meilleurs clients.",
        quickOverview: "Aperçu rapide de votre activité", productsWord: "produits", outWord: "en rupture", pendingOrders: "Commandes en attente",
        coverAll: "Je couvre **tous les modules**. Demandez : ventes, bénéfices, stock, produits, clients, commandes, factures, achats, fournisseurs, RH, catégories ou prévisions.",
      },
      en: {
        colon: ":",
        assistant: "Inovexa Assistant",
        greet: (n: string) => `Hi${n}! I can analyze **all your modules**: sales, profit, stock, products, clients, orders, invoices, purchases, suppliers, HR and forecasts.`,
        greetTry: `Try: "summary of my activity", "stock status", "unpaid invoices", "top clients" or "forecasts".`,
        aiAnalysis: "Analysis", total: "Total",
        revTier: ["Outstanding growth — well done!", "Solid commercial momentum.", "Growth to watch closely."],
        ebitdaEst: "Estimated EBITDA",
        profitTier: ["Excellent margin, keep it up!", "Good margin — consider optimizing your costs.", "Margin to improve: review your expenses."],
        report: "ACTIVITY REPORT",
        finances: "Finances", clientsH: "Clients", productsH: "Products", ordersH: "Orders", forecastH: "Forecasts",
        catalog: "Catalog", stockValue: "Stock value", recommendation: "Recommendation",
        summaryTier: ["Capitalize on this momentum!", "Streamline your processes to accelerate growth."],
        ca: "Revenue", salesUnits: "Sales", units: "units",
        coreBiz: "These products are the core of your business. Focus your marketing on them!",
        purchasesL: "Purchases", ordersL: "Orders",
        loyalty: "Set up a premium loyalty program for these strategic clients!",
        overview: "Overview", outOfStock: "Out of stock", totalValue: "Total value",
        restockUrgent: "RESTOCK PRIORITIES", demand: "demand", perMonth: "mo",
        restockAction: (n: number) => `Recommended action: restock ${n} product(s) as a priority.`,
        stockOk: "No urgency — stock level is healthy.", stockBravo: "Your inventory management is on point.",
        trends: "Detected trends", estimated: "est.", ebitdaProj: "Projected EBITDA",
        monthlyProj: "Monthly projections", strategicAdvice: "Strategic advice",
        forecastTier: ["Plan for strong growth: build up stock and reinforce your sales team.", "Moderate growth ahead: keep your investments steady.", "Be cautious with investments and optimize your costs."],
        guide: "USER GUIDE", possibleQ: "Things you can ask", askRoi: "What is my ROI?", askPerf: "Overall performance",
        quickActions: "Quick actions", qa: ["Sales analysis", "Stock tracking", "Financial forecasts", "Product recommendations"],
        tip: "Tip: the more specific your question, the more relevant the answer.",
        ordersLog: "Orders & logistics", pending: "Pending", cumValue: "Cumulative value", byStatus: "By status",
        orderAction: (n: number) => `Action: ${n} order(s) to process.`, noPending: "No pending orders.",
        invoices: "Invoices", noInvoices: "No invoices in the loaded data. Check the Invoices module.",
        amount: "Total amount", unpaid: "Unpaid / pending",
        invAction: (n: number) => `Action: follow up on ${n} unpaid invoice(s).`, allPaid: "All invoices are settled.",
        purchasesSuppliers: "Purchases & suppliers", spent: "Total spent", purchaseCount: "Number of purchases", distinctSuppliers: "Distinct suppliers",
        seePurchases: "See the Purchases module for details.",
        hr: "Human resources", headcount: "Headcount", payroll: "Payroll (monthly)", seeHr: "See the HR module to manage employees.",
        categories: "Categories", distinctCats: "Distinct categories", distribution: "Breakdown (products)", noCat: "Uncategorized",
        clients: "Clients", active: "Active", askTopClients: `Ask "top clients" for your best customers.`,
        quickOverview: "Quick overview of your activity", productsWord: "products", outWord: "out of stock", pendingOrders: "Pending orders",
        coverAll: "I cover **all modules**. Ask about: sales, profit, stock, products, clients, orders, invoices, purchases, suppliers, HR, categories or forecasts.",
      },
      es: {
        colon: ":",
        assistant: "Asistente Inovexa",
        greet: (n: string) => `¡Hola${n}! Puedo analizar **todos tus módulos**: ventas, beneficios, stock, productos, clientes, pedidos, facturas, compras, proveedores, RR. HH. y previsiones.`,
        greetTry: `Prueba: "resumen de mi actividad", "estado del stock", "facturas impagadas", "mejores clientes" o "previsiones".`,
        aiAnalysis: "Análisis", total: "Total",
        revTier: ["¡Crecimiento excepcional, enhorabuena!", "Buena dinámica comercial.", "Crecimiento a vigilar de cerca."],
        ebitdaEst: "EBITDA estimado",
        profitTier: ["¡Margen excelente, sigue así!", "Buen margen — conviene optimizar tus costes.", "Margen a mejorar: revisa tus gastos."],
        report: "INFORME DE ACTIVIDAD",
        finances: "Finanzas", clientsH: "Clientes", productsH: "Productos", ordersH: "Pedidos", forecastH: "Previsiones",
        catalog: "Catálogo", stockValue: "Valor del stock", recommendation: "Recomendación",
        summaryTier: ["¡Aprovecha esta dinámica!", "Optimiza tus procesos para acelerar el crecimiento."],
        ca: "Ingresos", salesUnits: "Ventas", units: "uds.",
        coreBiz: "Estos productos son el núcleo de tu negocio. ¡Concentra tu marketing en ellos!",
        purchasesL: "Compras", ordersL: "Pedidos",
        loyalty: "¡Implanta un programa de fidelización premium para estos clientes estratégicos!",
        overview: "Visión general", outOfStock: "Sin stock", totalValue: "Valor total",
        restockUrgent: "REPOSICIONES PRIORITARIAS", demand: "demanda", perMonth: "mes",
        restockAction: (n: number) => `Acción recomendada: repón ${n} producto(s) con prioridad.`,
        stockOk: "Sin urgencias — nivel de stock saludable.", stockBravo: "Tu gestión de inventario es óptima.",
        trends: "Tendencias detectadas", estimated: "est.", ebitdaProj: "EBITDA proyectado",
        monthlyProj: "Proyecciones mensuales", strategicAdvice: "Consejo estratégico",
        forecastTier: ["Prepárate para un fuerte crecimiento: aumenta el stock y refuerza tu equipo comercial.", "Crecimiento moderado a la vista: mantén tus inversiones.", "Sé prudente con las inversiones y optimiza tus costes."],
        guide: "GUÍA DE USO", possibleQ: "Preguntas posibles", askRoi: "¿Cuál es mi ROI?", askPerf: "Rendimiento global",
        quickActions: "Acciones rápidas", qa: ["Análisis de ventas", "Seguimiento del stock", "Previsiones financieras", "Recomendaciones de productos"],
        tip: "Consejo: cuanto más concreta sea tu pregunta, más relevante será la respuesta.",
        ordersLog: "Pedidos y logística", pending: "Pendientes", cumValue: "Valor acumulado", byStatus: "Por estado",
        orderAction: (n: number) => `Acción: ${n} pedido(s) por procesar.`, noPending: "No hay pedidos pendientes.",
        invoices: "Facturas", noInvoices: "No hay facturas en los datos cargados. Consulta el módulo Facturas.",
        amount: "Importe total", unpaid: "Impagadas / pendientes",
        invAction: (n: number) => `Acción: reclama ${n} factura(s) impagada(s).`, allPaid: "Todas las facturas están saldadas.",
        purchasesSuppliers: "Compras y proveedores", spent: "Total gastado", purchaseCount: "Número de compras", distinctSuppliers: "Proveedores distintos",
        seePurchases: "Consulta el módulo Compras para el detalle.",
        hr: "Recursos humanos", headcount: "Plantilla", payroll: "Masa salarial (mensual)", seeHr: "Consulta el módulo RR. HH. para gestionar los empleados.",
        categories: "Categorías", distinctCats: "Categorías distintas", distribution: "Distribución (productos)", noCat: "Sin categoría",
        clients: "Clientes", active: "Activos", askTopClients: `Pide "mejores clientes" para tus mejores clientes.`,
        quickOverview: "Resumen rápido de tu actividad", productsWord: "productos", outWord: "sin stock", pendingOrders: "Pedidos pendientes",
        coverAll: "Cubro **todos los módulos**. Pregunta por: ventas, beneficios, stock, productos, clientes, pedidos, facturas, compras, proveedores, RR. HH., categorías o previsiones.",
      },
    };
    const L = AI_L[language] || AI_L.fr;

    // ── Salutations ──
    if (q.match(/\b(hi|hello|hey|yo|bonjour|bjr|salut|slt|coucou|cc|hola|buenas|salam|salem|ahla)\b/)) {
      return `**${L.assistant}**\n\n${L.greet(nm)}\n\n${L.greetTry}`;
    }

    // ── Chiffre d'affaires ──
    if (q.match(/vente|chiffre|\bca\b|revenue|recette|ventas|ingresos|sales/)) {
      const tier = Number(growth) > 15 ? L.revTier[0] : Number(growth) > 8 ? L.revTier[1] : L.revTier[2];
      return `**${t.revenue}**\n\n` +
             `• **${L.total}${L.colon}** ${money(revenue)}\n` +
             `• **${t.growthRate}${L.colon}** +${growth}%\n` +
             `• **${t.totalSales}${L.colon}** ${stats?.sales?.total || 0}\n` +
             `• **${t.averageTicket}${L.colon}** ${money(stats?.sales?.average || 0)}\n\n` +
             `**${L.aiAnalysis}${L.colon}** ${tier}`;
    }

    // ── Bénéfice ──
    if (q.match(/bénéfice|benefice|profit|beneficio|ganancia|marge|margen/)) {
      const tier = Number(margin) > 25 ? L.profitTier[0] : Number(margin) > 15 ? L.profitTier[1] : L.profitTier[2];
      return `**${t.profit}**\n\n` +
             `• **${t.profit}${L.colon}** ${money(profit)}\n` +
             `• **${t.profitMargin}${L.colon}** ${margin}%\n` +
             `• **${t.revenue}${L.colon}** ${money(revenue)}\n` +
             `• **${t.totalExpenses}${L.colon}** ${money(stats?.purchases?.spent || 0)}\n` +
             `• **${L.ebitdaEst}${L.colon}** ${money(Number(ebitda))}\n\n` +
             `**${L.aiAnalysis}${L.colon}** ${tier}`;
    }

    // ── Résumé / rapport ──
    if (q.match(/résumé|resume|synthése|synthese|bilan|rapport|summary|resumen/)) {
      const tier = Number(growth) > 10 ? L.summaryTier[0] : L.summaryTier[1];
      const conv = stats?.clients?.total > 0 ? Math.round((stats?.clients?.active || 0) / (stats?.clients?.total || 1) * 100) : 0;
      const turn = stats?.products?.totalValue > 0 ? (revenue / (stats?.products?.totalValue || 1)).toFixed(1) : 0;
      return `**${L.report}**\n\n` +
             `**${L.finances}**\n` +
             `• ${t.revenue}${L.colon} ${money(revenue)}\n` +
             `• ${t.profit}${L.colon} ${money(profit)}\n` +
             `• ${t.profitMargin}${L.colon} ${margin}%\n` +
             `• ${t.growthRate}${L.colon} +${growth}%\n\n` +
             `**${L.clientsH}**\n` +
             `• ${L.total}${L.colon} ${stats?.clients?.total || 0}\n` +
             `• ${t.activeClients}${L.colon} ${stats?.clients?.active || 0}\n` +
             `• ${t.conversionRate}${L.colon} ${conv}%\n\n` +
             `**${L.productsH}**\n` +
             `• ${L.catalog}${L.colon} ${stats?.products?.total || 0} ${t.products}\n` +
             `• ${t.lowStock}${L.colon} ${stats?.products?.lowStock || 0}\n` +
             `• ${L.stockValue}${L.colon} ${money(stats?.products?.totalValue || 0)}\n` +
             `• ${t.inventoryTurnover}${L.colon} ${turn}x\n\n` +
             `**${L.ordersH}**\n` +
             `• ${t.pendingOrders}${L.colon} ${stats?.orders?.pending || 0}\n\n` +
             `**${L.forecastH}**\n` +
             `• ${t.projectedRevenue} M+1${L.colon} ${money(forecastData[0] || 0)}\n` +
             `• ${t.growthRate}${L.colon} +${growth}%\n` +
             `• ${t.confidence}${L.colon} ${confidence}%\n\n` +
             `**${L.recommendation}${L.colon}** ${tier}`;
    }

    // ── Top produits ──
    if (q.match(/top produits|meilleurs produits|top products|best products|best sellers|top productos|mejores productos/)) {
      let out = `**${t.topProducts}**\n\n`;
      topProducts.slice(0, 4).forEach((p, i) => {
        out += `${i + 1}. **${p.name}**\n   • ${L.ca}${L.colon} ${money(p.amount)}\n   • ${L.salesUnits}${L.colon} ${p.sales} ${L.units}\n\n`;
      });
      out += `**${L.aiAnalysis}${L.colon}** ${L.coreBiz}`;
      return out;
    }

    // ── Top clients ──
    if (q.match(/top clients|meilleurs clients|best customers|top clientes|mejores clientes/)) {
      let out = `**${t.topClients}**\n\n`;
      topClients.slice(0, 4).forEach((c, i) => {
        out += `${i + 1}. **${c.name}**\n   • ${L.purchasesL}${L.colon} ${money(c.amount)}\n   • ${L.ordersL}${L.colon} ${c.orders}\n\n`;
      });
      out += `**${L.recommendation}${L.colon}** ${L.loyalty}`;
      return out;
    }

    // ── Stock ──
    if (q.match(/stock|inventaire|inventory|inventario|estado del stock/)) {
      const urgent = recommendations.filter(r => r.urgency === "high").slice(0, 3);
      const turn = stats?.products?.totalValue > 0 ? (revenue / (stats?.products?.totalValue || 1)).toFixed(1) : 0;
      let out = `**${t.stockStatus}**\n\n**${L.overview}**\n` +
                `• ${t.products}${L.colon} ${stats?.products?.total || 0}\n` +
                `• ${t.lowStock}${L.colon} ${stats?.products?.lowStock || 0}\n` +
                `• ${L.outOfStock}${L.colon} ${stats?.products?.outOfStock || 0}\n` +
                `• ${L.totalValue}${L.colon} ${money(stats?.products?.totalValue || 0)}\n` +
                `• ${t.inventoryTurnover}${L.colon} ${turn}x\n\n`;
      if (urgent.length) {
        out += `**${L.restockUrgent}**\n`;
        urgent.forEach(it => { out += `• **${it.productName}**${L.colon} ${it.currentStock} ${L.units} (${L.demand}${L.colon} ${it.monthlyDemand}/${L.perMonth})\n`; });
        out += `\n**${L.restockAction(urgent.length)}**`;
      } else {
        out += `${L.stockOk}\n\n**${L.stockBravo}**`;
      }
      return out;
    }

    // ── Prévisions ──
    if (q.match(/prévision|prevision|forecast|tendance|prediction|previsiones|predicci[oó]n/)) {
      const advice = Number(growth) > 15 ? L.forecastTier[0] : Number(growth) > 5 ? L.forecastTier[1] : L.forecastTier[2];
      return `**${t.salesForecast}**\n\n**${L.trends}**\n` +
             `• ${t.growthRate}${L.colon} +${growth}%\n` +
             `• ${t.roi} ${L.estimated}${L.colon} ${roi}%\n` +
             `• ${L.ebitdaProj}${L.colon} ${money(Number(ebitda))}\n\n` +
             `**${L.monthlyProj}**\n` +
             `• M+1${L.colon} ${money(forecastData[0] || 0)}\n` +
             `• M+2${L.colon} ${money(forecastData[1] || 0)}\n` +
             `• M+3${L.colon} ${money(forecastData[2] || 0)}\n\n` +
             `**${t.confidence}**\n` +
             `• ${t.confidence}${L.colon} ${confidence}%\n` +
             `• ${Number(confidence) > 85 ? t.highConfidence : t.mediumConfidence}\n\n` +
             `**${L.strategicAdvice}${L.colon}** ${advice}`;
    }

    // ── Aide / guide ──
    if (q.match(/aide|help|ayuda|que faire|guide|gu[ií]a|que puis-je/)) {
      return `**${L.guide}**\n\n**${L.possibleQ}**\n` +
             `• "${t.askRevenue}"\n` +
             `• "${t.askSummary}"\n` +
             `• "${t.askTopProducts}"\n` +
             `• "${t.askStock}"\n` +
             `• "${t.askForecast}"\n` +
             `• "${L.askRoi}"\n` +
             `• "${L.askPerf}"\n\n` +
             `**${L.quickActions}**\n` +
             `• ${L.qa[0]}\n• ${L.qa[1]}\n• ${L.qa[2]}\n• ${L.qa[3]}\n\n` +
             `**${L.tip}**`;
    }

    // ── Commandes & logistique ──
    if (q.match(/commande|order\b|orders|pedido|livraison|logistique|logistics|log[ií]stica|exp[ée]dition|shipment|transport/)) {
      const orders = arr(rd.orders);
      const totalOrders = stats?.orders?.total || orders.length || 0;
      const pending = stats?.orders?.pending ?? orders.filter((o: any) => o.status === "pending").length;
      const totalVal = orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
      const byStatus: Record<string, number> = {};
      orders.forEach((o: any) => { const st = o.status || "—"; byStatus[st] = (byStatus[st] || 0) + 1; });
      let out = `**${L.ordersLog}**\n\n• ${L.total}${L.colon} ${totalOrders}\n• ${L.pending}${L.colon} ${pending}\n` + (totalVal ? `• ${L.cumValue}${L.colon} ${money(totalVal)}\n` : "");
      const keys = Object.keys(byStatus);
      if (keys.length) { out += `\n**${L.byStatus}${L.colon}**\n`; keys.slice(0, 6).forEach(k => { out += `• ${k}${L.colon} ${byStatus[k]}\n`; }); }
      out += `\n${pending > 0 ? `**${L.orderAction(pending)}**` : L.noPending}`;
      return out;
    }

    // ── Factures ──
    if (q.match(/facture|invoice|factura|impay|unpaid|impagad|paiement|payment|pago/)) {
      const inv = arr(rd.invoices);
      if (!inv.length) return `**${L.invoices}**\n\n${L.noInvoices}`;
      const total = inv.reduce((s: number, iv: any) => s + (Number(iv.total) || 0), 0);
      const unpaid = inv.filter((iv: any) => /unpaid|impay|impagad|pending|attente|overdue|retard/i.test(String(iv.status || "")));
      const unpaidVal = unpaid.reduce((s: number, iv: any) => s + (Number(iv.total) || 0), 0);
      return `**${L.invoices}**\n\n• ${L.total}${L.colon} ${inv.length}\n• ${L.amount}${L.colon} ${money(total)}\n• ${L.unpaid}${L.colon} ${unpaid.length}${unpaidVal ? ` (${money(unpaidVal)})` : ""}\n\n${unpaid.length ? `**${L.invAction(unpaid.length)}**` : L.allPaid}`;
    }

    // ── Achats & fournisseurs ──
    if (q.match(/fournisseur|supplier|proveedor|achat|purchase|compra|approvision/)) {
      const pur = arr(rd.purchases);
      const spent = stats?.purchases?.spent || pur.reduce((s: number, p: any) => s + (Number(p.total) || 0), 0);
      const suppliers = new Set(pur.map((p: any) => p.supplierName || p.supplier).filter(Boolean));
      return `**${L.purchasesSuppliers}**\n\n• ${L.spent}${L.colon} ${money(spent)}\n• ${L.purchaseCount}${L.colon} ${stats?.purchases?.total || pur.length || 0}\n• ${L.distinctSuppliers}${L.colon} ${suppliers.size}\n\n${L.seePurchases}`;
    }

    // ── Ressources humaines ──
    if (q.match(/employ|salari|personnel|\bstaff\b|\brh\b|\bhr\b|ressources humaines|recursos humanos|empleado/)) {
      const emp = arr(rd.employees);
      const total = stats?.employees?.total || emp.length || 0;
      const pr = emp.reduce((s: number, e: any) => s + (Number(e.salary) || 0), 0);
      return `**${L.hr}**\n\n• ${L.headcount}${L.colon} ${total}\n` + (pr ? `• ${L.payroll}${L.colon} ${money(pr)}\n` : "") + `\n${L.seeHr}`;
    }

    // ── Catégories ──
    if (q.match(/cat[ée]gorie|category|categories|categor[ií]a|rayon/)) {
      const prods = arr(rd.products);
      const byCat: Record<string, number> = {};
      prods.forEach((p: any) => { const c = p.category || p.categoryName || L.noCat; byCat[c] = (byCat[c] || 0) + 1; });
      const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
      let out = `**${L.categories}**\n\n• ${L.distinctCats}${L.colon} ${cats.length}\n`;
      if (cats.length) { out += `\n**${L.distribution}${L.colon}**\n`; cats.slice(0, 8).forEach(([c, num]) => { out += `• ${c}${L.colon} ${num}\n`; }); }
      return out;
    }

    // ── Clients (vue générale) ──
    if (q.match(/client|cliente|customer/)) {
      const totalC = stats?.clients?.total || 0;
      const activeC = stats?.clients?.active || 0;
      const rate = totalC > 0 ? Math.round((activeC / totalC) * 100) : 0;
      return `**${L.clients}**\n\n• ${L.total}${L.colon} ${totalC}\n• ${L.active}${L.colon} ${activeC} (${rate}%)\n\n${L.askTopClients}`;
    }

    // ── Défaut : aperçu utile (jamais « pas compris ») ──
    return `**${L.assistant}**\n\n${L.quickOverview}${L.colon}\n` +
           `• ${t.revenue}${L.colon} ${money(revenue)}\n` +
           `• ${t.profit}${L.colon} ${money(profit)}\n` +
           `• ${L.clientsH}${L.colon} ${stats?.clients?.total || 0} (${stats?.clients?.active || 0} ${String(L.active).toLowerCase()})\n` +
           `• Stock${L.colon} ${stats?.products?.total || 0} ${L.productsWord}, ${stats?.products?.outOfStock || 0} ${L.outWord}\n` +
           `• ${L.pendingOrders}${L.colon} ${stats?.orders?.pending || 0}\n\n` +
           `${L.coverAll}`;
  };

  const getContextualActions = (question: string) => {
    const q = question.toLowerCase();
    const actions: { label: string; icon: ({ size }: { size?: number }) => JSX.Element; path: string }[] = [];
    if (q.match(/produit|stock|inventaire|producto/)) actions.push({ label: t.viewStock, icon: IconPackage, path: "/dashboard/stock" });
    if (q.match(/client|cliente/)) actions.push({ label: "Voir clients", icon: IconUsers, path: "/dashboard/clients" });
    if (q.match(/commande|pedido|order/)) actions.push({ label: t.viewOrders, icon: IconShoppingCart, path: "/dashboard/orders" });
    if (q.match(/facture|invoice|impay/)) actions.push({ label: "Voir factures", icon: IconShoppingCart, path: "/dashboard/invoices" });
    if (q.match(/fournisseur|supplier|achat|purchase/)) actions.push({ label: "Voir achats", icon: IconShoppingCart, path: "/dashboard/purchases" });
    if (q.match(/employ|salari|\brh\b|personnel/)) actions.push({ label: "Voir RH", icon: IconUsers, path: "/dashboard/hr" });
    if (q.match(/logistique|logistics|livraison|transport/)) actions.push({ label: "Logistique", icon: IconShoppingCart, path: "/dashboard/logistics" });
    if (q.match(/prévision|forecast|tendance|prevision/)) actions.push({ label: "Voir prévisions", icon: IconPredictions, path: "/dashboard/ai?tab=forecasts" });
    if (q.match(/vente|ca|chiffre|ventas|ingresos/)) actions.push({ label: t.dashboardBtn, icon: IconDashboard, path: "/dashboard" });
    if (actions.length === 0) actions.push({ label: t.dashboardBtn, icon: IconDashboard, path: "/dashboard" });
    return actions.slice(0, 4);
  };

  const getWelcomeMessage = () => {
    const firstName = (currentUser?.name?.split(' ')[0] || "").trim();
    const hour = new Date().getHours();
    const W: Record<string, any> = {
      fr: {
        excl: " !", morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir",
        can: ["Analyser vos ventes et bénéfices", "Vérifier l'état de votre stock", "Identifier vos meilleurs clients et produits", "Générer des prévisions précises", "Vous donner un résumé complet"],
        help: "Comment puis-je vous aider aujourd'hui ?",
      },
      en: {
        excl: "!", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening",
        can: ["Analyze your sales and profit", "Check your stock status", "Identify your best clients and products", "Generate accurate forecasts", "Give you a full summary"],
        help: "How can I help you today?",
      },
      es: {
        excl: "!", morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches",
        can: ["Analizar tus ventas y beneficios", "Comprobar el estado del stock", "Identificar tus mejores clientes y productos", "Generar previsiones precisas", "Darte un resumen completo"],
        help: "¿En qué puedo ayudarte hoy?",
      },
    };
    const w = W[language] || W.fr;
    const greeting = hour < 12 ? w.morning : hour < 18 ? w.afternoon : w.evening;
    const hello = firstName ? `${greeting} ${firstName}` : greeting;
    const can: string[] = isMobile ? w.can.slice(0, 4) : w.can;

    return `${hello}${w.excl}\n\n` +
           ` **${t.aiAssistant}**\n\n` +
           ` **${t.whatCanIDo}${w.excl === " !" ? " :" : ":"}**\n` +
           can.map((c: string) => `• ${c}`).join("\n") + `\n\n` +
           ` **${t.tryQuestions}${w.excl === " !" ? " :" : ":"}**\n` +
           `• "${t.askRevenue}"\n` +
           `• "${t.askSummary}"\n` +
           `• "${t.askTopProducts}"\n` +
           `• "${t.askStock}"\n` +
           (isMobile ? "" : `• "${t.askForecast}"\n`) +
           `\n${w.help}`;
  };

  const copyConversation = () => {
    const conversation = chatMessages.map(msg => `${msg.role === "user" ? " " + (language === 'fr' ? "Vous" : language === 'es' ? "Té" : "You") : " IA"}: ${msg.content}`).join("\n\n");
    navigator.clipboard.writeText(conversation);
    if (isMobile) {
      const toast = document.createElement('div');
      toast.textContent = t.conversationCopied;
      toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${theme.primary};color:white;padding:8px 16px;border-radius:20px;font-size:12px;z-index:10000;animation:fadeInUp 0.3s ease`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } else {
      alert(t.conversationCopied);
    }
  };

  const clearConversation = () => {
    if (confirm(language === 'fr' ? "Effacer toute la conversation ?" : language === 'es' ? "éBorrar toda la conversacién?" : "Clear entire conversation?")) {
      setChatMessages([{ role: "assistant", content: getWelcomeMessage(), timestamp: new Date(), actions: getWelcomeActions() }]);
      if (isMobile) {
        const toast = document.createElement('div');
        toast.textContent = t.conversationCleared;
        toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${theme.primary};color:white;padding:8px 16px;border-radius:20px;font-size:12px;z-index:10000;animation:fadeInUp 0.3s ease`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      } else {
        alert(t.conversationCleared);
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        labels: { 
          color: theme.textSecondary, 
          font: { size: isMobile ? 8 : 9 },
          boxWidth: isMobile ? 8 : 10
        },
        position: isMobile ? "bottom" as const : "top" as const
      },
      tooltip: { 
        backgroundColor: theme.surface, 
        titleColor: theme.text, 
        bodyColor: theme.textSecondary, 
        callbacks: { 
          label: (ctx: any) => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.raw || 0)}` 
        },
        bodyFont: { size: isMobile ? 10 : 12 },
        titleFont: { size: isMobile ? 11 : 13 }
      }
    },
    scales: { 
      y: { 
        ticks: { 
          color: theme.textSecondary, 
          callback: (value: any) => isMobile ? formatCurrency(value).substring(0, 5) : formatCurrency(value),
          font: { size: isMobile ? 8 : 10 }
        }, 
        grid: { color: theme.border }, 
        beginAtZero: true 
      }, 
      x: { 
        ticks: { 
          color: theme.textSecondary, 
          font: { size: isMobile ? 8 : 10 },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0
        }, 
        grid: { color: theme.border } 
      } 
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: isMobile ? 2 : 3,
        hoverRadius: isMobile ? 4 : 5
      }
    }
  };

  const salesChartData = { labels: salesData.map(d => d.month), datasets: [{ label: t.salesEvolution, data: salesData.map(d => d.sales), backgroundColor: `${theme.primary}20`, borderColor: theme.primary, borderWidth: isMobile ? 1.5 : 2, fill: true, tension: 0.3 }] };
  const profitChartData = { labels: profitData.map(d => d.month), datasets: [{ label: t.profitEvolution, data: profitData.map(d => d.profit), backgroundColor: `${theme.accent}20`, borderColor: theme.accent, borderWidth: isMobile ? 1.5 : 2, fill: true, tension: 0.3 }] };
  const topProductsChartData = { labels: topProducts.map(p => p.name.length > (isMobile ? 8 : 12) ? p.name.substring(0, isMobile ? 6 : 10) + "..." : p.name), datasets: [{ label: t.revenue, data: topProducts.map(p => p.amount), backgroundColor: ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"], borderRadius: isMobile ? 6 : 8 }] };
  const topClientsChartData = { labels: topClients.map(c => c.name.length > (isMobile ? 8 : 12) ? c.name.substring(0, isMobile ? 6 : 10) + "..." : c.name), datasets: [{ label: t.revenue, data: topClients.map(c => c.amount), backgroundColor: ["#10b981", "#f59e0b", "#667eea", "#8b5cf6", "#ef4444"], borderRadius: isMobile ? 6 : 8 }] };
  const forecastChartData = { 
    labels: getForecastLabels(), 
    datasets: [
      { label: t.upperBound, data: getUpperBoundData(), borderColor: "rgba(16,185,129,0.4)", backgroundColor: "rgba(16,185,129,0.05)", borderWidth: 1.5, fill: "+1", tension: 0.3, pointRadius: 0 },
      { label: t.salesForecast + " (" + (language === 'fr' ? "Réaliste" : language === 'es' ? "Realista" : "Realistic") + ")", data: getForecastData(), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.25)", borderWidth: isMobile ? 2 : 2.5, fill: true, tension: 0.3, pointBackgroundColor: "#f59e0b", pointRadius: isMobile ? 2 : 5, pointHoverRadius: isMobile ? 4 : 7 },
      { label: t.lowerBound, data: getLowerBoundData(), borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.05)", borderWidth: 1.5, fill: false, tension: 0.3, pointRadius: 0 }
    ] 
  };

  const kpiCards = [
    { Icon: IconRevenue, label: t.revenue, value: formatCurrency(stats?.sales?.revenue || 0), color: theme.accent, growth: predictions?.revenueForecast?.growthRate || 0 },
    { Icon: IconProfit, label: t.profit, value: formatCurrency((stats?.sales?.revenue || 0) - (stats?.purchases?.spent || 0)), color: "#f59e0b", growth: predictions?.roi || 0 },
    { Icon: IconUsers, label: t.activeClients, value: stats?.clients?.active || 0, color: theme.primary, growth: 0 },
    { Icon: IconPackage, label: t.products, value: stats?.products?.total || 0, color: "#10b981", growth: 0 }
  ];

  const tabs = [
    { id: "dashboard", label: t.dashboard, Icon: IconDashboard },
    { id: "chat", label: t.chat, Icon: IconChat },
    { id: "forecasts", label: t.forecasts, Icon: IconPredictions },
    { id: "recommendations", label: t.recommendations, Icon: IconRecommendations },
    { id: "analytics", label: t.analytics, Icon: IconAnalytics }
  ];

  const quickSuggestions = [
    { Icon: IconRevenue, text: t.revenue, query: t.askRevenue, color: theme.accent },
    { Icon: IconDashboard, text: t.askSummary, query: t.askSummary, color: theme.primary },
    { Icon: IconTrophy, text: t.topProducts, query: t.askTopProducts, color: "#f59e0b" },
    { Icon: IconStar, text: t.topClients, query: "Top clients", color: "#8b5cf6" },
    { Icon: IconPackage, text: t.stockStatus, query: t.askStock, color: "#10b981" },
    { Icon: IconPredictions, text: t.forecasts, query: t.askForecast, color: "#ec489a" }
  ];

  const mobileQuickSuggestions = quickSuggestions.slice(0, 4);

  // FIX: Loading state with sidebar
  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex", 
      overflowX: "hidden",
      padding: 0,
      margin: 0
    }}>
      <style>{animations}</style>
      
      {/* Sidebar */}
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: contentMarginLeft, 
        paddingTop: responsive.contentPadding,
        paddingLeft: responsive.contentPadding,
        paddingRight: responsive.contentPadding,
        paddingBottom: isMobile ? "70px" : responsive.contentPadding,
        background: theme.background, 
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        overflowX: "hidden",
        minHeight: "100vh"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          
          {/* Header Desktop et Mobile unifié */}
          <div style={{ 
            marginBottom: responsive.gapLarge, 
            animation: "fadeInDown 0.4s ease", 
            opacity: animateCards ? 1 : 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "12px" : "0"
          }}>
            <div>
              <h1 style={{ color: theme.text, fontSize: responsive.titleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", borderRadius: "12px", background: theme.gradient, color: "white", animation: "glow 2s infinite" }}>
                  <IconRobot size={isMobile ? 16 : 18} />
                </span>
                {t.aiAssistant}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "2px", fontSize: isMobile ? "10px" : responsive.subtitleSize }}>{t.aiSubtitle}</p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", alignSelf: isMobile ? "flex-end" : "auto" }}>
              <button 
                onClick={refreshData} 
                disabled={refreshing} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: isMobile ? "4px" : "6px", 
                  background: `${theme.primary}15`, 
                  border: `1px solid ${theme.primary}30`, 
                  borderRadius: "20px", 
                  padding: isMobile ? "6px 12px" : "6px 12px", 
                  cursor: refreshing ? "not-allowed" : "pointer", 
                  fontSize: isMobile ? "10px" : "11px", 
                  color: theme.primary,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ display: "inline-flex", animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                  <IconRefresh size={isMobile ? 12 : 12} />
                </span>
                {refreshing ? (isMobile ? "..." : t.refreshing) : (isMobile ? "" : "Actualiser")}
              </button>
            </div>
            {lastRefresh && !refreshing && !isMobile && (
              <p style={{ fontSize: "10px", color: theme.textSecondary, marginTop: "8px", textAlign: "right" }}>
                 Derniére actualisation: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {lastRefresh && !refreshing && isMobile && (
            <p style={{ fontSize: "9px", color: theme.textSecondary, marginTop: "-12px", marginBottom: responsive.gapSmall, textAlign: "right" }}>
               {lastRefresh.toLocaleTimeString()}
            </p>
          )}

          {/* Alertes */}
          {alerts.length > 0 && (
            <div style={{ marginBottom: responsive.gapMedium, display: "flex", flexDirection: "column", gap: "8px" }}>
              {alerts.slice(0, isMobile ? 2 : 3).map((alert, idx) => {
                const colors: any = { danger: { bg: "rgba(239,68,68,0.1)", border: "#ef4444" }, warning: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b" }, info: { bg: "rgba(59,130,246,0.1)", border: "#3b82f6" } };
                const c = colors[alert.type] || colors.info;
                const AlertIconComponent = alert.icon || IconInfo;
                return (
                  <div key={idx} style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, padding: "10px 12px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                      <AlertIconComponent size={isMobile ? 14 : 16} />
                      <span style={{ color: theme.text, fontSize: isMobile ? "10px" : "11px" }}>{alert.message}</span>
                    </div>
                    {alert.action && (
                      <button 
                        onClick={() => router.push(alert.action.path)} 
                        style={{ 
                          background: c.border, 
                          color: "white", 
                          border: "none", 
                          borderRadius: "6px", 
                          padding: isMobile ? "5px 12px" : "4px 10px", 
                          cursor: "pointer", 
                          fontSize: "10px", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "4px",
                          WebkitTapHighlightColor: "transparent"
                        }}
                      >
                        {alert.action.label} <IconArrowRight size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* KPI Cards - grille 2x2 sur mobile */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))", gap: responsive.gapMedium, marginBottom: responsive.gapLarge }}>
            {kpiCards.map((card, idx) => (
              <div 
                key={idx} 
                style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, animation: `fadeInUp 0.4s ease ${0.1 + idx * 0.05}s`, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)"; } }}
                onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: responsive.kpiLabelSize, color: theme.textSecondary }}>{card.label}</span>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: isMobile ? "28px" : "32px", height: isMobile ? "28px" : "32px", borderRadius: "10px", background: `${card.color}18`, color: card.color }}>
                    <card.Icon size={isMobile ? 12 : 14} />
                  </span>
                </div>
                <div style={{ fontSize: responsive.kpiValueSize, color: card.color, fontWeight: "bold" }}>{card.value}</div>
                {!isMobile && (
                  <div style={{ fontSize: "9px", color: "#10b981", marginTop: "6px", display: "flex", alignItems: "center", gap: "3px" }}><IconTrendingUp size={10} /> +{card.growth}% vs période préc.</div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs - scrollable horizontal sur mobile */}
          <div style={{ display: "flex", gap: "2px", marginBottom: responsive.gapMedium, borderBottom: `1px solid ${theme.border}`, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                style={{ 
                  padding: isMobile ? "10px 14px" : "8px 16px", 
                  background: activeTab === tab.id ? theme.primary : "transparent", 
                  border: "none", 
                  borderRadius: "10px 10px 0 0", 
                  color: activeTab === tab.id ? "white" : theme.textSecondary, 
                  cursor: "pointer", 
                  transition: "all 0.2s", 
                  fontSize: isMobile ? "12px" : "12px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  whiteSpace: "nowrap", 
                  flexShrink: 0,
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  WebkitTapHighlightColor: "transparent"
                }}
              >
                <tab.Icon size={isMobile ? 14 : 14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: responsive.gapMedium, marginBottom: responsive.gapMedium }}>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}><IconTrendingUp size={isMobile ? 12 : 14} /> {t.salesEvolution}</h3>
                  <div style={{ height: isMobile ? "200px" : "auto" }}>
                    <Line data={salesChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                  </div>
                </div>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}><IconProfit size={isMobile ? 12 : 14} /> {t.profitEvolution}</h3>
                  <div style={{ height: isMobile ? "200px" : "auto" }}>
                    <Line data={profitChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: responsive.gapMedium }}>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}><IconTrophy size={isMobile ? 12 : 14} /> {t.topProducts}</h3>
                  <div style={{ height: isMobile ? "220px" : "auto" }}>
                    <Bar data={topProductsChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                  </div>
                </div>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}><IconStar size={isMobile ? 12 : 14} /> {t.topClients}</h3>
                  <div style={{ height: isMobile ? "220px" : "auto" }}>
                    <Bar data={topClientsChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat IA Tab */}
          {activeTab === "chat" && (
            <div style={{ 
              background: theme.surface, 
              borderRadius: responsive.cardRadius, 
              border: `1px solid ${theme.border}`, 
              display: "flex", 
              flexDirection: "column", 
              height: isMobile 
                ? (keyboardVisible ? "350px" : "calc(100vh - 140px)") 
                : "580px", 
              overflow: "hidden", 
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)" 
            }}>
              {!isMobile && (
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${theme.border}`, background: `linear-gradient(135deg, ${theme.surfaceHover}, ${theme.surface})` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "22px", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${theme.primary}40`, animation: "pulse 2s infinite" }}>
                      <IconRobot size={22} />
                    </div>
                    <div>
                      <div style={{ color: theme.text, fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        {t.aiAssistant}
                        <span style={{ background: `${theme.accent}25`, color: theme.accent, fontSize: "9px", padding: "2px 8px", borderRadius: "20px", fontWeight: "normal" }}>GPT-4</span>
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} /> {t.online}
                        </span>
                        <span>*</span>
                        <span>{chatMessages.length} messages</span>
                        <span>*</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><IconCheckCircle size={10} /> {t.instantAnswers}</span>
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                      <button onClick={copyConversation} style={{ background: `${theme.primary}20`, border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", gap: "5px", color: theme.textSecondary, transition: "all 0.2s" }}>
                        <IconCopy size={12} /> {t.copyConversation}
                      </button>
                      <button onClick={clearConversation} style={{ background: `${theme.primary}20`, border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", gap: "5px", color: theme.textSecondary, transition: "all 0.2s" }}>
                        <IconTrash size={12} /> {t.clearConversation}
                      </button>
                      <button onClick={() => { setChatMessages([{ role: "assistant", content: getWelcomeMessage(), timestamp: new Date(), actions: getWelcomeActions() }]); }} style={{ background: `${theme.primary}20`, border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", gap: "5px", color: theme.textSecondary, transition: "all 0.2s" }}>
                        <IconRefresh size={12} /> {t.newChat}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div 
                ref={chatContainerRef} 
                style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  padding: isMobile ? "12px" : "18px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: isMobile ? "12px" : "16px", 
                  background: theme.background,
                  WebkitOverflowScrolling: "touch"
                }}
              >
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "slideIn 0.3s ease" }}>
                    {msg.role !== "user" && !isMobile && (
                      <div style={{ width: "36px", height: "36px", borderRadius: "18px", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", flexShrink: 0, boxShadow: `0 2px 8px ${theme.primary}40` }}>
                        <IconRobot size={18} />
                      </div>
                    )}
                    <div style={{ maxWidth: isMobile ? "85%" : "75%" }}>
                      <div style={{ padding: isMobile ? "10px 14px" : "12px 18px", borderRadius: "20px", background: msg.role === "user" ? theme.gradient : theme.surfaceHover, color: theme.text, fontSize: isMobile ? "12px" : "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word", boxShadow: msg.role === "user" ? `0 2px 10px ${theme.primary}40` : "none" }}>
                        {msg.content}
                      </div>
                      {msg.actions && msg.actions.length > 0 && msg.role !== "user" && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                          {msg.actions.slice(0, isMobile ? 3 : 4).map((action: any, ai: number) => (
                            <button 
                              key={ai} 
                              onClick={() => action.query ? setChatInput(action.query) : action.path ? router.push(action.path) : null} 
                              style={{ 
                                background: `${theme.primary}15`, 
                                border: "none", 
                                borderRadius: "20px", 
                                padding: isMobile ? "5px 12px" : "5px 14px", 
                                fontSize: isMobile ? "10px" : "10px", 
                                color: theme.primary, 
                                cursor: "pointer", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                transition: "all 0.2s",
                                WebkitTapHighlightColor: "transparent"
                              }}
                            >
                              {action.icon && <action.icon size={isMobile ? 11 : 11} />} {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: isMobile ? "8px" : "9px", color: theme.textSecondary, marginTop: "4px", marginLeft: isMobile ? "4px" : "8px" }}>
                        {msg.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {msg.role === "user" && !isMobile && (
                      <div style={{ width: "36px", height: "36px", borderRadius: "18px", background: theme.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "12px", flexShrink: 0, border: `1px solid ${theme.border}` }}>
                        <IconUser size={16} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    {!isMobile && <div style={{ width: "36px", height: "36px", borderRadius: "18px", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px" }}><IconRobot size={18} /></div>}
                    <div style={{ padding: isMobile ? "10px 16px" : "12px 20px", borderRadius: "20px", background: theme.surfaceHover, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "6px", height: "6px", background: theme.primary, borderRadius: "50%", display: "inline-block", animation: "bounce 0.6s infinite 0s" }} />
                      <span style={{ width: "6px", height: "6px", background: theme.primary, borderRadius: "50%", display: "inline-block", animation: "bounce 0.6s infinite 0.15s" }} />
                      <span style={{ width: "6px", height: "6px", background: theme.primary, borderRadius: "50%", display: "inline-block", animation: "bounce 0.6s infinite 0.3s" }} />
                      <span style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary, marginLeft: "4px" }}>{t.aiThoughts}</span>
                    </div>
                  </div>
                )}
                
                {isStreaming && streamingContent && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    {!isMobile && <div style={{ width: "36px", height: "36px", borderRadius: "18px", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px" }}><IconRobot size={18} /></div>}
                    <div style={{ padding: isMobile ? "10px 14px" : "12px 18px", borderRadius: "20px", background: theme.surfaceHover, fontSize: isMobile ? "12px" : "13px", maxWidth: isMobile ? "85%" : "75%", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {streamingContent}<span style={{ display: "inline-block", width: "2px", height: "12px", background: theme.primary, marginLeft: "2px", animation: "blink 1s infinite", verticalAlign: "middle" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Zone de saisie améliorée pour mobile */}
              <div style={{ padding: isMobile ? "12px" : "14px 18px", borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
                <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", alignItems: "flex-end" }}>
                  <textarea 
                    ref={textareaRef}
                    placeholder={t.typeMessage}
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !isMobile) { e.preventDefault(); sendMessage(); } }} 
                    rows={isMobile ? 2 : 1} 
                    style={{ 
                      flex: 1, 
                      padding: isMobile ? "10px 14px" : "10px 16px", 
                      background: theme.surfaceHover, 
                      border: `1px solid ${theme.border}`, 
                      borderRadius: "20px", 
                      color: theme.text, 
                      fontSize: isMobile ? "14px" : "13px", 
                      outline: "none", 
                      resize: "none", 
                      fontFamily: "inherit", 
                      maxHeight: isMobile ? "100px" : "100px", 
                      transition: "all 0.2s",
                      WebkitAppearance: "none"
                    }} 
                    onFocus={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.background = theme.surface; }} 
                    onBlur={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.surfaceHover; }} 
                  />
                  <button 
                    onClick={sendMessage} 
                    disabled={loadingAI || !chatInput.trim()} 
                    style={{ 
                      background: (!chatInput.trim() || loadingAI) ? theme.border : theme.gradient, 
                      color: "white", 
                      border: "none", 
                      borderRadius: "25px", 
                      padding: isMobile ? "10px 20px" : "9px 22px", 
                      cursor: (!chatInput.trim() || loadingAI) ? "not-allowed" : "pointer", 
                      fontSize: isMobile ? "13px" : "13px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      fontWeight: "500", 
                      transition: "all 0.2s", 
                      whiteSpace: "nowrap",
                      WebkitTapHighlightColor: "transparent"
                    }}
                  >
                    <IconSend size={isMobile ? 14 : 14} /> {t.send}
                  </button>
                </div>
                
                {!isMobile && (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "10px", color: theme.textSecondary, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <IconZap size={12} /> {t.quickActions}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {quickSuggestions.map((s, idx) => (
                        <button key={idx} onClick={() => setChatInput(s.query)} style={{ background: `${s.color}15`, border: `1px solid ${s.color}25`, borderRadius: "20px", padding: "6px 14px", fontSize: "10px", color: s.color, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                          <s.Icon size={11} /> {s.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forecasts Tab */}
          {activeTab === "forecasts" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: responsive.gapMedium, marginBottom: responsive.gapMedium }}>
                {[
                  { label: t.forecastGrowth, value: predictions?.revenueForecast?.growthRate + "%", color: "#10b981", icon: IconTrendingUp, sub: isMobile ? t.vsPrevShort : t.vsPrevPeriod },
                  { label: t.projectedRevenue, value: formatCurrency(getForecastData()[0] || 0), color: "#10b981", icon: IconRevenue, sub: isMobile ? t.nextMonthShort : t.nextMonthLong },
                  { label: t.projectedProfit, value: formatCurrency((getForecastData()[0] || 0) * 0.35), color: "#f59e0b", icon: IconProfit, sub: isMobile ? t.estimateShort : t.estimateMargin }
                ].map((card, idx) => (
                  <div key={idx} style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, transition: "transform 0.2s, box-shadow 0.2s", animation: `fadeInUp 0.4s ease ${0.1 + idx * 0.1}s` }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: card.color }}><card.icon size={isMobile ? 24 : 28} /></div>
                    <div style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary }}>{card.label}</div>
                    <div style={{ fontSize: isMobile ? "18px" : "22px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: isMobile ? "8px" : "9px", color: theme.textSecondary, marginTop: "5px" }}>{card.sub}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px", flexDirection: isMobile ? "column" : "row" }}>
                <div style={{ display: "flex", gap: "6px", background: theme.surface, padding: "5px", borderRadius: "30px", border: `1px solid ${theme.border}`, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  {["3months", "6months", "12months"].map((period) => (
                    <button 
                      key={period} 
                      onClick={() => setForecastPeriod(period)} 
                      style={{ 
                        padding: isMobile ? "7px 16px" : "7px 20px", 
                        borderRadius: "25px", 
                        background: forecastPeriod === period ? theme.primary : "transparent", 
                        color: forecastPeriod === period ? "white" : theme.textSecondary, 
                        border: "none", 
                        cursor: "pointer", 
                        fontSize: isMobile ? "11px" : "12px", 
                        fontWeight: forecastPeriod === period ? "500" : "normal", 
                        transition: "all 0.2s",
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      {period === "3months" ? t.threeMonths : period === "6months" ? t.sixMonths : t.twelveMonths}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  {(Object.entries({ optimistic: t.optimistic, realistic: t.realistic, pessimistic: t.pessimistic }) as [string, string][]).map(([key, label]) => (
                    <button 
                      key={key} 
                      onClick={() => setSelectedScenario(key as any)} 
                      style={{ 
                        padding: isMobile ? "6px 14px" : "7px 16px", 
                        borderRadius: "22px", 
                        background: selectedScenario === key ? { optimistic: "#10b981", realistic: "#f59e0b", pessimistic: "#ef4444" }[key] : "transparent", 
                        border: `1.5px solid ${key === "optimistic" ? "#10b981" : key === "realistic" ? "#f59e0b" : "#ef4444"}`, 
                        color: selectedScenario === key ? "white" : key === "optimistic" ? "#10b981" : key === "realistic" ? "#f59e0b" : "#ef4444", 
                        cursor: "pointer", 
                        fontSize: isMobile ? "10px" : "11px", 
                        fontWeight: selectedScenario === key ? "500" : "normal", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px", 
                        transition: "all 0.2s",
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      {key === "optimistic" ? "" : key === "pessimistic" ? "" : ""} {isMobile && label.length > 8 ? label.substring(0, 6) : label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
                  <h3 style={{ color: theme.text, fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "8px" }}><IconPredictions size={isMobile ? 14 : 16} /> {t.salesForecast}  {selectedScenario === "optimistic" ? t.optimistic : selectedScenario === "realistic" ? t.realistic : t.pessimistic}</h3>
                  <div style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary, background: theme.surfaceHover, padding: "4px 10px", borderRadius: "20px" }}>
                     {t.confidence}: {predictions?.revenueForecast?.confidence || 0}%
                  </div>
                </div>
                <div style={{ height: isMobile ? "230px" : "auto" }}>
                  <Line data={forecastChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                </div>
                <div style={{ marginTop: "18px", padding: isMobile ? "10px" : "14px", background: theme.surfaceHover, borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ display: "flex", gap: isMobile ? "10px" : "16px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ display: "inline-block", width: "12px", height: "12px", background: "#f59e0b", borderRadius: "3px" }}></span> <span style={{ fontSize: isMobile ? "9px" : "11px" }}>{t.salesForecast}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ display: "inline-block", width: "12px", height: "12px", background: "#10b981", borderRadius: "3px", opacity: 0.6 }}></span> <span style={{ fontSize: isMobile ? "9px" : "11px" }}>{t.upperBound}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ display: "inline-block", width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px", opacity: 0.6 }}></span> <span style={{ fontSize: isMobile ? "9px" : "11px" }}>{t.lowerBound}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === "recommendations" && (
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ color: theme.text, fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "8px" }}><IconRecommendations size={isMobile ? 14 : 16} /> {t.recommendations}</h3>
                {!isMobile && (
                  <div style={{ fontSize: "10px", color: theme.textSecondary, background: `${theme.accent}15`, padding: "4px 10px", borderRadius: "20px" }}>
                     Générées par IA
                  </div>
                )}
              </div>
              
              {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recommendations.slice(0, 5).map((rec, idx) => {
                    const urgencyConfig = rec.urgency === "high"
                      ? { color: "#ef4444", bg: "rgba(239,68,68,0.15)", text: t.priorityHigh, icon: "" }
                      : rec.urgency === "medium"
                      ? { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", text: t.priorityMedium, icon: "" }
                      : { color: "#10b981", bg: "rgba(16,185,129,0.1)", text: t.priorityLow, icon: "" };
                    return (
                      <div key={idx} style={{ background: theme.surfaceHover, borderRadius: "12px", padding: "12px", border: `1px solid ${theme.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{ color: theme.text, fontWeight: "bold", fontSize: "13px", flex: 1 }}>{rec.productName}</span>
                          <span style={{ background: urgencyConfig.bg, color: urgencyConfig.color, padding: "2px 8px", borderRadius: "12px", fontSize: "9px", display: "flex", alignItems: "center", gap: "3px" }}>
                            {urgencyConfig.icon} {urgencyConfig.text}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "10px", fontSize: "10px" }}>
                          <div><span style={{ color: theme.textSecondary }}>Stock:</span> <span style={{ color: rec.currentStock < 10 ? "#ef4444" : rec.currentStock < 20 ? "#f59e0b" : "#10b981", fontWeight: "bold" }}>{rec.currentStock} unités</span></div>
                          <div><span style={{ color: theme.textSecondary }}>Demande:</span> <span style={{ color: "#10b981", fontWeight: "bold" }}>{rec.monthlyDemand}/mois</span></div>
                          <div><span style={{ color: theme.textSecondary }}>{t.recommendedLabel}</span> <span style={{ color: "#10b981", fontWeight: "bold" }}>{rec.recommendedStock} {t.unitsWord}</span></div>
                        </div>
                        <button 
                          onClick={() => router.push("/dashboard/purchases")} 
                          style={{ 
                            width: "100%", 
                            background: theme.primary, 
                            border: "none", 
                            borderRadius: "8px", 
                            padding: "10px", 
                            cursor: "pointer", 
                            fontSize: "12px", 
                            color: "white", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: "6px",
                            WebkitTapHighlightColor: "transparent"
                          }}
                        >
                          <IconShoppingCart size={14} /> {t.orderNow}
                        </button>
                      </div>
                    );
                  })}
                  {recommendations.length > 5 && (
                    <button 
                      onClick={() => alert(`+${recommendations.length - 5} autres recommandations disponibles`)}
                      style={{ 
                        background: "transparent", 
                        border: `1px solid ${theme.border}`, 
                        borderRadius: "8px", 
                        padding: "10px", 
                        cursor: "pointer", 
                        fontSize: "11px", 
                        color: theme.textSecondary,
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      Voir {recommendations.length - 5} autres produits
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: "12px 8px", textAlign: "left", color: theme.textSecondary }}>Produit</th>
                        <th style={{ padding: "12px 8px", textAlign: "center", color: theme.textSecondary }}>{t.stockStatus}</th>
                        <th style={{ padding: "12px 8px", textAlign: "center", color: theme.textSecondary }}>{t.monthlyDemand}</th>
                        <th style={{ padding: "12px 8px", textAlign: "center", color: theme.textSecondary }}>{t.recommendedStock}</th>
                        <th style={{ padding: "12px 8px", textAlign: "center", color: theme.textSecondary }}>{t.urgency}</th>
                        <th style={{ padding: "12px 8px", textAlign: "center", color: theme.textSecondary }}>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec, idx) => {
                        const urgencyConfig = rec.urgency === "high"
                          ? { color: "#ef4444", bg: "rgba(239,68,68,0.15)", text: t.priorityHigh, icon: "!" }
                          : rec.urgency === "medium"
                          ? { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", text: t.priorityMedium, icon: "•" }
                          : { color: "#10b981", bg: "rgba(16,185,129,0.1)", text: t.priorityLow, icon: "✓" };
                        return (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.surfaceHover}` }}>
                            <td style={{ padding: "12px 8px", color: theme.text, fontWeight: "500" }}>{rec.productName}</td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <span style={{ background: rec.currentStock < 10 ? "rgba(239,68,68,0.15)" : rec.currentStock < 20 ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", color: rec.currentStock < 10 ? "#ef4444" : rec.currentStock < 20 ? "#f59e0b" : "#10b981", padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "500" }}>
                                {rec.currentStock} unités
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center", color: "#10b981", fontWeight: "500" }}>
                              {rec.monthlyDemand} unités/mois
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center", color: "#10b981", fontWeight: "bold" }}>
                              {rec.recommendedStock} unités
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <span style={{ background: urgencyConfig.bg, color: urgencyConfig.color, padding: "4px 12px", borderRadius: "20px", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: "500" }}>
                                {urgencyConfig.icon} {urgencyConfig.text}
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <button onClick={() => router.push("/dashboard/purchases")} style={{ background: `${theme.primary}20`, border: "none", borderRadius: "8px", padding: "6px 16px", cursor: "pointer", fontSize: "10px", color: theme.primary, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <IconShoppingCart size={11} /> {t.orderNow}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {recommendations.length === 0 && (
                <div style={{ textAlign: "center", padding: isMobile ? "30px" : "40px" }}>
                  <span style={{ display: "inline-flex", color: theme.accent, marginBottom: "12px" }}><IconCheckCircle size={isMobile ? 28 : 32} /></span>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>Aucune recommandation pour le moment. Votre stock est bien géré !</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: responsive.gapMedium, marginBottom: responsive.gapMedium }}>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px" }}><IconAnalytics size={isMobile ? 12 : 14} /> {t.breakdownTitle}</h3>
                  <div style={{ height: isMobile ? "220px" : "200px" }}>
                    <Doughnut 
                      data={{ 
                        labels: isMobile ? ["Ventes", "Achats", "Stock", "Clients"] : ["Ventes", "Achats", "Produits", "Clients"], 
                        datasets: [{ 
                          data: [stats?.sales?.revenue || 1, stats?.purchases?.spent || 1, stats?.products?.totalValue || 1, stats?.clients?.total || 1], 
                          backgroundColor: ["#10b981", "#ef4444", theme.primary, "#8b5cf6"], 
                          borderWidth: 0 
                        }] 
                      }} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: true, 
                        plugins: { 
                          legend: { 
                            labels: { 
                              font: { size: isMobile ? 9 : 9 }, 
                              color: theme.textSecondary,
                              boxWidth: isMobile ? 8 : 10
                            }, 
                            position: isMobile ? "bottom" as const : "bottom" as const 
                          } 
                        } 
                      }} 
                    />
                  </div>
                </div>
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                  <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "12px" : "13px" }}><IconTrendingUp size={isMobile ? 12 : 14} /> {t.salesEvolution}</h3>
                  <div style={{ height: isMobile ? "220px" : "auto" }}>
                    <Line data={salesChartData} options={{ ...chartOptions, maintainAspectRatio: true, responsive: true }} />
                  </div>
                </div>
              </div>
              <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
                <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "12px" : "14px" }}><IconDashboard size={isMobile ? 12 : 14} /> {t.keyKpis}</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "16px" }}>
                  <div style={{ textAlign: "center", padding: isMobile ? "12px" : "16px", background: theme.surfaceHover, borderRadius: "12px" }}>
                    <span style={{ display: "inline-flex", color: "#10b981" }}><IconPackage size={isMobile ? 20 : 24} /></span>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: "#10b981", marginTop: "6px" }}>{stats?.sales?.revenue > 0 && stats?.products?.totalValue > 0 ? (stats.sales.revenue / stats.products.totalValue).toFixed(1) : 0}x</div>
                    <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary }}>{t.inventoryTurnover}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: isMobile ? "12px" : "16px", background: theme.surfaceHover, borderRadius: "12px" }}>
                    <span style={{ display: "inline-flex", color: "#f59e0b" }}><IconUsers size={isMobile ? 20 : 24} /></span>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: "#f59e0b", marginTop: "6px" }}>{stats?.clients?.total > 0 ? ((stats?.orders?.total || 0) / (stats?.clients?.total || 1) * 100).toFixed(1) : 0}%</div>
                    <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary }}>{t.conversionRate}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: isMobile ? "12px" : "16px", background: theme.surfaceHover, borderRadius: "12px" }}>
                    <span style={{ display: "inline-flex", color: theme.accent }}><IconTrendingUp size={isMobile ? 20 : 24} /></span>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: theme.accent, marginTop: "6px" }}>{stats?.employees?.total > 0 ? Math.round((stats?.sales?.revenue || 0) / (stats?.employees?.total || 1)).toLocaleString() : 0} é</div>
                    <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary }}>{t.productivity}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: isMobile ? "12px" : "16px", background: theme.surfaceHover, borderRadius: "12px" }}>
                    <span style={{ display: "inline-flex", color: "#8b5cf6" }}><IconStar size={isMobile ? 20 : 24} /></span>
                    <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: "#8b5cf6", marginTop: "6px" }}>{stats?.clients?.active || 0}</div>
                    <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary }}>{t.activeClients}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}