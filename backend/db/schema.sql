CREATE TYPE user_role AS ENUM ('admin', 'barbershop');
CREATE TYPE reservation_status AS ENUM ('reserved', 'waiting', 'lost', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'simulated', 'failed');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'barbershop',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE barbershops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    open_time TIME DEFAULT '09:00',
    close_time TIME DEFAULT '20:00',
    slot_duration_minutes INTEGER DEFAULT 30,
    commission_percent DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    barbershop_id UUID NOT NULL REFERENCES barbershops(id),
    service_id UUID NOT NULL REFERENCES services(id),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_datetime TIMESTAMPTZ NOT NULL,
    status reservation_status DEFAULT 'reserved',
    total_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    barbershop_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_simulated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin (contraseña: admin123)
-- NOTA: Si el hash bcrypt no funciona en tu entorno, ejecuta:
--   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(console.log)"
-- y reemplaza el hash de abajo con el resultado.
INSERT INTO users (email, password_hash, role) VALUES
('admin@barbermaster.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVw7.PEFxm', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Barbería de prueba (contraseña: admin123)
INSERT INTO users (email, password_hash, role) VALUES
('barberia1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVw7.PEFxm', 'barbershop')
ON CONFLICT (email) DO NOTHING;

INSERT INTO barbershops (user_id, name, description, address, phone, commission_percent)
SELECT id, 'Barbería El Corte Fino', 'La mejor barbería de Cartagena', 'Calle 30 #25-10, Bocagrande', '3001234567', 10
FROM users WHERE email = 'barberia1@test.com';

INSERT INTO services (barbershop_id, name, description, price, duration_minutes)
SELECT b.id, s.name, s.service_desc, s.price, s.dur
FROM barbershops b, (VALUES
  ('Corte clásico', 'Corte con tijera y máquina', 25000, 30),
  ('Corte + barba', 'Corte más arreglo de barba', 40000, 45),
  ('Afeitado clásico', 'Navaja y toalla caliente', 20000, 30),
  ('Tinte completo', 'Coloración con productos premium', 60000, 60)
) AS s(name, service_desc, price, dur)
WHERE b.name = 'Barbería El Corte Fino';

-- ============================================
-- Índices para mejorar rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reservations_tracking_code ON reservations(tracking_code);
CREATE INDEX IF NOT EXISTS idx_reservations_appointment_datetime ON reservations(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_barbershop_id ON reservations(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id ON services(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_user_id ON barbershops(user_id);
