import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <article className="prose prose-invert max-w-none">
          <h1>Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: 04/02/2026</p>

          <h2>1. Informações que Coletamos</h2>
          <p>
            O RestaurantOS coleta informações necessárias para fornecer nossos serviços de gestão de restaurantes:
          </p>
          <ul>
            <li><strong>Dados de conta:</strong> nome, e-mail, telefone ao criar uma conta</li>
            <li><strong>Dados do estabelecimento:</strong> nome do restaurante, endereço, CNPJ</li>
            <li><strong>Dados de pedidos:</strong> itens, valores, forma de pagamento</li>
            <li><strong>Dados de clientes:</strong> nome e telefone para delivery e notificações</li>
          </ul>

          <h2>2. Como Usamos suas Informações</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Processar pedidos e pagamentos</li>
            <li>Enviar notificações via WhatsApp sobre status de pedidos</li>
            <li>Gerar relatórios e analytics para seu negócio</li>
            <li>Melhorar nossos serviços e suporte</li>
            <li>Cumprir obrigações legais e fiscais</li>
          </ul>

          <h2>3. Compartilhamento de Dados</h2>
          <p>
            Não vendemos seus dados. Compartilhamos informações apenas com:
          </p>
          <ul>
            <li><strong>Processadores de pagamento:</strong> Stripe para assinaturas</li>
            <li><strong>Serviços de mensagem:</strong> WhatsApp/Evolution API para notificações</li>
            <li><strong>Infraestrutura:</strong> Supabase para armazenamento seguro</li>
          </ul>

          <h2>4. Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança incluindo:
          </p>
          <ul>
            <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
            <li>Políticas de acesso por função (RLS)</li>
            <li>Autenticação segura com verificação de e-mail</li>
            <li>Backups regulares dos dados</li>
          </ul>

          <h2>5. Seus Direitos (LGPD)</h2>
          <p>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>
          <ul>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos dados</li>
          </ul>

          <h2>6. Retenção de Dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento:
          </p>
          <ul>
            <li>Dados de conta: excluídos em 30 dias</li>
            <li>Dados fiscais: mantidos por 5 anos (obrigação legal)</li>
            <li>Logs de sistema: mantidos por 90 dias</li>
          </ul>

          <h2>7. Cookies e Tecnologias</h2>
          <p>
            Utilizamos cookies essenciais para:
          </p>
          <ul>
            <li>Manter sua sessão de login</li>
            <li>Lembrar preferências do sistema</li>
            <li>Garantir segurança da aplicação</li>
          </ul>

          <h2>8. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
            por e-mail ou através do sistema.
          </p>

          <h2>9. Contato</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre privacidade:
          </p>
          <ul>
            <li>E-mail: privacidade@restaurantos.app</li>
            <li>Através do sistema: Configurações → Suporte</li>
          </ul>

          <div className="mt-12 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ao utilizar o RestaurantOS, você concorda com esta Política de Privacidade e 
              nossos <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
