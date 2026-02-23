import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestConnectionRequest {
  apiUrl: string;
  apiToken: string;
  instanceName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { apiUrl, apiToken, instanceName }: TestConnectionRequest = await req.json();

    // Validate required fields
    if (!apiUrl || !apiToken || !instanceName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos obrigatórios: apiUrl, apiToken, instanceName",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean up API URL (remove trailing slash if present)
    const cleanApiUrl = apiUrl.replace(/\/+$/, "");
    const endpoint = `${cleanApiUrl}/instance/connectionState/${instanceName}`;

    console.log("Testing connection to:", endpoint);

    // Make request to Evolution API
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: apiToken,
      },
    });

    const responseText = await response.text();
    console.log("Evolution API response status:", response.status);
    console.log("Evolution API response:", responseText);

    if (!response.ok) {
      let errorMessage = "Falha ao conectar com a Evolution API";
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = "Token de API inválido ou sem permissão";
      } else if (response.status === 404) {
        errorMessage = "Instância não encontrada";
      } else if (response.status >= 500) {
        errorMessage = "Erro interno da Evolution API";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          status: response.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test connection error:", error);
    
    let errorMessage = "Erro ao testar conexão";
    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Não foi possível conectar ao servidor. Verifique a URL da API.";
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
