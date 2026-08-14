--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: admission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admission_status AS ENUM (
    'new',
    'contacted',
    'admitted',
    'rejected'
);


--
-- Name: content_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_status AS ENUM (
    'draft',
    'published',
    'archived'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: admission_application_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admission_application_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admission_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admission_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    course_id uuid,
    course_name text DEFAULT ''::text NOT NULL,
    message text DEFAULT ''::text NOT NULL,
    status public.admission_status DEFAULT 'new'::public.admission_status NOT NULL,
    status_updated_at timestamp with time zone,
    status_updated_by text,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    qualification text DEFAULT ''::text NOT NULL,
    medical_college text DEFAULT ''::text NOT NULL,
    bmdc_number text DEFAULT ''::text NOT NULL,
    preferred_branch text DEFAULT ''::text NOT NULL,
    course_slug text DEFAULT ''::text NOT NULL,
    preferred_batch text DEFAULT ''::text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    applicant_message text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id text,
    action text DEFAULT ''::text NOT NULL,
    content_type text DEFAULT ''::text NOT NULL,
    content_id text,
    summary text,
    previous_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    certificate_number text NOT NULL,
    student_name text DEFAULT ''::text NOT NULL,
    course_name text DEFAULT ''::text NOT NULL,
    batch text DEFAULT ''::text NOT NULL,
    bmdc_number text,
    mobile_number text,
    year_of_admission text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    duration text DEFAULT ''::text NOT NULL,
    mode text DEFAULT ''::text NOT NULL,
    eligibility text DEFAULT ''::text NOT NULL,
    short_description text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    fee integer DEFAULT 0 NOT NULL,
    discount_fee integer DEFAULT 0 NOT NULL,
    syllabus text[] DEFAULT ARRAY[]::text[] NOT NULL,
    outcomes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    seo_title text DEFAULT ''::text NOT NULL,
    seo_description text DEFAULT ''::text NOT NULL,
    created_by text,
    updated_by text,
    published_by text,
    archived_by text,
    published_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: education_aid_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_aid_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: education_aid_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_aid_slides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_id uuid NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    caption text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faculty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    credentials text DEFAULT ''::text NOT NULL,
    specialty text DEFAULT ''::text NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    short_bio text DEFAULT ''::text NOT NULL,
    full_bio text DEFAULT ''::text NOT NULL,
    initials text DEFAULT ''::text NOT NULL,
    photo_url text DEFAULT ''::text NOT NULL,
    alt_text text DEFAULT ''::text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by text,
    updated_by text,
    published_by text,
    archived_by text,
    published_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text DEFAULT ''::text NOT NULL
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text DEFAULT ''::text NOT NULL,
    answer text DEFAULT ''::text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by text,
    updated_by text,
    published_by text,
    archived_by text,
    published_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gallery_albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    caption text DEFAULT ''::text NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    album_id uuid NOT NULL,
    url text DEFAULT ''::text NOT NULL,
    alt_text text DEFAULT ''::text NOT NULL,
    caption text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notice_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notice_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notice_id uuid NOT NULL,
    file_url text DEFAULT ''::text NOT NULL,
    file_name text DEFAULT ''::text NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notice_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notice_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    notice_date date DEFAULT CURRENT_DATE NOT NULL,
    category_id uuid,
    attachment_url text,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text,
    meta_title text,
    meta_description text,
    page_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    status text DEFAULT 'active'::text NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    role text DEFAULT ''::text NOT NULL,
    quote text DEFAULT ''::text NOT NULL,
    initials text DEFAULT ''::text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    photo_url text DEFAULT ''::text NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    role_label text DEFAULT ''::text NOT NULL
);


