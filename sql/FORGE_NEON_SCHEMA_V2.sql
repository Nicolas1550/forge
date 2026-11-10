-- FORGE | Build Your Rig | V2 (SQL original en ingles)
-- IMPORTANTE: ejecuta este archivo exactamente como esta, sin traducir palabras SQL.
-- En Chrome: no utilizar la traduccion automatica al copiar el codigo.
-- PostgreSQL / Neon - Esquema inicial para ecommerce + configurador de PC 3D
-- Pegar y ejecutar completo en Neon > SQL Editor (no en PowerShell).
-- No borra ni modifica tablas de EON / GENESIS u otros proyectos.
-- Todas las tablas usan el prefijo forge_.
-- Puedes volver a ejecutar este script; no sobrescribe productos ni pedidos.

BEGIN;

CREATE TABLE IF NOT EXISTS public.forge_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    auth_subject TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.forge_categories(id) ON DELETE RESTRICT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.forge_products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    variant_name TEXT NOT NULL DEFAULT 'Estándar',
    price_ars NUMERIC(14, 2) NOT NULL CHECK (price_ars >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(attributes) = 'object'),
    specs JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(specs) = 'object'),
    image_url TEXT,
    model_glb_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.forge_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.forge_product_variants(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL DEFAULT 'image'
        CHECK (media_type IN ('image', 'video', 'model3d')),
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.forge_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'converted', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.forge_carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.forge_product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS public.forge_pc_builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.forge_users(id) ON DELETE SET NULL,
    cart_id UUID REFERENCES public.forge_carts(id) ON DELETE SET NULL,
    name TEXT NOT NULL DEFAULT 'Mi PC personalizada',
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'saved', 'quoted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_pc_build_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_id UUID NOT NULL REFERENCES public.forge_pc_builds(id) ON DELETE CASCADE,
    slot TEXT NOT NULL CHECK (slot IN (
        'cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case', 'cooler', 'fans'
    )),
    variant_id UUID NOT NULL REFERENCES public.forge_product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (build_id, slot)
);

CREATE TABLE IF NOT EXISTS public.forge_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    user_id UUID REFERENCES public.forge_users(id) ON DELETE SET NULL,
    cart_id UUID REFERENCES public.forge_carts(id) ON DELETE SET NULL,
    build_id UUID REFERENCES public.forge_pc_builds(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    customer_notes TEXT,
    checkout_channel TEXT NOT NULL DEFAULT 'whatsapp'
        CHECK (checkout_channel IN ('whatsapp', 'web')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft', 'whatsapp_opened', 'contacted', 'confirmed', 'cancelled'
        )),
    total_ars NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_ars >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.forge_orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.forge_product_variants(id) ON DELETE SET NULL,
    sku_snapshot TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    unit_price_ars NUMERIC(14, 2) NOT NULL CHECK (unit_price_ars >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_ars NUMERIC(14, 2) GENERATED ALWAYS AS (unit_price_ars * quantity) STORED
);

CREATE TABLE IF NOT EXISTS public.forge_order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.forge_orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forge_store_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name TEXT NOT NULL DEFAULT 'FORGE | Build Your Rig',
    whatsapp_e164 TEXT,
    currency_code TEXT NOT NULL DEFAULT 'ARS' CHECK (currency_code = 'ARS'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forge_products_category_idx
    ON public.forge_products(category_id);
CREATE INDEX IF NOT EXISTS forge_products_active_featured_idx
    ON public.forge_products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS forge_variants_product_idx
    ON public.forge_product_variants(product_id);
CREATE INDEX IF NOT EXISTS forge_media_product_sort_idx
    ON public.forge_product_media(product_id, sort_order);
CREATE INDEX IF NOT EXISTS forge_carts_user_idx
    ON public.forge_carts(user_id);
CREATE INDEX IF NOT EXISTS forge_cart_items_cart_idx
    ON public.forge_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS forge_pc_builds_user_idx
    ON public.forge_pc_builds(user_id);
CREATE INDEX IF NOT EXISTS forge_build_items_build_idx
    ON public.forge_pc_build_items(build_id);
CREATE INDEX IF NOT EXISTS forge_orders_status_date_idx
    ON public.forge_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS forge_orders_user_idx
    ON public.forge_orders(user_id);
CREATE INDEX IF NOT EXISTS forge_order_items_order_idx
    ON public.forge_order_items(order_id);
CREATE INDEX IF NOT EXISTS forge_order_events_order_date_idx
    ON public.forge_order_events(order_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.forge_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forge_users_touch ON public.forge_users;
CREATE TRIGGER forge_users_touch BEFORE UPDATE ON public.forge_users
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_products_touch ON public.forge_products;
CREATE TRIGGER forge_products_touch BEFORE UPDATE ON public.forge_products
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_variants_touch ON public.forge_product_variants;
CREATE TRIGGER forge_variants_touch BEFORE UPDATE ON public.forge_product_variants
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_carts_touch ON public.forge_carts;
CREATE TRIGGER forge_carts_touch BEFORE UPDATE ON public.forge_carts
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_cart_items_touch ON public.forge_cart_items;
CREATE TRIGGER forge_cart_items_touch BEFORE UPDATE ON public.forge_cart_items
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_pc_builds_touch ON public.forge_pc_builds;
CREATE TRIGGER forge_pc_builds_touch BEFORE UPDATE ON public.forge_pc_builds
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_orders_touch ON public.forge_orders;
CREATE TRIGGER forge_orders_touch BEFORE UPDATE ON public.forge_orders
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

DROP TRIGGER IF EXISTS forge_settings_touch ON public.forge_store_settings;
CREATE TRIGGER forge_settings_touch BEFORE UPDATE ON public.forge_store_settings
FOR EACH ROW EXECUTE FUNCTION public.forge_touch_updated_at();

INSERT INTO public.forge_store_settings(id, store_name)
VALUES (1, 'FORGE | Build Your Rig')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forge_categories (slug, name, sort_order) VALUES
    ('cpu', 'Procesadores', 10),
    ('motherboard', 'Motherboards', 20),
    ('gpu', 'Placas de video', 30),
    ('ram', 'Memorias RAM', 40),
    ('storage', 'Almacenamiento', 50),
    ('psu', 'Fuentes de alimentación', 60),
    ('case', 'Gabinetes', 70),
    ('cooler', 'Refrigeración', 80),
    ('fans', 'Ventiladores', 90),
    ('peripherals', 'Periféricos', 100)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- COMPROBACIÓN: debería devolver 13 tablas y 10 categorías.
SELECT COUNT(*) AS tablas_forge
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND table_name LIKE 'forge_%';

SELECT slug, name FROM public.forge_categories ORDER BY sort_order;

-- EJEMPLOS PARA FUTUROS PRODUCTOS (NO SE EJECUTAN):
-- CPU specs: {"socket":"LGA1700","tdp_watts":125}
-- Motherboard specs: {"socket":"LGA1700","memory_type":"DDR5","form_factor":"ATX"}
-- RAM specs: {"memory_type":"DDR5","capacity_gb":32}
-- GPU specs: {"length_mm":305,"recommended_psu_watts":750}
-- Case specs: {"max_gpu_length_mm":380,"supported_form_factors":["ATX","mATX"]}
-- PSU specs: {"wattage":850}
-- Cooler specs: {"supported_sockets":["LGA1700"],"height_mm":155}
-- El backend deberá verificar estas compatibilidades, stock y precios antes de crear pedidos.
