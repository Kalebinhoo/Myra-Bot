import Groq from "groq-sdk";
import { createCanvas, loadImage } from "canvas";

interface GroqConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface RankUser {
  id: string;
  username: string;
  saldo: number;
  position: number;
}

class GroqImageService {
  private client: Groq;
  private config: GroqConfig;

  constructor() {
    // Usar configuração do environment
    this.config = {
      apiKey: process.env.GROQ_API_KEY || "",
      model: "llama-3.1-70b-versatile",
      maxTokens: 2048,
      temperature: 0.3
    };
    
    this.client = new Groq({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * Gera código SVG para o ranking usando Groq AI
   */
  async generateRankingSVG(users: RankUser[], serverName: string, requesterId: string): Promise<string> {
    try {
      const usersList = users.map(user => 
        `${user.position}º lugar: ${user.username} - ${user.saldo.toLocaleString()} petiscos${user.id === requesterId ? ' (solicitante)' : ''}`
      ).join('\n');

      const prompt = `Crie um código SVG moderno e bonito para um ranking de usuários de Discord. 

DADOS DO RANKING:
Servidor: ${serverName}
Usuários:
${usersList}

REQUISITOS DO SVG:
- Tamanho: 800x${100 + users.length * 80}px
- Background gradiente escuro (azul/roxo)
- Título "🏆 RANKING DE PETISCOS" no topo
- Para cada usuário: posição, nome, saldo
- Medalhas emoji para top 3: 🥇🥈🥉
- Destaque especial para o solicitante (cor dourada)
- Cores modernas: dourado, azul, branco
- Fontes: Arial, sans-serif
- Ícone 🌮 ao lado dos valores

IMPORTANTE: 
- Responda APENAS com o código SVG válido
- Não inclua explicações ou texto extra
- Use cores hex (#) para melhor compatibilidade
- Certifique-se que o SVG seja válido e funcione`;

      console.log("[GROQ IMAGE] Gerando SVG com IA...");
      
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em SVG que cria designs modernos e bonitos. Responda sempre apenas com código SVG válido, sem explicações."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const svgCode = completion.choices[0]?.message?.content || "";
      
      if (!svgCode.includes("<svg")) {
        throw new Error("Resposta não contém SVG válido");
      }

      console.log("[GROQ IMAGE] ✅ SVG gerado com sucesso");
      return svgCode;

    } catch (error) {
      console.error("[GROQ IMAGE] Erro ao gerar SVG:", error);
      throw error;
    }
  }

  /**
   * Converte SVG gerado pela IA em buffer PNG
   */
  async svgToBuffer(svgCode: string, width: number = 800): Promise<Buffer> {
    try {
      // Usar uma biblioteca para converter SVG to PNG
      // Como fallback, vamos criar um canvas simples
      const height = Math.max(400, 100 + svgCode.split('</rect>').length * 60);
      
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1e3c72');
      gradient.addColorStop(1, '#2a5298');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Título
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 RANKING DE PETISCOS', width / 2, 50);

      // Nota: Esta é uma implementação de fallback
      // Em produção, usaria uma biblioteca como 'svg2img' ou 'puppeteer'
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Imagem gerada por IA', width / 2, height - 20);

      return canvas.toBuffer('image/png');

    } catch (error) {
      console.error("[GROQ IMAGE] Erro ao converter SVG:", error);
      throw error;
    }
  }

  /**
   * Gera imagem completa do ranking usando Groq AI
   */
  async generateRankingImage(users: RankUser[], serverName: string, requesterId: string): Promise<Buffer> {
    try {
      console.log(`[GROQ IMAGE] Iniciando geração de imagem para ${users.length} usuários`);
      
      // Fallback: criar imagem usando canvas com dados da IA
      const rankingData = await this.getRankingDesignFromAI(users, serverName, requesterId);
      
      const width = 750;
      const height = 120 + users.length * 70;
      
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Aplicar design sugerido pela IA
      this.applyAIDesign(ctx, rankingData, width, height, users, requesterId);

      return canvas.toBuffer('image/png');

    } catch (error) {
      console.error("[GROQ IMAGE] Erro na geração:", error);
      // Fallback simples
      return this.createFallbackImage(users, serverName);
    }
  }

  private async getRankingDesignFromAI(users: RankUser[], serverName: string, requesterId: string) {
    const prompt = `Sugira um design moderno para um ranking Discord com estas características:

USUÁRIOS: ${users.map(u => `${u.position}º ${u.username} (${u.saldo} petiscos)`).join(', ')}
SERVIDOR: ${serverName}

Responda em JSON com:
{
  "backgroundColors": ["cor1", "cor2"],
  "titleColor": "cor",
  "textColor": "cor",
  "highlightColor": "cor",
  "style": "moderno/gaming/elegante",
  "layout": "vertical/horizontal"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: "Responda apenas com JSON válido para design de interface." },
          { role: "user", content: prompt }
        ],
        model: this.config.model,
        max_tokens: 512,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      return JSON.parse(response);
    } catch {
      return {
        backgroundColors: ["#1a1a2e", "#16213e"],
        titleColor: "#FFD700",
        textColor: "#FFFFFF", 
        highlightColor: "#00D9FF",
        style: "moderno"
      };
    }
  }

  private applyAIDesign(ctx: any, design: any, width: number, height: number, users: RankUser[], requesterId: string) {
    // Background gradiente sugerido pela IA
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, design.backgroundColors[0] || '#1a1a2e');
    gradient.addColorStop(1, design.backgroundColors[1] || '#16213e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Título
    ctx.fillStyle = design.titleColor || '#FFD700';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 RANKING DE PETISCOS', width / 2, 50);

    // Usuários
    users.forEach((user, i) => {
      const yPos = 100 + (i * 70);
      
      // Destacar solicitante
      const isRequester = user.id === requesterId;
      ctx.fillStyle = isRequester ? design.highlightColor || '#FFD700' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(20, yPos, width - 40, 60);

      // Posição
      ctx.fillStyle = design.textColor || '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      
      const medal = ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;
      ctx.fillText(medal, 70, yPos + 40);

      // Nome
      ctx.fillStyle = isRequester ? design.titleColor || '#FFD700' : design.textColor || '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(user.username, 120, yPos + 35);

      // Saldo
      ctx.fillStyle = design.highlightColor || '#00D9FF';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${user.saldo.toLocaleString()} 🌮`, width - 30, yPos + 40);
    });

    // Footer com marca
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Powered by Groq AI + Myra Bot', width / 2, height - 20);
  }

  private async createFallbackImage(users: RankUser[], serverName: string): Promise<Buffer> {
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 RANKING DE PETISCOS', 300, 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText(`${serverName} • ${users.length} usuários`, 300, 100);

    return canvas.toBuffer('image/png');
  }
}

// Singleton instance
let groqImageService: GroqImageService | null = null;

export function getGroqImageService(): GroqImageService {
  if (!groqImageService) {
    groqImageService = new GroqImageService();
  }
  return groqImageService;
}

export { GroqImageService, type RankUser };