--
-- Name: user_content_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_content_permissions (
    user_id text NOT NULL,
    section text NOT NULL,
    access text NOT NULL,
    CONSTRAINT user_content_permissions_access_check CHECK ((access = ANY (ARRAY['none'::text, 'view'::text, 'update'::text])))
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
OrSlKS7j9tngQsdS8FcGXEdIH6cv26cH	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	credential	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	\N	\N	\N	\N	\N	\N	f0bc12d4b9ea35b28d527314cd018712:8dcee277aea2a9efd51232218675dc88daee8dafe00c6f8d0b449e0491af5be5620320591851c6186b1fddec7c204aec702351addea48d2d8f6d87443022b686	2026-08-06 15:59:59.747+06	2026-08-06 16:28:25.919658+06
ofczYfAanP7yOTiK1vCh9P9WWr2bqAWk	bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	credential	bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	\N	\N	\N	\N	\N	\N	b6b7292f7be50991975111efc0c3bf6e:e4eb8f6f59c5d7688c59a63658644badb360c8a15f3dfbccbbe475f3ccc604a56cbca4d361f97c69ffe0e70071bf72974ae6acea6a89dde884195a22ed6bf8c3	2026-08-06 16:35:18.87+06	2026-08-06 16:35:18.87+06
ogzXtRnhQ5GpVsFbwXE5A44joosbL9tO	oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	credential	oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	\N	\N	\N	\N	\N	\N	377fd3cabf2fee0d3c65480ca708cd1b:95d6684c622361a584763c60eae502302a64f3845ba733fc669747f47e36815f471fbcfc341f87a478ed9c350ca7ebf19a4e3a9e4e0f276fc2a36790ea824ca5	2026-08-06 16:40:55.255+06	2026-08-06 16:40:55.255+06
pK0fXq1G1GZREhNgyXzeQN5HMuZ31SdQ	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	credential	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	\N	\N	\N	\N	\N	\N	9dd02e77694f40326fed5ac729860e57:2c6c51d2bef30f035963ec255b87d24d49aabf47ea81ef349c16a3454ec7a193bc5289aeec5974333d4de957f56b6ee0f505db450a7d68d089d5bf6a27fd714e	2026-08-04 13:49:49.978+06	2026-08-08 13:57:48.949189+06
\.


--
-- Data for Name: admission_application_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admission_application_notes (id, application_id, body, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: admission_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admission_applications (id, full_name, email, phone, course_id, course_name, message, status, status_updated_at, status_updated_by, reviewed_by, reviewed_at, created_at, updated_at, qualification, medical_college, bmdc_number, preferred_branch, course_slug, preferred_batch, address, applicant_message, submitted_at) FROM stdin;
8127e48a-cdef-4800-b220-2577cefd73de	Ariful Islam	arifulthejedi@gmail.com	+8801782368302	0ece52fb-a910-48c9-ad93-89c645fa5305	Certificate in Medical Ultrasound	hello i wan to get admission asap	new	\N	\N	\N	\N	2026-08-04 17:37:51.328493+06	2026-08-04 17:38:12.155159+06	MBBS	Dhaka Medical College	A-2345	Uttara	basic-ultrasound	oct-2026	T220/B, Tejgaon Gulshan Link Road, Tejgaon, Dhaka-1208	hello i wan to get admission asap	2026-08-04 17:37:51.328493+06
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, action, content_type, content_id, summary, previous_value, new_value, created_at) FROM stdin;
43db1ed5-0c89-4aa0-9f9e-73b8aaeea9e1	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	course.updated	course	0ece52fb-a910-48c9-ad93-89c645fa5305	Updated course "Certificate in Medical Ultrasound"	null	{"name": "Certificate in Medical Ultrasound", "slug": "basic-ultrasound", "status": "published"}	2026-08-04 16:40:12.011583+06
d201f9d1-cdee-4783-a4f5-97ab8fe9337f	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	faculty.updated	faculty	87ea0cb7-0ba4-4a9d-8f4b-3f3751774476	Updated faculty "Dr. A B M Sarwar Jahan"	null	{"name": "Dr. A B M Sarwar Jahan", "status": "published"}	2026-08-04 16:45:24.944227+06
84edaf0c-625f-4a02-9f38-75decabbc69d	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	faculty.updated	faculty	77ef29ac-2be4-4af2-9687-bf6a9c5a6fe3	Updated faculty "Dr. Mashrima Morshed Mishi"	null	{"name": "Dr. Mashrima Morshed Mishi", "status": "published"}	2026-08-04 16:45:50.971645+06
103be22f-7dc0-4e54-a08c-d17547c60da2	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	gallery.image_uploaded	gallery_image	ed620c2b-61ac-4ff8-b73e-f77365717610	Uploaded gallery image	null	null	2026-08-04 16:54:46.106942+06
fa177f1d-1980-48f8-9306-916e4a0b2f6e	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	gallery.image_uploaded	gallery_image	1131bfe2-5689-4ad6-84c3-1aa96b741f52	Uploaded gallery image	null	null	2026-08-04 16:55:22.129652+06
bc752e73-0c9a-4882-8fe0-8039bee376c9	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	gallery.image_uploaded	gallery_image	9fc548a8-c8c7-4fe7-8cfe-9b7f9be438ec	Uploaded gallery image	null	null	2026-08-04 16:56:15.120407+06
89a02740-cca0-4766-8a44-2d5e22a5c556	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	gallery.image_uploaded	gallery_image	c511627d-5045-4252-9e9a-bd080375584e	Uploaded gallery image	null	null	2026-08-04 16:56:38.680648+06
4b077bc4-3332-4467-b79d-3756620d16c2	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	notice.updated	notice	7982736d-a015-4e2b-bf7d-c2580fa5c8ff	Updated notice "Admissions open: July 2026 batch"	null	null	2026-08-04 17:07:14.988087+06
acf95167-f87a-4268-80d4-892e2e348a17	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	notice.updated	notice	717c6f31-b84e-47f7-9e57-2d21e1b152bc	Updated notice "Routine: Doppler Imaging â€” Batch 14"	null	null	2026-08-04 17:07:44.931386+06
42300dcd-ef7b-47ff-adc2-1b90f94eb18b	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	admission.updated	admission_application	8127e48a-cdef-4800-b220-2577cefd73de	Application details updated for Ariful Islam	null	{"name": "Ariful Islam"}	2026-08-04 17:38:12.156094+06
d935fcea-7170-4654-a9d6-4b763c6cd27c	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	certificate.created	certificate	88ac2082-675c-4b8a-ba18-3691c0692750	Certificate 77040234	null	null	2026-08-04 17:41:55.170034+06
3466e03d-bf16-475f-87fc-2bf939e5b84f	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	Updated admin@local.dev	{"role": "administrator", "status": "active", "fullName": "Local Admin"}	{"role": "administrator", "status": "active", "fullName": "Admin"}	2026-08-04 18:14:24.426161+06
53cc7e8d-ca28-4b34-bce9-fbd8389324d7	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	notice.updated	notice	7982736d-a015-4e2b-bf7d-c2580fa5c8ff	Updated notice "Admissions open: July 2026 batch"	null	null	2026-08-05 13:53:39.668279+06
993003ea-2061-406f-8f51-a76e3eb8ad33	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	notice.updated	notice	717c6f31-b84e-47f7-9e57-2d21e1b152bc	Updated notice "Routine: Doppler Imaging â€” Batch 14"	null	null	2026-08-05 13:53:54.620321+06
4c454ebb-590d-4d1c-8c44-5fba84a2d20f	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	testimonial.updated	testimonial	471b3a1c-1b78-4f55-861c-70f082cbed1b	Updated testimonial by "Dr. Sneha Maharjan"	null	{"name": "Dr. Sneha Maharjan", "role": "Radiology Resident", "is_published": true}	2026-08-05 15:22:54.925332+06
090d085f-aca9-4a45-a7f2-9e732617ccef	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Created arifulthejedi@gmail.com as web_manager (active)	null	{"role": "web_manager", "email": "arifulthejedi@gmail.com", "status": "active", "fullName": "Ariful"}	2026-08-06 14:58:20.616707+06
ac0927cd-86f0-463d-b592-13bee838b342	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "active", "fullName": "Ariful"}	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	2026-08-06 15:01:58.128697+06
46a913d6-0bca-476b-8689-a05427c1bd3f	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	{"status": "suspended"}	2026-08-06 15:02:06.304861+06
786395f9-fcbe-4e98-aa73-6033d454529a	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "suspended", "fullName": "Ariful"}	{"status": "inactive"}	2026-08-06 15:02:14.556474+06
ac0b1cf8-3248-4de4-a580-f14858d12d40	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	{"status": "suspended"}	2026-08-06 15:03:13.605433+06
a3280f95-f24c-484f-aaae-2d05dba7ad9d	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "suspended", "fullName": "Ariful"}	{"status": "inactive"}	2026-08-06 15:04:26.534337+06
b5cc151c-2fdd-4d71-9cee-4a73b88d93ea	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	{"status": "suspended"}	2026-08-06 15:04:37.180284+06
a198661d-ca43-49f8-a620-8b49585a9928	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "suspended", "fullName": "Ariful"}	{"status": "inactive"}	2026-08-06 15:06:08.325413+06
56fa5f75-f18d-4920-b845-da7fd8dc875c	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Dz6oyh9ndYcjkCseOPMZEPqJeVEq5Y3b	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	{"status": "suspended"}	2026-08-06 15:06:16.989525+06
cb0385b1-6408-4462-93d7-3caa77c3a0d6	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	MXGDMb0PRl3qTHLljfxpKEPXhF6fF8KA	Created arifulthejedi@gmail.com as web_manager (active)	null	{"role": "web_manager", "email": "arifulthejedi@gmail.com", "status": "active", "fullName": "Ariful"}	2026-08-06 15:30:11.122689+06
d2ceab50-89b4-4e3c-8d2c-2bdf8b251d24	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	MXGDMb0PRl3qTHLljfxpKEPXhF6fF8KA	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "active", "fullName": "Ariful"}	{"status": "inactive"}	2026-08-06 15:32:17.405834+06
d29e75d8-d537-4a11-814f-7d4b4a65959e	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	MXGDMb0PRl3qTHLljfxpKEPXhF6fF8KA	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "inactive", "fullName": "Ariful"}	{"status": "active"}	2026-08-06 15:34:39.989521+06
2b3c42fc-54a4-4479-b8a0-85e65776eabe	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_deleted	user	MXGDMb0PRl3qTHLljfxpKEPXhF6fF8KA	Permanently deleted arifulthejedi@gmail.com	{"role": "web_manager", "email": "arifulthejedi@gmail.com", "status": "active", "fullName": "Ariful"}	null	2026-08-06 15:35:11.646837+06
b8dae6d7-e846-4ca7-b7e2-329563dc815e	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	y8oWz2JHVobEyiLITfgiPWhWNa2RschC	Created arifulthejedi@gmail.com as web_manager (active)	null	{"role": "web_manager", "email": "arifulthejedi@gmail.com", "status": "active", "fullName": "Ariful"}	2026-08-06 15:35:24.715701+06
096c1535-014c-4171-bbaa-eb8f3046e21a	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	y8oWz2JHVobEyiLITfgiPWhWNa2RschC	Updated arifulthejedi@gmail.com	{"role": "web_manager", "status": "active", "fullName": "Ariful"}	{"status": "inactive"}	2026-08-06 15:36:59.696805+06
fabcc234-671e-4115-9874-3abf092ee82c	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_deleted	user	y8oWz2JHVobEyiLITfgiPWhWNa2RschC	Permanently deleted arifulthejedi@gmail.com	{"role": "web_manager", "email": "arifulthejedi@gmail.com", "status": "inactive", "fullName": "Ariful"}	null	2026-08-06 15:37:09.412112+06
e2b21822-2926-4986-8e1e-c281e294b4a7	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Created arifulthejedi@gmail.com as staff (active)	null	{"role": "staff", "email": "arifulthejedi@gmail.com", "status": "active", "fullName": "Ariful", "permissions": {"faqs": "none", "events": "none", "courses": "update", "faculty": "none", "gallery": "update", "notices": "none", "routines": "none", "dashboard": "view", "home_page": "view", "admissions": "none", "certificates": "none", "testimonials": "none", "education_aides": "none"}}	2026-08-06 15:59:59.75437+06
74ec7c3a-8746-4683-b9f1-816a6d7df641	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Updated arifulthejedi@gmail.com	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": ""}	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": "Web Manager", "permissions": {"faqs": "none", "events": "none", "courses": "update", "faculty": "none", "gallery": "update", "notices": "none", "routines": "none", "dashboard": "view", "home_page": "view", "admissions": "none", "certificates": "none", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:09:23.828278+06
82eb1ef2-c635-41e4-8fe3-4f2b2c1eaf2c	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	course.updated	course	805da249-964d-4b7f-b73d-62b546f36fb0	Updated course "Obstetric & Gynecological Ultrasound"	null	{"name": "Obstetric & Gynecological Ultrasound", "slug": "obstetric-ultrasound", "status": "published"}	2026-08-06 16:10:18.686951+06
69e45f98-9e59-4e55-899f-4d0f1229fa3c	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	course.updated	course	805da249-964d-4b7f-b73d-62b546f36fb0	Updated course "Obstetric & Gynecological Ultrasound"	null	{"name": "Obstetric & Gynecological Ultrasound", "slug": "obstetric-ultrasound", "status": "published"}	2026-08-06 16:10:52.610746+06
bd548a85-af16-42c4-91c3-3075ff970646	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	gallery.image_uploaded	gallery_image	98f1f4e1-dd3b-43be-86ce-c82c5e2ac527	Uploaded gallery image	null	null	2026-08-06 16:11:49.234018+06
82d08b27-f53d-4b07-a349-e451ea6268f5	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_password_set	user	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	Password set by administrator for admin@local.dev	null	null	2026-08-06 16:25:52.07628+06
89847a9c-e406-4e08-9c43-2248a9f9d82f	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_password_set	user	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	Password set by administrator for admin@local.dev	null	null	2026-08-06 16:27:46.663915+06
24ff9683-a71e-45ce-abd8-b849292a7c61	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_password_set	user	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Password set by administrator for arifulthejedi@gmail.com	null	null	2026-08-06 16:28:25.922343+06
11d50d09-1d1f-41c8-9775-323ed99deeec	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	Created suraiya@cmud.com as Admin Manager (active)	null	{"role": "staff", "email": "suraiya@cmud.com", "status": "active", "fullName": "Suraiya", "roleLabel": "Admin Manager", "permissions": {"faqs": "none", "events": "update", "courses": "none", "faculty": "update", "gallery": "none", "notices": "update", "routines": "update", "dashboard": "none", "home_page": "none", "admissions": "none", "certificates": "update", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:35:18.876624+06
772b4490-2dab-4b13-bd32-5ce88bbf3d84	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	Created layes@cmud.com as Manager (active)	null	{"role": "staff", "email": "layes@cmud.com", "status": "active", "fullName": "Md. Layes", "roleLabel": "Manager", "permissions": {"faqs": "none", "events": "none", "courses": "update", "faculty": "view", "gallery": "none", "notices": "none", "routines": "update", "dashboard": "view", "home_page": "view", "admissions": "view", "certificates": "view", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:40:55.261478+06
b0a48b0c-0feb-406d-8202-7b3733db1e80	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_invited	user	dce6336cfe7631167d4a02ac6223bb0c	Created sur@cmud.com as User (active)	null	{"role": "staff", "email": "sur@cmud.com", "status": "active", "fullName": "Suraiya", "roleLabel": "User", "permissions": {"faqs": "none", "events": "none", "courses": "none", "faculty": "none", "gallery": "none", "notices": "none", "routines": "none", "dashboard": "view", "home_page": "view", "admissions": "none", "certificates": "none", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:50:18.023084+06
59c893b4-65e2-4d4a-b4a1-8d7c8f2f6190	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	dce6336cfe7631167d4a02ac6223bb0c	Updated sur@cmud.com	{"role": "staff", "status": "active", "fullName": "Suraiya", "roleLabel": "User"}	{"status": "inactive"}	2026-08-06 16:52:31.36549+06
8223d946-8368-4bf3-803e-29677205bad2	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_deleted	user	dce6336cfe7631167d4a02ac6223bb0c	Permanently deleted sur@cmud.com	{"role": "staff", "email": "sur@cmud.com", "status": "inactive", "fullName": "Suraiya"}	null	2026-08-06 16:54:31.537501+06
ac523425-c23c-40ca-96eb-6ad02cb7de68	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Updated arifulthejedi@gmail.com	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": "Web Manager"}	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": "Web Manager", "permissions": {"faqs": "none", "events": "none", "courses": "update", "faculty": "view", "gallery": "update", "notices": "none", "routines": "none", "dashboard": "view", "home_page": "view", "admissions": "none", "certificates": "none", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:56:39.435472+06
0ad89b97-c660-46c8-95d0-599ed5d7dae8	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_updated	user	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Updated arifulthejedi@gmail.com	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": "Web Manager"}	{"role": "staff", "status": "active", "fullName": "Ariful", "roleLabel": "Web Manager", "permissions": {"faqs": "none", "events": "none", "courses": "view", "faculty": "view", "gallery": "update", "notices": "none", "routines": "none", "dashboard": "view", "home_page": "view", "admissions": "none", "certificates": "none", "testimonials": "none", "education_aides": "none"}}	2026-08-06 16:57:06.173562+06
711f729e-2b16-4f6f-8fba-31324b39e293	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	faculty.updated	faculty	77ef29ac-2be4-4af2-9687-bf6a9c5a6fe3	Updated faculty "Dr. Mashrima Morshed Mishi"	null	{"name": "Dr. Mashrima Morshed Mishi", "status": "published"}	2026-08-06 17:10:42.829788+06
47e66c73-d2a2-4ac2-b994-3119b1a0d26a	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	faculty.updated	faculty	77ef29ac-2be4-4af2-9687-bf6a9c5a6fe3	Updated faculty "Dr. Mashrima Morshed Mishi"	null	{"name": "Dr. Mashrima Morshed Mishi", "status": "published"}	2026-08-06 17:11:08.470265+06
15bd324b-cb98-4c72-92b0-ac4b14b86edb	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	certificate.updated	certificate	88ac2082-675c-4b8a-ba18-3691c0692750	Certificate 77040234	null	null	2026-08-06 17:37:39.018601+06
699c7d8f-1880-464b-9363-3767743a946d	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	user_password_set	user	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	Password set by administrator for admin@local.dev	null	null	2026-08-08 13:57:48.954383+06
6236877c-a552-475b-9af1-703b72fb594c	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	page.updated	page	07ddb119-c641-45d8-8d48-823ab5fd9ae7	Updated home page content	null	{"slug": "home", "title": "Home page"}	2026-08-10 12:23:10.901398+06
806ab5e8-ac0b-4344-bf3d-7b7e8abe47ef	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	page.updated	page	07ddb119-c641-45d8-8d48-823ab5fd9ae7	Updated home page content	null	{"slug": "home", "title": "Home page"}	2026-08-10 12:23:56.435526+06
0c7f8b46-ef1e-4f61-9fa4-989f26bae858	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	page.updated	page	07ddb119-c641-45d8-8d48-823ab5fd9ae7	Updated home page content	null	{"slug": "home", "title": "Home page"}	2026-08-10 12:24:11.348096+06
83d425c4-2158-4e07-94bb-01aa08e09803	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	page.updated	page	07ddb119-c641-45d8-8d48-823ab5fd9ae7	Updated home page content	null	{"slug": "home", "title": "Home page"}	2026-08-10 12:24:52.841065+06
0b8167a0-0142-4a70-8d58-e03c54e28fbb	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	page.updated	page	07ddb119-c641-45d8-8d48-823ab5fd9ae7	Updated home page content	null	{"slug": "home", "title": "Home"}	2026-08-10 12:25:07.025524+06
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, certificate_number, student_name, course_name, batch, bmdc_number, mobile_number, year_of_admission, created_at, updated_at) FROM stdin;
3b830a88-a82c-40b8-9c6d-6da88ca2023b	CMUD-DMU-2023-001	Dr. Ayesha Rahman	Diploma in Medical Ultrasound (DMU)	Batch A-2023	A-45231	01711001001	2023	2026-08-06 17:13:28.621117+06	2026-08-06 17:13:28.621117+06
ce5bc09e-78c5-4d9e-a715-aace448f5a7c	CMUD-OBS-2023-014	Dr. Rafiqul Islam	Certificate in Obstetric Ultrasound	Batch B-2023	A-38902	01711001002	2023	2026-08-06 17:13:28.632808+06	2026-08-06 17:13:28.632808+06
7f1e9142-4dd5-4f4b-b708-88511005fc2c	CMUD-MSK-2024-007	Dr. Nusrat Jahan	MSK Ultrasound Fellowship	Batch C-2024	A-50118	01822002003	2024	2026-08-06 17:13:28.633528+06	2026-08-06 17:13:28.633528+06
93132910-b3c7-4dcb-9408-d562947552c0	CMUD-DMU-2024-022	Dr. Tanvir Hasan	Diploma in Medical Ultrasound (DMU)	Batch A-2024	A-41776	01933003004	2024	2026-08-06 17:13:28.634083+06	2026-08-06 17:13:28.634083+06
7980bd4d-37da-4d03-a9c9-ecbcc857a7c7	CMUD-VAS-2022-009	Dr. Farhana Akter	Color Doppler & Vascular Ultrasound	Batch D-2022	A-29441	01644004005	2022	2026-08-06 17:13:28.634434+06	2026-08-06 17:13:28.634434+06
f54ab69c-080a-4609-8a12-a66e54e0a4ec	CMUD-TVS-2024-031	Dr. Mahmudul Karim	TVS & Gynecological Ultrasound	Batch E-2024	A-55890	01755005006	2024	2026-08-06 17:13:28.634756+06	2026-08-06 17:13:28.634756+06
bb7969aa-ba66-4929-aa2e-f6f9217d0538	CMUD-FET-2023-003	Dr. Salma Khatun	Fetal Medicine Workshop	Batch F-2023	A-36127	01866006007	2023	2026-08-06 17:13:28.635111+06	2026-08-06 17:13:28.635111+06
ff132b11-9c41-4a05-89f2-e6cf2aa91360	CMUD-DMU-2022-045	Dr. Imran Hossain	Diploma in Medical Ultrasound (DMU)	Batch A-2022	A-27355	01977007008	2022	2026-08-06 17:13:28.635405+06	2026-08-06 17:13:28.635405+06
50f7c78f-35cf-4daa-87cd-3eedaed5644f	CMUD-POC-2025-012	Dr. Rumana Chowdhury	POCUS Certificate Course	Batch G-2025	A-60214	01788008009	2025	2026-08-06 17:13:28.635682+06	2026-08-06 17:13:28.635682+06
584e238e-20d6-428c-b8fd-23282c5d2712	CMUD-ECHO-2024-018	Dr. Sabbir Ahmed	Echocardiography Module	Batch H-2024	A-48963	01899009010	2024	2026-08-06 17:13:28.636012+06	2026-08-06 17:13:28.636012+06
88ac2082-675c-4b8a-ba18-3691c0692750	77040234	Ariful Islam	Certificate in Medical Ultrasound	dec,2025	A-114007	01782368302	06/2036	2026-08-04 17:41:55.16+06	2026-08-06 17:37:39.017716+06
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, slug, name, category, duration, mode, eligibility, short_description, description, fee, discount_fee, syllabus, outcomes, featured, is_published, status, sort_order, image_url, seo_title, seo_description, created_by, updated_by, published_by, archived_by, published_at, archived_at, created_at, updated_at) FROM stdin;
bfc0957e-e0f2-44a9-8790-8a25e5b0f59b	advanced-doppler	Advanced Doppler Imaging	Advanced	4 Months	Onsite	Completion of Basic Ultrasound or equivalent experience	Master vascular, cardiac, and obstetric Doppler with daily scanning sessions.	An intensive program focused on color, spectral, and power Doppler. Daily live cases across peripheral vascular, carotid, renal, and fetal Doppler with expert mentorship.	85000	70000	{"Doppler physics & artefacts","Carotid & peripheral vascular Doppler","Renal & portal Doppler","Obstetric Doppler & fetal wellbeing","Cardiac Doppler basics"}	{"Confidently perform and interpret Doppler studies","Recognise vascular pathology early","Integrate Doppler into clinical decisions"}	t	t	published	1				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.607299+06	2026-08-04 15:47:28.607299+06
d63403ab-1e07-4459-b516-cf94f3ed09ce	msk-ultrasound	Musculoskeletal Ultrasound	Specialty	6 Weeks	Hybrid, Onsite	MBBS / Physiotherapists / Sports physicians	Joint-by-joint scanning protocol with live model demonstrations.	A practical MSK program covering shoulder, knee, ankle, wrist, and small joints. Includes ultrasound-guided injection techniques.	40000	32000	{"MSK probe selection & technique","Shoulder, elbow, wrist protocols","Hip, knee, ankle protocols","Nerve & tendon imaging","USG-guided injections"}	{"Independently scan major joints","Identify tears, effusions, and impingement","Assist in image-guided procedures"}	f	t	published	3				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.608142+06	2026-08-04 15:47:28.608142+06
dab827cb-bd00-400e-9f75-1e71043fdc42	echocardiography	Basic Echocardiography	Advanced	3 Months	Onsite	MBBS / Cardiology trainees	2D, M-mode and Doppler echocardiography with daily cardiac case practice.	A structured echo program led by senior cardiologists. Covers standard views, chamber quantification, valve assessment, and bedside echo for emergencies.	75000	60000	{"Standard echo views","Chamber quantification","Valvular heart disease","Doppler hemodynamics","Focused cardiac ultrasound (FoCUS)"}	{"Perform a complete adult echo study","Quantify ventricular function","Identify common valve pathology"}	f	t	published	4				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.60848+06	2026-08-04 15:47:28.60848+06
598900f0-f7a1-49c4-bcee-e37acb0fc895	emergency-pocus	Emergency POCUS	Foundation	4 Weeks	Onsite	Emergency physicians, ICU & critical-care doctors	Point-of-care ultrasound for ER, ICU and acute-care decisions.	Fast-track POCUS course built around real ER scenarios: FAST, lung, cardiac, IVC and procedural guidance.	30000	24000	{"FAST & e-FAST","Lung ultrasound","Focused cardiac ultrasound","IVC & volume status","USG-guided line placement"}	{"Run a POCUS protocol in under 10 minutes","Make bedside decisions with imaging support","Guide procedures safely with ultrasound"}	f	t	published	5				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.608828+06	2026-08-04 15:47:28.608828+06
2f99a6d1-28fe-4e03-8af6-5f1259ef6a33	medical-echocardiography	Advance Certificate in Medical Echocardiography	Advanced	8 Weeks	Onsite	MBBS / MD / Cardiology & internal medicine trainees	Comprehensive echocardiography training â€” standard views, chamber quantification, valves and Doppler hemodynamics.	An advanced echo certificate built around daily live scanning. Covers 2D, M-mode, color and spectral Doppler, with structured reporting practice on real cardiac cases mentored by senior cardiologists.	35000	30000	{"Cardiac anatomy & standard echo windows","Chamber quantification & LV function","Valvular heart disease assessment","Doppler hemodynamics & shunts","Pericardial disease & emergency echo"}	{"Perform a complete adult transthoracic echo","Quantify systolic and diastolic function","Detect and grade common valve pathology"}	f	t	published	6				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.609164+06	2026-08-04 15:47:28.609164+06
01c39557-3fcd-43fd-bde1-fb8d3def0f43	msk-certificate	Certificate in Musculoskeletal Ultrasound (MSK)	Advanced	8 Weeks	Hybrid, Onsite	MBBS / Physiotherapists / Sports & rehab physicians	Advanced joint-by-joint MSK scanning with live model practice and image-guided injection technique.	A certificate-level MSK program covering upper and lower limb joints, peripheral nerves, tendons and soft-tissue pathology. Includes hands-on ultrasound-guided injection workshops.	40000	35000	{"Probe selection & MSK scanning technique","Shoulder, elbow & wrist protocols","Hip, knee & ankle protocols","Peripheral nerve & tendon imaging","Ultrasound-guided injections"}	{"Independently scan all major joints","Identify tears, effusions and impingement syndromes","Assist confidently in image-guided MSK procedures"}	f	t	published	7				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.609508+06	2026-08-04 15:47:28.609508+06
305a8b53-c79b-4168-9a55-1951e4e3a703	paediatric-ultrasound	Certificate in Paediatric Ultrasound (CPU)	Advanced	8 Weeks	Onsite	MBBS / Paediatricians / Radiology trainees	Focused paediatric sonography â€” neonatal cranial, abdominal, hip and chest scanning protocols.	A specialised certificate course in paediatric ultrasound. Daily live cases cover neonatal brain, hip dysplasia screening, paediatric abdomen, urinary tract and chest, with age-appropriate reporting templates.	35000	30000	{"Neonatal cranial ultrasound","Developmental dysplasia of the hip (DDH)","Paediatric abdominal & urinary tract scan","Paediatric chest & soft-tissue imaging","Reporting & parent communication"}	{"Perform safe, age-appropriate paediatric scans","Screen for DDH and common neonatal pathology","Report paediatric studies to international standards"}	f	t	published	8				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.609856+06	2026-08-04 15:47:28.609856+06
805da249-964d-4b7f-b73d-62b546f36fb0	obstetric-ultrasound	Obstetric & Gynecological Ultrasound	Specialty	2 Months	Hybrid, Onsite	MBBS / MD / Postgraduate trainees	Trimester-wise obstetric scanning and complete gynae imaging protocol.	From early pregnancy scans to anomaly screening and 3D/4D obstetric imaging â€” all backed by structured reporting templates and protocol-driven practice.	55000	42000	{"Early pregnancy scan","Anomaly scan (Level II)","Fetal biometry & growth","Gynaecological pelvic scan","3D/4D fundamentals"}	{"Perform trimester-wise obstetric scans","Detect common fetal anomalies","Report gynae cases to international standards"}	t	t	published	2				\N	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	\N	\N	\N	\N	2026-08-04 15:47:28.60778+06	2026-08-06 16:10:52.609871+06
be3e252e-1065-4174-8dd7-750f01c463a3	target-organ	Certificate in Target Organ Ultrasound	Advanced	4 Weeks	Onsite	MBBS / Practising clinicians with basic ultrasound exposure	Focused organ-specific scanning â€” thyroid, breast, scrotum and small parts imaging.	A short, intensive certificate focused on targeted small-parts ultrasound. Trainees develop sharp protocol-driven scanning of thyroid, breast, scrotum and superficial lesions, with structured reporting practice.	30000	25000	{"Thyroid & parathyroid sonography","Breast ultrasound & BI-RADS reporting","Scrotal & testicular imaging","Superficial lumps & lymph node assessment","Image-guided FNA fundamentals"}	{"Perform focused small-parts ultrasound confidently","Apply BI-RADS / TI-RADS reporting frameworks","Recognise benign vs suspicious lesions"}	f	t	published	9				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.610187+06	2026-08-04 15:47:28.610187+06
04aae57d-b8f1-4de5-92ce-61b45b56c2b2	congenital-anomalies-detection	Congenital Anomalies Detection	Advanced	8 Weeks	Onsite	MBBS / Obstetricians / Radiologists with basic obstetric scanning experience	Systematic anomaly scanning â€” fetal organ surveys, soft markers and structured anomaly reporting.	An advanced fetal medicine course focused on the detection of congenital anomalies. Covers first, second and third trimester anomaly surveys, soft markers, and protocol-based reporting using international guidelines.	40000	35000	{"First trimester anomaly screening","Level II (anomaly) scan â€” head to toe","Fetal cardiac screening views","Soft markers & risk stratification","Structured anomaly reporting"}	{"Perform a complete fetal anomaly survey","Detect major structural anomalies confidently","Counsel and report findings using standard protocols"}	f	t	published	10				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.611049+06	2026-08-04 15:47:28.611049+06
eea4b577-f266-4aa6-9d1b-ada9338e09d5	pregnancy-profile	Hands-on Training â€” Pregnancy Profile	Advanced	6 Weeks	Onsite	MBBS / Obstetricians / Sonologists	Trimester-wise pregnancy scanning with daily hands-on practice on live patients.	An intensive hands-on program covering the complete pregnancy profile â€” viability, dating, anomaly, growth and wellbeing scans. Live patient sessions every day with one-to-one mentoring.	35000	35000	{"Early pregnancy & viability scan","Dating & nuchal translucency","Anomaly scan overview","Fetal growth & biometry","Liquor, placenta & fetal wellbeing"}	{"Perform trimester-wise pregnancy scans independently","Produce a complete pregnancy profile report","Assess fetal growth and wellbeing accurately"}	f	t	published	11				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.611377+06	2026-08-04 15:47:28.611377+06
4738c375-1974-4b43-83c5-97133e531839	tvs	Transvaginal Sonography (TVS)	Advanced	4 Weeks	Hybrid, Onsite	MBBS / Gynaecologists / Sonologists	Specialised TVS training â€” early pregnancy, gynaecological pelvis and infertility workup.	A focused transvaginal sonography course covering probe handling, early pregnancy assessment, detailed pelvic anatomy, follicular studies and common gynaecological pathology, with daily live scanning.	35000	25000	{"TVS probe handling & safety","Early pregnancy & ectopic assessment","Uterus, endometrium & adnexa","Follicular monitoring & infertility workup","TVS reporting protocols"}	{"Perform safe and structured TVS examinations","Diagnose early pregnancy and common pelvic pathology","Support infertility workups with follicular studies"}	f	t	published	12				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.611738+06	2026-08-04 15:47:28.611738+06
344d2448-8032-45fe-8568-1f0ba741d33d	admu	Advanced Diploma in Medical Ultrasound (ADMU)	Diploma / Masters	12â€“18 Months	Hybrid, Onsite	MBBS or equivalent medical graduate, or DMU-completed professionals	Advanced-level ultrasound training in Cardiac, 3D/4D, Vascular and Musculoskeletal imaging.	The Advanced Diploma in Medical Ultrasound (ADMU) is an upper-level program for clinicians who have completed DMU or a basic ultrasound course and want deeper clinical practice. Combines structured theory with extensive hands-on training across advanced modalities. Registration/admission fee: à§³40,000 (payable at admission).	160000	150000	{"3D/4D ultrasound techniques","Advanced Doppler & fetal scanning","Cardiac & vascular ultrasound","Musculoskeletal ultrasound applications","Clinical case studies & research module"}	{"Advanced Diploma in Medical Ultrasound (ADMU) certificate","Hands-on clinical training certificate","Enhanced opportunities in diagnostic centres and hospitals"}	t	t	published	13				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.612123+06	2026-08-04 15:47:28.612123+06
388bded2-01a0-4b48-a76b-cc8c88937a8d	dmu	Diploma in Medical Ultrasound (DMU)	Diploma / Masters	12 Months	Onsite	MBBS / BDS doctors, medical officers, CCD-completed physicians	Comprehensive diploma taking MBBS doctors from basic to advanced ultrasound scanning and reporting.	The Diploma in Medical Ultrasound (DMU) is designed for MBBS doctors building a specialised career in sonography. Follows an international-standard syllabus with in-depth theory and extended hands-on practice, so graduates can independently scan complex cases and produce accurate reports. Government of Bangladesh-approved certification on completion.	110000	90000	{"Advanced ultrasound physics & instrumentation","Abdominal ultrasound (hepatobiliary, pancreas, spleen, GI)","KUB â€” kidney, ureter & bladder imaging","Obs & Gynae ultrasound (all trimesters, basic anomaly)","Doppler â€” obstetric, carotid & peripheral vascular","Small parts â€” thyroid, breast, scrotum & soft tissue","Reporting, documentation & image standards"}	{"Independently perform and report complex ultrasound studies","Government-approved DMU certificate","Career support and pathway to advanced (ADMU) training"}	t	t	published	14				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.612492+06	2026-08-04 15:47:28.612492+06
96965d62-d15c-415a-82d6-1c1976bab07a	diploma-obs-gynae	Diploma in Obs/Gynae	Diploma / Masters	12 Months	Hybrid, Onsite	MBBS / BDS graduates and obstetric practitioners	Structured diploma in obstetric and gynaecological practice with focused sonography training.	A twelve-month diploma covering obstetric and gynaecological practice â€” antenatal care, common gynae conditions, and trimester-wise obstetric sonography â€” with a strong hands-on component alongside senior consultants.	75000	75000	{"Antenatal & postnatal care","Common gynaecological conditions","Obstetric ultrasound â€” all trimesters","Gynaecological pelvic scanning","Case-based reporting practice"}	{"Diploma in Obs/Gynae certificate","Confident obstetric and gynae clinical assessment","Independent trimester-wise obstetric scanning"}	f	t	published	15				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.612808+06	2026-08-04 15:47:28.612808+06
5208715f-68d2-4d2b-b6b5-e4b51623efda	pg-diploma-ultrasound	Post Graduate Diploma in Medical Ultrasound	Diploma / Masters	12 Months	Onsite	MBBS / BDS graduates and medical officers	Post-graduate diploma covering the full spectrum of diagnostic ultrasound with daily hands-on practice.	A post-graduate diploma for doctors seeking a formal qualification in diagnostic ultrasound. Combines structured theory with daily live-patient scanning across abdominal, obstetric, small-parts and Doppler imaging, mentored by senior sonologists.	80000	80000	{"Ultrasound physics, instrumentation & safety","Abdominal & KUB ultrasound","Obstetric & gynaecological ultrasound","Small parts & superficial structures","Basic Doppler applications","Structured reporting & documentation"}	{"Post Graduate Diploma in Medical Ultrasound certificate","Independently perform routine and advanced ultrasound studies","Ready for practice in diagnostic centres and hospitals"}	f	t	published	16				\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.613148+06	2026-08-04 15:47:28.613148+06
0ece52fb-a910-48c9-ad93-89c645fa5305	basic-ultrasound	Certificate in Medical Ultrasound	Foundation	3 Months	Hybrid, Onsite	MBBS / BDS / Final-year medical students	Foundational training covering ultrasound physics, knobology, and abdominal scanning.	Build a strong base in diagnostic ultrasound. Live patient demonstrations, daily hands-on practice, and case-based learning prepare you to perform routine abdominal, pelvic, and obstetric scans confidently.	20000	15000	{"Ultrasound physics & instrumentation","Abdominal sonography","Pelvic & obstetric scanning","KUB and thyroid imaging","Reporting & documentation"}	{"Perform routine abdominal and obstetric scans","Identify common pathology with confidence","Produce structured ultrasound reports"}	t	t	published	0	/media/courses/course-basic-ultrasound-1785840007128.png			\N	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	\N	\N	\N	\N	2026-08-04 15:47:28.605582+06	2026-08-04 16:40:12.009902+06
\.


--
-- Data for Name: education_aid_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.education_aid_sections (id, title, description, is_published, sort_order, created_at, updated_at) FROM stdin;
baf34425-0ba8-45c9-9431-3ab509481abf	Ultrasound Machine	Trainees learn on modern, high-resolution ultrasound machines with convex, linear, and phased-array probes â€” the same class of equipment used in leading diagnostic centres.\n\n	t	10	2026-08-04 17:08:54.227003+06	2026-08-04 17:08:54.227003+06
\.


--
-- Data for Name: education_aid_slides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.education_aid_slides (id, section_id, image_url, caption, sort_order, created_at) FROM stdin;
c4712a73-c19f-43e9-9e6f-a3a749be80df	baf34425-0ba8-45c9-9431-3ab509481abf	/media/education-aides/aid-slide-1785841986229.png	brand new machine	0	2026-08-04 17:13:06.243551+06
6623a8e2-e474-4f0b-a886-c3b007732ae9	baf34425-0ba8-45c9-9431-3ab509481abf	/media/education-aides/aid-slide-1785842051145.png		2	2026-08-04 17:14:11.159371+06
7f36a352-36e3-4d36-b31c-cf4a27622d7b	baf34425-0ba8-45c9-9431-3ab509481abf	/media/education-aides/aid-slide-1785842034888.png	3d 4d probe	1	2026-08-04 17:13:54.898167+06
\.


--
-- Data for Name: faculty; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faculty (id, name, title, credentials, specialty, bio, short_bio, full_bio, initials, photo_url, alt_text, is_published, status, sort_order, created_by, updated_by, published_by, archived_by, published_at, archived_at, created_at, updated_at, phone) FROM stdin;
586e04fe-b604-4d9c-80fb-e598dd58a706	Dr. M Nazmul Haque	ASSISTANT PROFESSOR â€” MEDICAL COLLEGE HOSPITAL	MBBS, MCPS(Medicine), D-CARD		Cardiology and Medicine specialist. scanning with 12+ years in tertiary care.	Cardiology and Medicine specialist. scanning with 12+ years in tertiary care.	Cardiology and Medicine specialist. scanning with 12+ years in tertiary care.	NH	/media/faculty/nazmul-cropped-3x4.5.png	Dr. M Nazmul Haque	t	published	2	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.599697+06	2026-08-04 15:47:28.599697+06	
05e4affa-24a5-4f01-b671-fdc98692e12d	Dr. Azim Anwar	Consultant Cardiologist	MBBS, MD, MRCP (UK)		Cardiology and Medicine specialist. Leads our echocardiography modules with a focus on practical bedside skill.	Cardiology and Medicine specialist. Leads our echocardiography modules with a focus on practical bedside skill.	Cardiology and Medicine specialist. Leads our echocardiography modules with a focus on practical bedside skill.	AA		Dr. Azim Anwar	t	published	3	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.600089+06	2026-08-04 15:47:28.600089+06	
cacf6289-2910-4e04-9a58-53cdd6797d8b	Dr. Sudipta Sarkar Shuvra	DMU, POCUS FACULTY	MBBS (BUP), DMU, PGT in Radiology and Imaging (DMCH)		Govt hospital	Govt hospital	Govt hospital	SS	/media/faculty/dr_sudipta-cropped-3x4.5.png	Dr. Sudipta Sarkar Shuvra	t	published	4	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.600453+06	2026-08-04 15:47:28.600453+06	
e804cc7f-c541-44fa-b6c7-483c1040dc44	Dr. Arina Parvin	PERMANENT FACULTY, TVS AND DMU	MBBS, DMU, Saline infusion Sonography (India)		Makes ultrasound physics intuitive through demonstrations and live phantom work.	Makes ultrasound physics intuitive through demonstrations and live phantom work.	Makes ultrasound physics intuitive through demonstrations and live phantom work.	AP	/media/faculty/dr_Arina_Parvin-cropped-3x4.5.png	Dr. Arina Parvin	t	published	5	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.600799+06	2026-08-04 15:47:28.600799+06	
cb640976-2f2e-4fd5-a46d-0402d4b15cf0	Dr. Auditi Debnath	MD AND PERMANENT FACULTY	MBBS (DU), DMU (CMUD), CCD (BIRDEM), PGT (Radiology and Imaging, DMCH)		Trained in TVS, Color Doppler Study and Anomaly Scan.	Trained in TVS, Color Doppler Study and Anomaly Scan.	Trained in TVS, Color Doppler Study and Anomaly Scan.	AD	/media/faculty/dr_auditi_debnath-cropped-3x4.5.png	Dr. Auditi Debnath	t	published	6	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.601154+06	2026-08-04 15:47:28.601154+06	
4d067c29-e29b-420c-bd61-e839718205cc	Dr. Shaheen Akhter	MANAGING DIR, PERMANENT FACULTY	MBBS, DMU, MPH, PGDMU		Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	SA	/media/faculty/dr_shaheen-cropped-3x4.5.png	Dr. Shaheen Akhter	t	published	7	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.601522+06	2026-08-04 15:47:28.601522+06	
64011338-7785-4d83-8a89-ed3e024ee881	Prof. Dr. Farida Yeasmin Shelley	PROFESSOR, SCHOOL OF SCIENCE & TECH (EX.), OPEN UNI	Faculty, PGDMU Program		Center for Medical Ultrasound & Doppler (CMUD).	Center for Medical Ultrasound & Doppler (CMUD).	Center for Medical Ultrasound & Doppler (CMUD).	FS		Prof. Dr. Farida Yeasmin Shelley	t	published	8	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.602021+06	2026-08-04 15:47:28.602021+06	
94b6dcf2-55e1-4a82-b415-dfd69f3bdb35	Dr. Mohammad Rezaul Kabir	Faculty Member of CMUD	MBBS, BCS (Health), MD (Radiology & Imaging)		Consultant Sonologist of Thyroid Clinic.	Consultant Sonologist of Thyroid Clinic.	Consultant Sonologist of Thyroid Clinic.	RK		Dr. Mohammad Rezaul Kabir	t	published	9	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.602453+06	2026-08-04 15:47:28.602453+06	
85c1a688-f19f-4291-8af4-237e37e9383d	Dr. Ferdous Akhter	ADDVISOR, LEAD 	MBBS, DMU, PGDMU, TVS		Senior Medical Officer, Ministry of Labor.	Senior Medical Officer, Ministry of Labor.	Senior Medical Officer, Ministry of Labor.	FA		Dr. Ferdous Akhter	t	published	10	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.602765+06	2026-08-04 15:47:28.602765+06	
c99f321b-b424-450f-93c7-506018fa9ce5	Dr. Subrata Bhowmik	ADMU, DMU, DOPPLER LEAD	MBBS, BCS, CCD (Diabetes) (BIRDEM), DOC (Dermatology), FCPS (Medicine) (Final Part), MD (Cardiology) (Course) (BSMMU), DMU		Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	SB	/media/faculty/dr_subrata_bhowmik-cropped-3x4.5.png	Dr. Subrata Bhowmik	t	published	11	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.603112+06	2026-08-04 15:47:28.603112+06	
0425e603-a6ea-4a53-b62d-d52d48c7d0c8	Dr. Shirina Yeasmin	Faculty, Center for Medical Ultrasound & Doppler (CMUD)	MBBS (Dhaka), CCD, DMU, PGT (Gynecology & OBS)		Specially Trained in TVS & Color Doppler. Consultant Sonologist, Thyroid Clinic.	Specially Trained in TVS & Color Doppler. Consultant Sonologist, Thyroid Clinic.	Specially Trained in TVS & Color Doppler. Consultant Sonologist, Thyroid Clinic.	SY		Dr. Shirina Yeasmin	t	published	12	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.603488+06	2026-08-04 15:47:28.603488+06	
9c3c012e-4177-4498-9636-f2c3526a676a	Dr. Farzana Alam	LEAD IN ADVANCED COURSES, DMU	MBBS, PGDMU		Specially Trained in TVS and Color Doppler, Anomaly Scan. Consultant Sonologist, Thyroid Clinic.	Specially Trained in TVS and Color Doppler, Anomaly Scan. Consultant Sonologist, Thyroid Clinic.	Specially Trained in TVS and Color Doppler, Anomaly Scan. Consultant Sonologist, Thyroid Clinic.	FL	/media/faculty/dr_farzana-cropped-3x4.5.png	Dr. Farzana Alam	t	published	13	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.60378+06	2026-08-04 15:47:28.60378+06	
5b2a2ed3-73d3-4f0d-8b08-31cfa57293b7	Dr. Rahela Akhter Liza	Faculty of Center for Medical Ultrasound & Doppler (CMUD)	MBBS (Dhaka), PGT (Gynae & OBS), CCD (Diabetes), DMU (CMUD)		Experienced in Gynae, Infertility, Breast, Thyroid & Skin Diseases. Consultant Sonologist, Thyroid Clinic.	Experienced in Gynae, Infertility, Breast, Thyroid & Skin Diseases. Consultant Sonologist, Thyroid Clinic.	Experienced in Gynae, Infertility, Breast, Thyroid & Skin Diseases. Consultant Sonologist, Thyroid Clinic.	RL		Dr. Rahela Akhter Liza	t	published	14	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.604062+06	2026-08-04 15:47:28.604062+06	
7f39ba6d-fb7a-4b88-ad29-ae341e835d4f	Dr. Sharmin Binte Seraz	Assistant Professor, Dr. M R Khan Shishu Hospital & Institute of Child Health	MBBS, MS (Pediatric surgery)		Faculty of Center for Medical Ultrasound & Doppler (CMUD).	Faculty of Center for Medical Ultrasound & Doppler (CMUD).	Faculty of Center for Medical Ultrasound & Doppler (CMUD).	SR		Dr. Sharmin Binte Seraz	t	published	15	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.604347+06	2026-08-04 15:47:28.604347+06	
a268a6b9-4832-4e33-96ee-f8ef703ad3f9	Dr. Farzana Kabir	Faculty of Center for Medical Ultrasound & Doppler (CMUD)	MBBS (DMC), FCPS (Child), MCPS (Child)		Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	Consultant Sonologist, Thyroid Clinic.	FK		Dr. Farzana Kabir	t	published	16	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.604701+06	2026-08-04 15:47:28.604701+06	
87ea0cb7-0ba4-4a9d-8f4b-3f3751774476	Dr. A B M Sarwar Jahan	PAIN MEDICINE AND MSK LEAD 	MBBS, D A FIPM (India), MSK USG (India), Fellowship in MSK USG in Pain Med (Ind), Bangladesh Medical University		Over 18 years of diagnostic imaging experience. Lead trainer for obstetric and fetal medicine programs.	Over 18 years of diagnostic imaging experience. Lead trainer for obstetric and fetal medicine programs.	Over 18 years of diagnostic imaging experience. Lead trainer for obstetric and fetal medicine programs.	SJ	/media/faculty/sarwar-jahan-cropped-3x4.5.png	Dr. A B M Sarwar Jahan	t	published	1	\N	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	\N	\N	\N	\N	2026-08-04 15:47:28.597752+06	2026-08-04 16:45:24.933451+06	
77ef29ac-2be4-4af2-9687-bf6a9c5a6fe3	Dr. Mashrima Morshed Mishi	OBS AND GYNAE LEAD	MBBS, BCS 39, MS (Obs and Gynae) DMCH, FCPS P2, Reproductive Endocrinology $ infertility, MRCOG P1(UK)		Young and Emerging Lead mentor in Diploma in OBS Gyane	Young and Emerging Lead mentor in Diploma in OBS Gyane	Young and Emerging Lead mentor in Diploma in OBS Gyane	MM		Dr. Mashrima Morshed Mishi	t	published	0	\N	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	\N	\N	\N	\N	2026-08-04 15:47:28.59927+06	2026-08-06 17:11:08.468745+06	01723454651
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faqs (id, question, answer, is_published, status, sort_order, created_by, updated_by, published_by, archived_by, published_at, archived_at, created_at, updated_at) FROM stdin;
f0cbf415-30e2-4895-b7b0-728a673b2a28	Who can apply to CMUD courses?	Most programs are open to MBBS, BDS, postgraduate trainees, and allied health professionals. Each course page lists specific eligibility.	t	published	0	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.623736+06	2026-08-04 15:47:28.623736+06
ac9dd77a-d9e4-4b16-a3cd-b5bf68b1c164	How much hands-on scanning will I get?	We cap batch sizes so each trainee gets a minimum of two hours of daily live scanning with real patients and standardised protocols.	t	published	1	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.624813+06	2026-08-04 15:47:28.624813+06
bd2aa929-a104-4167-9939-2958d2ad7a5e	Will I receive a certificate?	Yes. CMUD certificates are issued on successful completion of the course, including a practical assessment and a structured reporting test.	t	published	2	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.625104+06	2026-08-04 15:47:28.625104+06
00d71dfd-4e43-4cf6-a320-9b4d69bf85f2	Are courses available online?	Theory components for several courses are available online, but hands-on modules require onsite attendance at our training centre.	t	published	3	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.625348+06	2026-08-04 15:47:28.625348+06
811e5589-61cd-454d-9b0c-4c358efa1dc5	Do you offer instalment payment?	Yes. Most full-length courses can be paid in two or three instalments. Please contact admissions for details.	t	published	4	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.625619+06	2026-08-04 15:47:28.625619+06
e882e8a1-8782-4529-9808-38979fede6a3	Is there a placement support?	We maintain an alumni network and share opportunities from partner hospitals and diagnostic centres with our graduates.	t	published	5	\N	\N	\N	\N	\N	\N	2026-08-04 15:47:28.625922+06	2026-08-04 15:47:28.625922+06
\.


--
-- Data for Name: gallery_albums; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_albums (id, title, caption, category, is_published, status, sort_order, created_at, updated_at) FROM stdin;
31b7d874-cdad-4eee-9327-1f3bb09c3069	Hands-on scanning lab	Trainees practising abdominal protocols		t	published	0	2026-08-04 15:47:28.613751+06	2026-08-04 15:47:28.613751+06
e3e02d7c-2579-48b3-b0bb-e65938d5a7a4	Doppler workshop	Live carotid Doppler demonstration		t	published	1	2026-08-04 15:47:28.614876+06	2026-08-04 15:47:28.614876+06
318539af-a79b-4f93-a7f5-997fe500c1a7	OB-GYN module	Anomaly scan tutorial in progress		t	published	2	2026-08-04 15:47:28.61513+06	2026-08-04 15:47:28.61513+06
523189aa-9753-44c3-a890-439b8c0cdf23	Reporting room	Structured reporting & case review		t	published	3	2026-08-04 15:47:28.615383+06	2026-08-04 15:47:28.615383+06
cca12dc7-a7e7-454c-8c39-a47503910736	Echo training	Bedside echocardiography session		t	published	4	2026-08-04 15:47:28.615635+06	2026-08-04 15:47:28.615635+06
f5171445-c853-4b14-97f2-3977bcf9a05e	Convocation 2025	Certificate distribution ceremony		t	published	5	2026-08-04 15:47:28.615874+06	2026-08-04 15:47:28.615874+06
54b9e47a-a470-49c0-8c62-262ff4923715	MSK lab	Joint scanning on live models		t	published	6	2026-08-04 15:47:28.616136+06	2026-08-04 15:47:28.616136+06
63725551-8d60-4ceb-92ee-c8c0627d92e5	International faculty visit	Guest lecture on fetal Doppler		t	published	7	2026-08-04 15:47:28.616438+06	2026-08-04 15:47:28.616438+06
\.


--
-- Data for Name: gallery_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_images (id, album_id, url, alt_text, caption, sort_order, created_at) FROM stdin;
ed620c2b-61ac-4ff8-b73e-f77365717610	31b7d874-cdad-4eee-9327-1f3bb09c3069	/media/gallery/gallery-img-1785840886082.png		tvs model	0	2026-08-04 16:54:46.095159+06
1131bfe2-5689-4ad6-84c3-1aa96b741f52	31b7d874-cdad-4eee-9327-1f3bb09c3069	/media/gallery/gallery-img-1785840922114.png	alt wes image	wes test image	1	2026-08-04 16:55:22.127299+06
9fc548a8-c8c7-4fe7-8cfe-9b7f9be438ec	e3e02d7c-2579-48b3-b0bb-e65938d5a7a4	/media/gallery/gallery-img-1785840975110.png			0	2026-08-04 16:56:15.119272+06
c511627d-5045-4252-9e9a-bd080375584e	e3e02d7c-2579-48b3-b0bb-e65938d5a7a4	/media/gallery/gallery-img-1785840998669.png	Anomalies test	Grammar	1	2026-08-04 16:56:38.679416+06
\.


--
-- Data for Name: notice_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notice_attachments (id, notice_id, file_url, file_name, display_name, sort_order, created_at) FROM stdin;
7e0296b9-287b-45cd-806d-037cd9915656	7982736d-a015-4e2b-bf7d-c2580fa5c8ff	/attachment/notice-attachment/notice-1785841626432.png	notice-1785841471279.png	notice1	0	2026-08-05 13:53:39.656366+06
170d33c0-c172-4daa-aef5-9b88d1db2644	7982736d-a015-4e2b-bf7d-c2580fa5c8ff	/attachment/notice-attachment/notice-1785841631715.png	notice-1784297513406-0pz59z.png	notice-2	1	2026-08-05 13:53:39.656366+06
1e5f958f-75b8-471a-8665-eed34af47607	717c6f31-b84e-47f7-9e57-2d21e1b152bc	/attachment/notice-attachment/notice-1785841662280.pdf	notice-1784296749879-f0dt2t.pdf	notice3	0	2026-08-05 13:53:54.619794+06
\.


--
-- Data for Name: notice_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notice_categories (id, name, slug, created_at) FROM stdin;
2a8c3f0d-56ca-4afa-8477-7bcafc871fd1	Notice	notice	2026-08-04 15:47:28.617171+06
8da49d4b-4ee7-4d72-8437-c6c6c54f9918	Routine	routine	2026-08-04 15:47:28.618852+06
7e8e413f-c860-41ba-a8fa-5d59b382be09	Result	result	2026-08-04 15:47:28.619158+06
1220e166-6abc-4c34-bf69-e12a6583eaf2	Event	event	2026-08-04 15:47:28.619472+06
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notices (id, title, body, notice_date, category_id, attachment_url, is_published, status, sort_order, created_at, updated_at) FROM stdin;
de2f1ed6-fa41-45f6-8967-c773a5e8b0bd	Results published: April 2026 batch	Certificates can be collected from the CMUD administrative office after June 30, 2026.	2026-06-18	7e8e413f-c860-41ba-a8fa-5d59b382be09	\N	t	published	2	2026-08-04 15:47:28.622528+06	2026-08-04 15:47:28.622528+06
41fcb2af-c7c8-499b-90dc-1732a92acdc9	Workshop: Fetal Echocardiography	Two-day intensive workshop with international faculty on July 12â€“13, 2026.	2026-06-10	1220e166-6abc-4c34-bf69-e12a6583eaf2	\N	t	published	3	2026-08-04 15:47:28.622876+06	2026-08-04 15:47:28.622876+06
571e932b-a77b-4bf4-be49-9bb198cb172c	New MSK ultrasound batch starting	Limited 12 seats. Includes live model scanning and USG-guided injection practice.	2026-05-30	2a8c3f0d-56ca-4afa-8477-7bcafc871fd1	\N	t	published	4	2026-08-04 15:47:28.623181+06	2026-08-04 15:47:28.623181+06
7982736d-a015-4e2b-bf7d-c2580fa5c8ff	Admissions open: July 2026 batch	Apply now for the July intake of Basic Ultrasound, Advanced Doppler, and OB-GYN Ultrasound. Limited seats per batch to ensure quality hands-on time.	2026-06-21	2a8c3f0d-56ca-4afa-8477-7bcafc871fd1	\N	t	published	0	2026-08-04 15:47:28.620767+06	2026-08-05 13:53:39.651433+06
717c6f31-b84e-47f7-9e57-2d21e1b152bc	Routine: Doppler Imaging â€” Batch 14	Theory 7â€“9 AM, Hands-on 9â€“11 AM, Monday to Friday. Reporting workshop on Saturdays.	2026-06-18	8da49d4b-4ee7-4d72-8437-c6c6c54f9918	\N	t	published	1	2026-08-04 15:47:28.622141+06	2026-08-05 13:53:54.618173+06
\.


--
-- Data for Name: page_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_content (id, slug, title, meta_title, meta_description, page_data, updated_at) FROM stdin;
07ddb119-c641-45d8-8d48-823ab5fd9ae7	home	Home	\N	\N	{"hero": {"badge": "Admissions open â€” July 2026", "stats": [{"label": "Trainees", "value": "1,200+"}, {"label": "Years", "value": "12"}, {"label": "Faculty", "value": "25+"}], "heading": "Master medical ultrasound with hands-on training that matters.", "imageAlt": "CMUD instructor demonstrating ultrasound scanning", "imageUrl": "", "description": "CMUD is a dedicated institute for diagnostic ultrasound and Doppler imaging. Learn from senior consultants, scan real patients daily, and graduate ready to practise. Get Free repeat Classes and unlimited practical session for 1 year.", "primaryCtaHref": "/admission", "primaryCtaLabel": "Apply Now", "secondaryCtaHref": "/courses", "secondaryCtaLabel": "View Courses"}, "handsOn": {"title": "Real patients. Real protocols. Real reports.", "bullets": ["Small batches of 3-5 trainees per advanced course", "Daily live patient scanning sessions", "Structured reporting templates", "Everyday Case review of own clinic patients"], "ctaHref": "/about", "eyebrow": "Hands-on Ultrasound Training", "ctaLabel": "More about CMUD", "imageAlt": "Trainee performing an obstetric ultrasound scan", "imageUrl": "", "badgeLabel": "scans per trainee", "badgeValue": "120+", "description": "CMUD has integrated clinic and partnered with NGOs so you practise on actual cases â€” from routine abdominal scans to complex fetal Doppler â€” under expert supervision."}}	2026-08-10 12:25:07.024798+06
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, email, status, last_login_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") FROM stdin;
3KLO8q63lp28UnHJJqQIbQmuxDMpg8st	2026-08-18 16:25:38.288+06	lWlWNdKDmy94bR4DWsGvp7VG68SoJc6u	2026-08-08 14:23:49.766+06	2026-08-11 16:25:38.288+06	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk
3dbFUdEUJxso6A697k1ruvnGbHYmr0Ux	2026-08-13 16:55:51.787+06	P9BH4eogOrD1b2vLBqgj5KTP39u9hZrP	2026-08-06 16:55:51.787+06	2026-08-06 16:55:51.787+06	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, name, role, quote, initials, is_published, status, sort_order, created_at, updated_at, photo_url) FROM stdin;
077eeaa0-c2ac-4464-89b2-380807f0c914	Dr. Ashok Bhandari	General Practitioner	Faculty are approachable and the structured reporting templates have changed how I work in my clinic.	AB	t	published	1	2026-08-04 15:47:28.627551+06	2026-08-04 15:47:28.627551+06	
108608ed-d605-4b25-aea7-a7cf12a78480	Dr. Rekha Joshi	OB-GYN Consultant	The OB-GYN module is rigorous and protocol-driven. I now feel fully confident with anomaly scans.	RJ	t	published	2	2026-08-04 15:47:28.627829+06	2026-08-04 15:47:28.627829+06	
65d8e1a3-c088-4e4b-9551-6833df836640	Dr. Manish Khatri	Emergency Physician	POCUS at CMUD changed how I make decisions in the ER. Every session was case-driven and practical.	MK	t	published	3	2026-08-04 15:47:28.628104+06	2026-08-04 15:47:28.628104+06	
471b3a1c-1b78-4f55-861c-70f082cbed1b	Dr. Sneha Maharjan	Radiology Resident	The hands-on hours at CMUD are unmatched. I scanned more patients here in three months than I had in my first year of residency.	SM	t	published	0	2026-08-04 15:47:28.626453+06	2026-08-05 15:22:54.923794+06	/media/testimonials/testimonial-dr-sneha-maharjan-1785921770688.png
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, status, role_label) FROM stdin;
Jz2Tccc4qAfZ0UZmJyEX5rXCl0GlI2mk	Admin	admin@local.dev	f	\N	2026-08-04 13:49:49.964+06	2026-08-04 18:14:24.425812+06	administrator	active	
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	Suraiya	suraiya@cmud.com	f	\N	2026-08-06 16:35:18.867+06	2026-08-06 16:35:18.873805+06	staff	active	Admin Manager
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	Md. Layes	layes@cmud.com	f	\N	2026-08-06 16:40:55.253+06	2026-08-06 16:40:55.258491+06	staff	active	Manager
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	Ariful	arifulthejedi@gmail.com	f	\N	2026-08-06 15:59:59.746+06	2026-08-06 16:57:06.170443+06	staff	active	Web Manager
\.


--
-- Data for Name: user_content_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_content_permissions (user_id, section, access) FROM stdin;
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	faculty	update
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	notices	update
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	routines	update
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	events	update
bQA5MU0kf9WnfjA2ZZk1u61Fp7xrw6Ek	certificates	update
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	dashboard	view
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	home_page	view
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	courses	update
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	faculty	view
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	routines	update
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	admissions	view
oqJK2jHwYCoDqWBH4sqnfVKFUkG6wVOC	certificates	view
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	dashboard	view
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	home_page	view
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	courses	view
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	faculty	view
Hh7OcyN4KZ8fwUQURebGAfx5CEGgTOQP	gallery	update
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: admission_application_notes admission_application_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_application_notes
    ADD CONSTRAINT admission_application_notes_pkey PRIMARY KEY (id);


--
-- Name: admission_applications admission_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: education_aid_sections education_aid_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_aid_sections
    ADD CONSTRAINT education_aid_sections_pkey PRIMARY KEY (id);


--
-- Name: education_aid_slides education_aid_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_aid_slides
    ADD CONSTRAINT education_aid_slides_pkey PRIMARY KEY (id);


--
-- Name: faculty faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: gallery_albums gallery_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_albums
    ADD CONSTRAINT gallery_albums_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: notice_attachments notice_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_attachments
    ADD CONSTRAINT notice_attachments_pkey PRIMARY KEY (id);


--
-- Name: notice_categories notice_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_categories
    ADD CONSTRAINT notice_categories_pkey PRIMARY KEY (id);


--
-- Name: notice_categories notice_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_categories
    ADD CONSTRAINT notice_categories_slug_key UNIQUE (slug);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- Name: page_content page_content_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: user_content_permissions user_content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_content_permissions
    ADD CONSTRAINT user_content_permissions_pkey PRIMARY KEY (user_id, section);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");


--
-- Name: certificates_certificate_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_certificate_number_idx ON public.certificates USING btree (certificate_number);


--
-- Name: session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: admission_application_notes admission_application_notes_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_application_notes
    ADD CONSTRAINT admission_application_notes_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.admission_applications(id) ON DELETE CASCADE;


--
-- Name: admission_applications admission_applications_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: education_aid_slides education_aid_slides_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_aid_slides
    ADD CONSTRAINT education_aid_slides_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.education_aid_sections(id) ON DELETE CASCADE;


--
-- Name: gallery_images gallery_images_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.gallery_albums(id) ON DELETE CASCADE;


--
-- Name: notice_attachments notice_attachments_notice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_attachments
    ADD CONSTRAINT notice_attachments_notice_id_fkey FOREIGN KEY (notice_id) REFERENCES public.notices(id) ON DELETE CASCADE;


--
-- Name: notices notices_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.notice_categories(id) ON DELETE SET NULL;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_content_permissions user_content_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_content_permissions
    ADD CONSTRAINT user_content_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


