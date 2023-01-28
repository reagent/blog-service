CREATE TABLE tokens (
  value uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
