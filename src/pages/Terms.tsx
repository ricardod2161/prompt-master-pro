import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Terms() {
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
          <h1>Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: 04/02/2026</p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o RestaurantOS, você concorda com estes Termos de Uso. 
            Se não concordar, não utilize nossos serviços.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O RestaurantOS é uma plataforma de gestão para restaurantes que oferece:
          </p>
          <ul>
            <li>Ponto de Venda (PDV) para registro de vendas</li>
            <li>Sistema de Display de Cozinha (KDS)</li>
            <li>Cardápio digital com QR Code</li>
            <li>Gestão de delivery e entregadores</li>
            <li>Controle de estoque e financeiro</li>
            <li>Integração com WhatsApp para pedidos e notificações</li>
            <li>Relatórios e analytics</li>
          </ul>

          <h2>3. Cadastro e Conta</h2>
          <p>Para usar o RestaurantOS, você deve:</p>
          <ul>
            <li>Fornecer informações verdadeiras e completas</li>
            <li>Manter suas credenciais de acesso em sigilo</li>
            <li>Ser responsável por todas as atividades em sua conta</li>
            <li>Notificar imediatamente sobre uso não autorizado</li>
          </ul>

          <h2>4. Planos e Pagamentos</h2>
          <p>
            Oferecemos diferentes planos de assinatura:
          </p>
          <ul>
            <li><strong>Starter (R$ 99/mês):</strong> PDV, Cardápio Digital, KDS</li>
            <li><strong>Pro (R$ 199/mês):</strong> Starter + Delivery, WhatsApp Bot</li>
            <li><strong>Enterprise (R$ 399/mês):</strong> Pro + Multi-unidade, API</li>
          </ul>
          <p>
            Pagamentos são processados via Stripe. A cobrança é mensal e renovada automaticamente. 
            Você pode cancelar a qualquer momento através do portal do cliente.
          </p>

          <h2>5. Uso Aceitável</h2>
          <p>Você concorda em NÃO:</p>
          <ul>
            <li>Violar leis ou regulamentos aplicáveis</li>
            <li>Tentar acessar dados de outros usuários</li>
            <li>Interferir na segurança ou funcionamento do sistema</li>
            <li>Usar o serviço para fins ilegais ou fraudulentos</li>
            <li>Revender ou sublicenciar o acesso ao sistema</li>
            <li>Fazer engenharia reversa do software</li>
          </ul>

          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo do RestaurantOS, incluindo código, design, marcas e logotipos, 
            é de propriedade exclusiva da empresa. Os dados inseridos por você permanecem 
            de sua propriedade.
          </p>

          <h2>7. Disponibilidade do Serviço</h2>
          <p>
            Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos 
            disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência.
          </p>

          <h2>8. Limitação de Responsabilidade</h2>
          <p>
            O RestaurantOS é fornecido "como está". Não nos responsabilizamos por:
          </p>
          <ul>
            <li>Perdas decorrentes de indisponibilidade temporária</li>
            <li>Erros em cálculos fiscais (consulte seu contador)</li>
            <li>Problemas causados por integrações de terceiros</li>
            <li>Perda de dados por falhas fora de nosso controle</li>
          </ul>

          <h2>9. Cancelamento</h2>
          <p>
            Você pode cancelar sua assinatura a qualquer momento. Após o cancelamento:
          </p>
          <ul>
            <li>O acesso continua até o fim do período pago</li>
            <li>Seus dados serão mantidos por 30 dias</li>
            <li>Você pode exportar seus dados antes da exclusão</li>
            <li>Não há reembolso proporcional</li>
          </ul>

          <h2>10. Modificações nos Termos</h2>
          <p>
            Podemos modificar estes termos a qualquer momento. Mudanças significativas 
            serão comunicadas por e-mail com 30 dias de antecedência.
          </p>

          <h2>11. Lei Aplicável</h2>
          <p>
            Estes termos são regidos pelas leis do Brasil. Qualquer disputa será 
            resolvida no foro da comarca de São Paulo/SP.
          </p>

          <h2>12. Contato</h2>
          <p>
            Para dúvidas sobre estes termos:
          </p>
          <ul>
            <li>E-mail: suporte@restaurantos.app</li>
            <li>Através do sistema: Configurações → Suporte</li>
          </ul>

          <div className="mt-12 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ao utilizar o RestaurantOS, você também concorda com nossa{" "}
              <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
