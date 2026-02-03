-- Permitir que clientes (anônimos) atualizem status da mesa para 'occupied' ao fazer pedido
CREATE POLICY "Public can update table status to occupied"
ON public.tables
FOR UPDATE
USING (true)
WITH CHECK (status = 'occupied');