

CREATE DATABASE IF NOT EXISTS hotel_andino_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_andino_db;

-- 1. Tabla de Huéspedes
CREATE TABLE IF NOT EXISTS huespedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(50) NOT NULL,
    habitacion VARCHAR(20) NOT NULL,
    plan INT NOT NULL COMMENT '3:Pensión Completa, 2:Media, 1:Desayuno, 0:Alojamiento',
    comidasHoy INT DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar huéspedes de prueba
INSERT INTO huespedes (nombre, documento, habitacion, plan, comidasHoy) VALUES 
('Juan Pérez', '102030', '101', 3, 0),
('María Gómez', '405060', '102', 1, 0);

-- 2. Tabla de Inventario (Sistema STOP)
CREATE TABLE IF NOT EXISTS inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    unidad VARCHAR(20) NOT NULL,
    costo DECIMAL(10,2) NOT NULL
);

-- Insertar productos básicos de prueba
INSERT INTO inventario (nombre, stock, unidad, costo) VALUES 
('Lomo de Res', 15, 'Porción', 12000),
('Salmón', 3, 'Porción', 18000), -- Stock Crítico
('Pechuga de Pollo', 20, 'Porción', 6000),
('Huevos', 40, 'Und', 600);

-- 3. Tabla de Comandas (Pedidos y Caja)
CREATE TABLE IF NOT EXISTS comandas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hora VARCHAR(10) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    mesero VARCHAR(100) NOT NULL,
    comida VARCHAR(50) NOT NULL,
    plato VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL COMMENT 'Cortesía (Plan) o Cobro',
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
