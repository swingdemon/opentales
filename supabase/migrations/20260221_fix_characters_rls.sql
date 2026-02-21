-- =====================================================
-- FIX: Permitir que todos los usuarios autenticados puedan
-- leer personajes (para el Diario de Sesión y colaboración).
-- La política anterior sólo permitía leer los propios.
-- =====================================================

-- Eliminar política restrictiva anterior si existe
DROP POLICY IF EXISTS "Users can view their own characters" ON characters;
DROP POLICY IF EXISTS "Users can only view their own characters" ON characters;
DROP POLICY IF EXISTS "Characters are visible to owner" ON characters;

-- Nueva política: lectura pública entre usuarios autenticados
-- (El nombre e imagen de un héroe no es info privada en una campaña compartida)
CREATE POLICY "Authenticated users can read all characters"
    ON characters FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Las siguientes permisos los dejamos intactos (solo el dueño puede editar/borrar):
-- UPDATE/DELETE siguen protegidos por otras políticas que ya existen.
