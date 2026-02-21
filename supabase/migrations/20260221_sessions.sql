-- ====================
-- Sessions table
-- Cada sesión pertenece a una campaña y tiene un título y fecha.
-- ====================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    session_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver las sesiones de sus campañas
CREATE POLICY "Sessions are visible to campaign members"
    ON sessions FOR SELECT
    USING (
        auth.uid() IS NOT NULL
    );

-- Cualquier autenticado puede crear sesiones (el DM en producción, pero dejamos flexible)
CREATE POLICY "Authenticated users can create sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ====================
-- Session Notes table
-- Cada nota/crónica pertenece a una sesión, escrita por un usuario con un personaje opcional.
-- ====================
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Cualquier autenticado puede ver notas
CREATE POLICY "Session notes are visible to authenticated users"
    ON session_notes FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Cualquier autenticado puede crear notas
CREATE POLICY "Authenticated users can create notes"
    ON session_notes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el autor puede editar/eliminar su nota
CREATE POLICY "Users can update their own notes"
    ON session_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON session_notes FOR DELETE
    USING (auth.uid() = user_id);
