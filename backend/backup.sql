--
-- PostgreSQL database dump
--

\restrict G3Dp0s4ImxjS9sGyfAK6Vep0tFUEWUouwKatKogvTPXLuyz2fnrxzbo0z5Y0WlK

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    balance numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    "accountNumber" character varying,
    iban character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- Name: bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_accounts_id_seq OWNER TO postgres;

--
-- Name: bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_accounts_id_seq OWNED BY public.bank_accounts.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    category character varying NOT NULL,
    amount numeric(20,2) NOT NULL,
    year integer NOT NULL,
    department character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_id_seq OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: client_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_modules (
    id integer NOT NULL,
    "clientId" integer NOT NULL,
    dashboard boolean DEFAULT true NOT NULL,
    products boolean DEFAULT true NOT NULL,
    categories boolean DEFAULT true NOT NULL,
    stock boolean DEFAULT true NOT NULL,
    sales boolean DEFAULT true NOT NULL,
    purchases boolean DEFAULT true NOT NULL,
    orders boolean DEFAULT true NOT NULL,
    clients boolean DEFAULT true NOT NULL,
    suppliers boolean DEFAULT true NOT NULL,
    invoices boolean DEFAULT true NOT NULL,
    hr boolean DEFAULT true NOT NULL,
    finance boolean DEFAULT true NOT NULL,
    logistics boolean DEFAULT true NOT NULL,
    production boolean DEFAULT true NOT NULL,
    ai boolean DEFAULT true NOT NULL,
    reports boolean DEFAULT true NOT NULL,
    analytics boolean DEFAULT true NOT NULL,
    profile boolean DEFAULT true NOT NULL,
    settings boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.client_modules OWNER TO postgres;

--
-- Name: client_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_modules_id_seq OWNER TO postgres;

--
-- Name: client_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_modules_id_seq OWNED BY public.client_modules.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    address character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "totalSpent" numeric(20,2) DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    "position" character varying,
    department character varying,
    salary numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    phone character varying,
    "hireDate" timestamp without time zone DEFAULT now(),
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    category character varying NOT NULL,
    description character varying,
    date timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    amount numeric(20,2) CONSTRAINT "expenses_amountHT_not_null" NOT NULL,
    "taxAmount" integer NOT NULL,
    "taxRate" integer NOT NULL,
    "paymentMethod" character varying,
    vendor character varying,
    "invoiceNumber" character varying
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: export; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.export (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.export OWNER TO postgres;

--
-- Name: ia_chats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ia_chats (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    role character varying NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ia_chats OWNER TO postgres;

--
-- Name: ia_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ia_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ia_chats_id_seq OWNER TO postgres;

--
-- Name: ia_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ia_chats_id_seq OWNED BY public.ia_chats.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    reference character varying NOT NULL,
    "clientId" integer NOT NULL,
    "clientName" character varying,
    amount numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    "dueDate" timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "operationNumber" character varying NOT NULL,
    type character varying DEFAULT 'debit'::character varying NOT NULL,
    "supplierId" integer,
    "supplierName" character varying,
    "clientEmail" character varying,
    "clientAddress" character varying,
    "clientPhone" character varying,
    "clientSiret" character varying,
    description text,
    items json,
    "subtotalHT" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    "taxRate" numeric(10,2) DEFAULT '20'::numeric NOT NULL,
    "taxAmount" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    "paymentTerms" character varying DEFAULT 'Net 30'::character varying NOT NULL,
    notes text
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "clientName" character varying,
    "productName" character varying,
    quantity integer DEFAULT 1 NOT NULL,
    total numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "unitPrice" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    "clientId" integer,
    "productId" integer
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: production_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_orders (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "orderNumber" character varying NOT NULL,
    "productName" character varying NOT NULL,
    quantity integer NOT NULL,
    "completedQuantity" integer DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    "startDate" timestamp without time zone,
    "endDate" timestamp without time zone,
    priority character varying,
    "assignedTo" character varying,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.production_orders OWNER TO postgres;

--
-- Name: production_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_orders_id_seq OWNER TO postgres;

--
-- Name: production_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_orders_id_seq OWNED BY public.production_orders.id;


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    name character varying NOT NULL,
    sku character varying NOT NULL,
    price numeric(20,2) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer NOT NULL,
    "categoryId" integer,
    id integer DEFAULT nextval('public.products_id_seq'::regclass) NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    department character varying,
    budget numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    cost numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "productId" integer NOT NULL,
    "supplierName" character varying,
    "productName" character varying,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchases_id_seq OWNER TO postgres;

--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "productId" integer NOT NULL,
    "clientName" character varying,
    "productName" character varying,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: search; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search (
    id text DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.search OWNER TO postgres;

--
-- Name: shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipments (
    id integer NOT NULL,
    "clientId" integer NOT NULL,
    "transporteurId" integer,
    "trackingNumber" character varying NOT NULL,
    "clientName" character varying NOT NULL,
    address character varying NOT NULL,
    phone character varying,
    carrier character varying,
    amount numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "estimatedDelivery" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipments OWNER TO postgres;

--
-- Name: shipments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shipments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shipments_id_seq OWNER TO postgres;

--
-- Name: shipments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shipments_id_seq OWNED BY public.shipments.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying NOT NULL,
    contact character varying,
    email character varying NOT NULL,
    phone character varying,
    address character varying,
    "totalPurchases" numeric(20,2) DEFAULT '0'::numeric NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: transporteurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transporteurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transporteurs_id_seq OWNER TO postgres;

--
-- Name: transporteurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transporteurs (
    name character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "clientId" integer NOT NULL,
    "userId" integer NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    "companyName" character varying,
    address character varying,
    "isActive" boolean DEFAULT true NOT NULL,
    id integer DEFAULT nextval('public.transporteurs_id_seq'::regclass) NOT NULL
);


ALTER TABLE public.transporteurs OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    "companyName" character varying,
    phone character varying,
    role character varying DEFAULT 'client'::character varying NOT NULL,
    avatar character varying,
    "subscriptionStart" timestamp without time zone,
    "subscriptionEnd" timestamp without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    modules json DEFAULT '{}'::json
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bank_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.bank_accounts_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: client_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules ALTER COLUMN id SET DEFAULT nextval('public.client_modules_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: ia_chats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ia_chats ALTER COLUMN id SET DEFAULT nextval('public.ia_chats_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: production_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_orders ALTER COLUMN id SET DEFAULT nextval('public.production_orders_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: shipments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments ALTER COLUMN id SET DEFAULT nextval('public.shipments_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, name, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_accounts (id, "userId", name, type, balance, "accountNumber", iban, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, "userId", category, amount, year, department, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, "userId", name, description, "createdAt", "updatedAt") FROM stdin;
1	2	alimentation		2026-06-24 17:36:39.975401	2026-06-24 17:36:39.975401
\.


--
-- Data for Name: client_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_modules (id, "clientId", dashboard, products, categories, stock, sales, purchases, orders, clients, suppliers, invoices, hr, finance, logistics, production, ai, reports, analytics, profile, settings, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, "userId", name, email, phone, address, "createdAt", "updatedAt", "totalSpent", status) FROM stdin;
1	2	fguiq	marwen240520@gmail.com			2026-06-24 14:09:25.240617	2026-06-24 14:09:25.240617	1563.00	active
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, "userId", name, description) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, "userId", name, email, "position", department, salary, phone, "hireDate", status, "createdAt", "updatedAt") FROM stdin;
1	2	ahmed	marwen240520@gmail.com	ta7an	zatla	561455.98		\N	active	2026-06-24 18:18:07.302972	2026-06-24 18:18:07.302972
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, "userId", category, description, date, "createdAt", "updatedAt", amount, "taxAmount", "taxRate", "paymentMethod", vendor, "invoiceNumber") FROM stdin;
\.


--
-- Data for Name: export; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.export (id, name, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: ia_chats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ia_chats (id, "userId", role, content, "createdAt") FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, "userId", reference, "clientId", "clientName", amount, "dueDate", status, "createdAt", "updatedAt", "operationNumber", type, "supplierId", "supplierName", "clientEmail", "clientAddress", "clientPhone", "clientSiret", description, items, "subtotalHT", "taxRate", "taxAmount", "paymentTerms", notes) FROM stdin;
1	2	qsojh	1	fguiq	61584.00	\N	pending	2026-06-24 17:45:13.588936	2026-06-24 17:45:13.588936	FACT-20260624-5741	debit	\N		marwen240520@gmail.com					[{"description":"svdvd","quantity":1,"unitPriceHT":51320,"totalHT":51320,"totalTTC":61584}]	51320.00	20.00	10264.00	Net 30	
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "userId", "clientName", "productName", quantity, total, status, "createdAt", "updatedAt", "unitPrice", "clientId", "productId") FROM stdin;
1	2	lkngl	<dnso	1	0.00	cancelled	2026-06-24 13:27:32.579457	2026-06-24 13:47:42.518386	0.00	\N	\N
\.


--
-- Data for Name: production_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_orders (id, "userId", "orderNumber", "productName", quantity, "completedQuantity", status, progress, "startDate", "endDate", priority, "assignedTo", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (name, sku, price, quantity, "createdAt", "updatedAt", "userId", "categoryId", id) FROM stdin;
dgs	5165	51563.00	0	2026-06-24 15:19:28.084447	2026-06-24 15:19:28.084447	3	\N	4
456		0.00	0	2026-06-24 17:36:21.506362	2026-06-24 17:36:21.506362	2	\N	5
qererq	745	445.00	0	2026-06-24 14:09:13.722738	2026-06-24 19:47:40.642923	2	\N	6
marwe?	1253	456.00	0	2026-06-24 21:44:02.273848	2026-06-24 21:44:02.273848	2	1	8
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, "userId", name, department, budget, cost, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, "userId", "productId", "supplierName", "productName", quantity, "unitPrice", total, status, "createdAt", "updatedAt") FROM stdin;
2	2	5	ahùed	456	1	0.00	0.00	delivered	2026-06-24 18:06:31.164114	2026-06-24 18:06:31.164114
3	2	5	ahùed	456	1	0.00	0.00	delivered	2026-06-24 18:07:26.598891	2026-06-24 18:07:26.598891
5	2	5	ahùed	456	123	1.00	123.00	delivered	2026-06-24 18:09:49.354689	2026-06-24 18:09:49.354689
6	2	5	ahùed	456	11	1.00	11.00	pending	2026-06-24 20:45:26.570077	2026-06-24 20:45:26.570077
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, "userId", "productId", "clientName", "productName", quantity, "unitPrice", total, status, "createdAt", "updatedAt") FROM stdin;
1	2	6		qererq	1	445.00	445.00	paid	2026-06-24 18:06:16.669897	2026-06-24 18:10:02.446257
2	2	6	fguiq	qererq	125	4450.00	556250.00	paid	2026-06-24 19:47:40.666767	2026-06-24 21:19:19.864422
\.


--
-- Data for Name: search; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search (id, name, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipments (id, "clientId", "transporteurId", "trackingNumber", "clientName", address, phone, carrier, amount, status, "estimatedDelivery", "createdAt", "updatedAt") FROM stdin;
1	2	\N	hjk	bhjj	njkk	\N	\N	0.00	pending	\N	2026-06-24 17:44:52.245325	2026-06-24 17:44:52.245325
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, "userId", name, contact, email, phone, address, "totalPurchases", status, "createdAt", "updatedAt") FROM stdin;
1	2	ahùed	\N				0.00	active	2026-06-24 17:44:20.378728	2026-06-24 17:44:20.378728
2	2	ahmed	\N	marwen240520@gmail.com	22535181	ariana	1653.00	active	2026-06-24 18:18:37.757386	2026-06-24 18:18:37.757386
\.


--
-- Data for Name: transporteurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transporteurs (name, "createdAt", "updatedAt", "clientId", "userId", email, phone, "companyName", address, "isActive", id) FROM stdin;
Marwen Hadded	2026-06-24 19:49:26.53961	2026-06-24 19:49:26.53961	2	4	m@gmail.com				t	2
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, "companyName", phone, role, avatar, "subscriptionStart", "subscriptionEnd", "isActive", "createdAt", "updatedAt", modules) FROM stdin;
1	marwen2405@gmail.com	$2b$10$wseuqd.EYfUTETpZg1SZL.ex5zENIuso4kC5iBo0/cfXJHYT3X0p.	Admin	\N	\N	admin	\N	2026-06-24 13:13:14.591	2036-06-24 13:13:14.588	t	2026-06-24 13:13:14.591	2026-06-24 13:13:14.591	{}
2	marwen240520@gmail.com	$2b$10$VUsDvOW3nrJecGEdGWQEq.dJ5eWS1Fiyzs4HMZrPO4Tfpb4xCEnaO	Marwen Hadded	erp system 	22535181	client	\N	2026-06-24 13:14:24.319	2034-09-10 13:14:24.319	t	2026-06-24 13:14:24.321829	2026-06-24 19:06:08.721683	{"dashboard":true,"products":true,"categories":true,"stock":true,"sales":true,"purchases":true,"orders":true,"clients":true,"suppliers":true,"invoices":true,"hr":true,"finance":true,"logistics":true,"production":false,"ai":true,"reports":true,"analytics":true,"profile":true,"settings":true}
3	demo@inovexa.com	$2b$10$ozH.3nl6XZtgerCW3KePmue1nWpTRJYnFF88GtrNhRh8Tv3/Rcv1y	Marwen Hadded			client	\N	2026-06-24 15:16:59.278	2026-07-24 15:16:59.278	t	2026-06-24 15:16:59.30356	2026-06-24 19:06:23.897875	{"dashboard":true,"products":true,"categories":true,"stock":true,"sales":true,"purchases":true,"orders":true,"clients":true,"suppliers":true,"invoices":true,"hr":true,"finance":true,"logistics":true,"production":false,"ai":true,"reports":true,"analytics":true,"profile":true,"settings":true}
4	m@gmail.com	$2b$10$T1MPrNVCo11jv8U2tO6die6TbGkUtYcCPWA.6wK8ir0Kw7ZQyzome	Marwen Hadded			transporteur	\N	\N	\N	t	2026-06-24 19:49:26.530097	2026-06-24 19:49:26.530097	{}
\.


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_accounts_id_seq', 1, false);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, true);


--
-- Name: client_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_modules_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 2, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: ia_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ia_chats_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, true);


--
-- Name: production_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 8, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchases_id_seq', 6, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 2, true);


--
-- Name: shipments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipments_id_seq', 1, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 2, true);


--
-- Name: transporteurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transporteurs_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: search PK_0bdd0dc9f37fc71a6050de7ae7f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search
    ADD CONSTRAINT "PK_0bdd0dc9f37fc71a6050de7ae7f" PRIMARY KEY (id);


--
-- Name: customers PK_133ec679a801fab5e070f73d3ea; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY (id);


--
-- Name: purchases PK_1d55032f37a34c6eceacbbca6b8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: ia_chats PK_2c2088ea72676c81fd654f70a1d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ia_chats
    ADD CONSTRAINT "PK_2c2088ea72676c81fd654f70a1d" PRIMARY KEY (id);


--
-- Name: production_orders PK_44d72e026027e3448b5d655e16e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_orders
    ADD CONSTRAINT "PK_44d72e026027e3448b5d655e16e" PRIMARY KEY (id);


--
-- Name: sales PK_4f0bc990ae81dba46da680895ea; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY (id);


--
-- Name: projects PK_6271df0a7aed1d6c0691ce6ac50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY (id);


--
-- Name: invoices PK_668cef7c22a427fd822cc1be3ce; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY (id);


--
-- Name: shipments PK_6deda4532ac542a93eab214b564; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY (id);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: departments PK_839517a681a86bb84cbcc6a1e9d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY (id);


--
-- Name: export PK_93dd4c52436ed0da6263e24b3c7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export
    ADD CONSTRAINT "PK_93dd4c52436ed0da6263e24b3c7" PRIMARY KEY (id);


--
-- Name: expenses PK_94c3ceb17e3140abc9282c20610; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY (id);


--
-- Name: budgets PK_9c8a51748f82387644b773da482; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: suppliers PK_b70ac51766a9e3144f778cfe81e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY (id);


--
-- Name: employees PK_b9535a98350d5b26e7eb0c26af4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY (id);


--
-- Name: bank_accounts PK_c872de764f2038224a013ff25ed; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT "PK_c872de764f2038224a013ff25ed" PRIMARY KEY (id);


--
-- Name: admin PK_e032310bcef831fb83101899b10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY (id);


--
-- Name: clients PK_f1ab7cf3a5714dbc6bb4e1c28a4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY (id);


--
-- Name: client_modules PK_fdd1c7147543e158b7ca8a07e34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT "PK_fdd1c7147543e158b7ca8a07e34" PRIMARY KEY (id);


--
-- Name: shipments UQ_3300d7adbd17fdb51bdfd8c951e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "UQ_3300d7adbd17fdb51bdfd8c951e" UNIQUE ("trackingNumber");


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: invoices UQ_d4c679011e607e520e4a465840d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "UQ_d4c679011e607e520e4a465840d" UNIQUE ("operationNumber");


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: transporteurs transporteurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transporteurs
    ADD CONSTRAINT transporteurs_pkey PRIMARY KEY (id);


--
-- Name: products FK_99d90c2a483d79f3b627fb1d5e9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_99d90c2a483d79f3b627fb1d5e9" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: products FK_ff56834e735fa78a15d0cf21926; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES public.categories(id);


--
-- Name: admin admin_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT "admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: customers customers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: export export_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export
    ADD CONSTRAINT "export_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: search search_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search
    ADD CONSTRAINT "search_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict G3Dp0s4ImxjS9sGyfAK6Vep0tFUEWUouwKatKogvTPXLuyz2fnrxzbo0z5Y0WlK

