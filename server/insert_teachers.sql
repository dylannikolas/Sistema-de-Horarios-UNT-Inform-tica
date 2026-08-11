-- Script para insertar todos los docentes
-- Basado en la lista de docentes proporcionada

USE sistema_horarios;

-- Limpiar docentes existentes de ejemplo (opcional, comentar si no deseas eliminar)
-- DELETE FROM teachers WHERE code LIKE 'DOC-%';

-- DOCENTES PRINCIPALES (2)
INSERT INTO teachers (code, name, email, category, avatar, max_hours, role) VALUES
('DOC-01', 'GUTIERREZ GUTIERREZ JORGE LUIS', 'jgutierrez@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gutierrez', 20, 'DOCENTE'),
('DOC-02', 'RODRIGUEZ MELQUIADES JOSE ANTONIO', 'jrodriguez@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rodriguez', 20, 'DOCENTE');

-- DOCENTES ASOCIADOS (5)
INSERT INTO teachers (code, name, email, category, avatar, max_hours, role) VALUES
('DOC-03', 'CASTILLO DIESTRA CARLOS ENRIQUE', 'ccastillod@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=castillo', 18, 'DOCENTE'),
('DOC-04', 'SIFUENTES DIAZ YENNY MILAGROS', 'ysifuentes@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sifuentes', 18, 'DOCENTE'),
('DOC-05', 'CRUZ SILVA JOSE GABRIEL', 'jcruz@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=cruz', 18, 'DOCENTE'),
('DOC-06', 'MENDOZA TORRES EDWIN RAUL', 'emendoza@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mendoza', 18, 'DOCENTE'),
('DOC-07', 'SALAZAR CAMPOS JUAN ORLANDO', 'jsalazarc@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=salazar', 18, 'DOCENTE'),
('DOC-10', 'GOMEZ MORALES ANTHONY JOSE', 'agomez@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gomez', 18, 'DOCENTE');

-- DOCENTES AUXILIARES (8)
INSERT INTO teachers (code, name, email, category, avatar, max_hours, role) VALUES
('DOC-08', 'CRUZ FLORIAN IRIS AUREA', 'icruz@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=iris', 16, 'DOCENTE'),
('DOC-09', 'PERALTA LUJAN JOSE LUIS', 'jperalta@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=peralta', 16, 'DOCENTE'),
('DOC-11', 'GUEVARA RUIZ RICARDO MANUEL', 'rguevara@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=guevara', 16, 'DOCENTE'),
('DOC-12', 'PEDRO HUAMAN LIZ SOFIA RAYMUNDA', 'lpedro@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro', 16, 'DOCENTE'),
('DOC-13', 'POLO ROMERO VICTOR JAIME', 'vpolo@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=polo', 16, 'DOCENTE'),
('DOC-14', 'QUISPE VARON CELESTINO MEDARDO', 'cmquispe@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=quispe', 16, 'DOCENTE'),
('DOC-15', 'PEREYRA SALVADOR PATRICIA GISSELLA', 'ppereyra@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pereyra', 16, 'DOCENTE'),
('DOC-16', 'PACHECO TORRES JUAN FRANCISCO', 'fpacheco@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pacheco', 16, 'DOCENTE');

-- DOCENTES CONTRATADOS (6)
INSERT INTO teachers (code, name, email, category, avatar, max_hours, role) VALUES
('DOC-17', 'BRAVO ESCALANTE JORGE DAVID', 'jbravo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bravo', 12, 'DOCENTE'),
('DOC-18', 'RAMIREZ CERNA LOURDES', 'lramirezc@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramirez', 12, 'DOCENTE'),
('DOC-19', 'ALVARADO RAMOS JORGE LUIS', 'jalvarador@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alvarado', 12, 'DOCENTE'),
('DOC-20', 'UROUZO GOMEZ YOSIP VLADIMIR', 'yurquizo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=urouzo', 12, 'DOCENTE'),
('DOC-21', 'ABANTO CONCUEAR MANUEL REGILDER', 'mabantoco@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=abanto', 12, 'DOCENTE'),
('DOC-22', 'SALCEDO QUIÑONES MARTIN GUSTAVO', 'msalcedo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=salcedo', 12, 'DOCENTE');

-- Verificar la inserción
SELECT COUNT(*) as total_docentes FROM teachers;
SELECT category, COUNT(*) as docentes_por_categoria FROM teachers GROUP BY category ORDER BY 
  CASE category
    WHEN 'Principal' THEN 1
    WHEN 'Asociado' THEN 2
    WHEN 'Auxiliar' THEN 3
    WHEN 'Contratado' THEN 4
  END;

-- Ver todos los docentes insertados
SELECT code, name, email, category, max_hours FROM teachers WHERE code LIKE 'DOC-%' ORDER BY code;
