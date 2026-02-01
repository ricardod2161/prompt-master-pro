-- ============================================
-- TRIGGERS PARA NOTIFICAÇÕES AUTOMÁTICAS
-- ============================================

-- 1. Trigger para novos pedidos
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  channel_label TEXT;
BEGIN
  -- Mapear canal para label amigável
  channel_label := CASE NEW.channel
    WHEN 'delivery' THEN 'Delivery'
    WHEN 'counter' THEN 'Balcão'
    WHEN 'table' THEN 'Mesa'
    WHEN 'whatsapp' THEN 'WhatsApp'
    ELSE NEW.channel::text
  END;

  -- Criar notificação
  INSERT INTO public.notifications (unit_id, title, message, type, category, metadata)
  VALUES (
    NEW.unit_id,
    'Novo pedido #' || NEW.order_number,
    'Pedido de ' || COALESCE(NEW.customer_name, 'Cliente') || ' via ' || channel_label || ' - R$ ' || ROUND(NEW.total_price::numeric, 2),
    'info',
    'order',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'channel', NEW.channel,
      'total', NEW.total_price
    )
  );
  
  -- Registrar log
  INSERT INTO public.admin_logs (action, category, unit_id, metadata, severity)
  VALUES (
    'Novo pedido criado #' || NEW.order_number,
    'order',
    NEW.unit_id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'channel', NEW.channel,
      'customer_name', NEW.customer_name,
      'total_price', NEW.total_price
    ),
    'info'
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger para novos pedidos
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

-- 2. Trigger para estoque baixo
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  severity_level TEXT;
  stock_percentage NUMERIC;
BEGIN
  -- Verificar se estoque está abaixo do mínimo
  IF NEW.current_stock <= COALESCE(NEW.min_stock, 0) AND COALESCE(NEW.min_stock, 0) > 0 THEN
    -- Calcular percentual para determinar severidade
    stock_percentage := CASE 
      WHEN NEW.min_stock > 0 THEN (NEW.current_stock::numeric / NEW.min_stock::numeric) * 100
      ELSE 0
    END;
    
    severity_level := CASE
      WHEN NEW.current_stock <= 0 THEN 'error'
      WHEN stock_percentage <= 25 THEN 'warning'
      ELSE 'info'
    END;

    -- Verificar se já existe notificação recente (últimas 24h) para este item
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE category = 'stock'
        AND metadata->>'item_id' = NEW.id::text
        AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      -- Criar notificação de estoque baixo
      INSERT INTO public.notifications (unit_id, title, message, type, category, metadata)
      VALUES (
        NEW.unit_id,
        CASE WHEN NEW.current_stock <= 0 THEN 'Estoque zerado: ' ELSE 'Estoque baixo: ' END || NEW.name,
        'Quantidade atual: ' || NEW.current_stock || ' ' || NEW.unit_measure || 
        ' (mínimo: ' || COALESCE(NEW.min_stock, 0) || ')',
        severity_level,
        'stock',
        jsonb_build_object(
          'item_id', NEW.id,
          'item_name', NEW.name,
          'current_stock', NEW.current_stock,
          'min_stock', NEW.min_stock,
          'unit_measure', NEW.unit_measure
        )
      );
      
      -- Registrar log
      INSERT INTO public.admin_logs (action, category, unit_id, metadata, severity)
      VALUES (
        CASE WHEN NEW.current_stock <= 0 THEN 'Estoque zerado' ELSE 'Estoque abaixo do mínimo' END,
        'inventory',
        NEW.unit_id,
        jsonb_build_object(
          'item_id', NEW.id,
          'item_name', NEW.name,
          'current_stock', NEW.current_stock,
          'min_stock', NEW.min_stock
        ),
        severity_level
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para estoque baixo
DROP TRIGGER IF EXISTS trigger_check_low_stock ON public.inventory_items;
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF current_stock ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

-- Trigger também para insert (novo item já com estoque baixo)
DROP TRIGGER IF EXISTS trigger_check_low_stock_insert ON public.inventory_items;
CREATE TRIGGER trigger_check_low_stock_insert
  AFTER INSERT ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

-- 3. Trigger para mudança de status do pedido
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_label TEXT;
  notification_type TEXT;
BEGIN
  -- Só processar se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Mapear status para labels
    status_label := CASE NEW.status
      WHEN 'preparing' THEN 'Em preparo'
      WHEN 'ready' THEN 'Pronto para entrega'
      WHEN 'delivered' THEN 'Entregue'
      WHEN 'cancelled' THEN 'Cancelado'
      ELSE NEW.status::text
    END;
    
    notification_type := CASE NEW.status
      WHEN 'cancelled' THEN 'error'
      WHEN 'ready' THEN 'success'
      ELSE 'info'
    END;

    -- Criar notificação apenas para transições importantes
    IF NEW.status IN ('ready', 'cancelled') THEN
      INSERT INTO public.notifications (unit_id, title, message, type, category, metadata)
      VALUES (
        NEW.unit_id,
        'Pedido #' || NEW.order_number || ' - ' || status_label,
        CASE 
          WHEN NEW.status = 'ready' THEN 'O pedido está pronto para ser entregue ao cliente'
          WHEN NEW.status = 'cancelled' THEN 'O pedido foi cancelado'
          ELSE 'Status atualizado para: ' || status_label
        END,
        notification_type,
        'order',
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    
    -- Sempre registrar log de mudança de status
    INSERT INTO public.admin_logs (action, category, unit_id, metadata, severity)
    VALUES (
      'Pedido #' || NEW.order_number || ' alterado para ' || status_label,
      'order',
      NEW.unit_id,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      CASE WHEN NEW.status = 'cancelled' THEN 'warning' ELSE 'info' END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para mudança de status
DROP TRIGGER IF EXISTS trigger_notify_order_status ON public.orders;
CREATE TRIGGER trigger_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();