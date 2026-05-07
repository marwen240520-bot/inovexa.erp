--
-- PostgreSQL database dump
--

\restrict KobMYfKec98Ggjfxvd9KDVEfWaa4Q1MZkSYfhI1MRKp167lnHjiYHfnicMorSr5

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
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, "userId", name, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, "userId", name, email, phone, address, "totalSpent", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, "userId", name, email, "position", department, salary, phone, status, "hireDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, "userId", category, amount, description, date, "createdAt") FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, "userId", "clientId", "clientName", amount, status, "dueDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "userId", "clientId", "clientName", "productId", "productName", quantity, total, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: production_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_orders (id, "userId", "orderNumber", "productName", quantity, status, progress, "startDate", "endDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, "userId", "categoryId", name, sku, price, quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, "userId", "productId", "supplierName", "productName", quantity, "unitPrice", total, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, "userId", "productId", "clientName", "productName", quantity, "unitPrice", total, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipments (id, "clientId", "transporteurId", "trackingNumber", "clientName", address, carrier, status, "estimatedDelivery", value, notes, "actualDeliveryDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, "userId", name, contact, email, phone, address, "createdAt") FROM stdin;
\.


--
-- Data for Name: transporteurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transporteurs (id, "clientId", "userId", name, email, phone, "companyName", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, "companyName", phone, role, "subscriptionStart", "subscriptionEnd", "isActive", "createdAt", "updatedAt") FROM stdin;
1	marwen2405@gmail.com	$2b$10$oa3oc8l3.iC1W8.avBgwquU2kAQxI3amTTIOUp1iqh1xXudwgPdLm	Admin	\N	\N	admin	2026-04-05 22:03:29.75	2036-04-05 22:03:29.748	t	2026-04-05 22:03:29.75	2026-04-05 22:03:29.75
2	marwen240520@gmail.com	$2b$10$wRr/V2DnqBVT5hrUTJaCnuNIj6jO43i.0gY2D1gIvuLt1Z2eUptcq	Marwen Hadded	erp		client	2026-04-05 22:05:04.246	2026-05-05 22:05:04.246	t	2026-04-05 22:05:04.296457	2026-04-05 22:05:04.296457
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: production_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchases_id_seq', 1, false);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 1, false);


--
-- Name: shipments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shipments_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: transporteurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transporteurs_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

\unrestrict KobMYfKec98Ggjfxvd9KDVEfWaa4Q1MZkSYfhI1MRKp167lnHjiYHfnicMorSr5

