import {
  ChatInputCommandInteraction,
} from "discord.js";

export async function executePing(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  
  await interaction.deferReply();
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  const wsLatency = interaction.client.ws.ping;

  let status = "<:excelente:1472705190737219790> Excelente";
  
  if (wsLatency > 100) {
    status = "<:bom:1472705263294218350> Bom";
  }
  if (wsLatency > 200) {
    status = "<:regular:1472705356722475101> Regular";
  }
  if (wsLatency > 400) {
    status = "<:alto:1472705391597981696> Alto";
  }

  const message = `🏓 **Pong!**

📡 **Latência WebSocket:** \`${wsLatency}ms\`
⚡ **Tempo de Resposta:** \`${responseTime}ms\`
📊 **Status:** ${status}`;

  await interaction.editReply({ content: message });
}
