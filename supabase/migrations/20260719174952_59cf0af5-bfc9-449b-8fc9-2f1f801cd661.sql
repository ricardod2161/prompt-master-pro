UPDATE public.ai_system_wallets w
SET available_credits = available_credits + 1000,
    updated_at = now()
FROM public.ai_systems s
WHERE w.system_id = s.id AND s.slug = 'whatsapp';

INSERT INTO public.ai_system_transactions (system_id, type, amount, metadata)
SELECT s.id, 'admin_adjust'::public.ai_transaction_type, 1000,
       jsonb_build_object('reason','initial top-up for live logging','applied',1000)
FROM public.ai_systems s WHERE s.slug='whatsapp';