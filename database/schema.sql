CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('short_text', 'single_choice', 'multiple_choice', 'rating')),
  text VARCHAR(500) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL
);

CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  position INT NOT NULL
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  text_value TEXT,
  CHECK (option_id IS NOT NULL OR text_value IS NOT NULL)
);