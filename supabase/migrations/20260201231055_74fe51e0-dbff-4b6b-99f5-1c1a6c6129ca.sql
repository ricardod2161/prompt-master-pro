-- Passo 1: Adicionar role 'developer' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';