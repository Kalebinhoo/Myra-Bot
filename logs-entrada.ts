import { Client, EmbedBuilder, TextChannel, AuditLogEvent } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const LOG_CHANNEL_ID = "1424573225857450045";

export async function handleGuildCreate(client: Client) {
  client.on("guildCreate", async (guild) => {
    try {
      const serverCount = client.guilds.cache.size;

      let inviter = "Desconhecido";
      try {
        const auditLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.BotAdd,
          limit: 1,
        });

        const botAddLog = auditLogs.entries.first();
        if (botAddLog && botAddLog.executor) {
          inviter = `${botAddLog.executor.toString()} (${botAddLog.executor.tag})`;
        }
      } catch {
      }

      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID) as TextChannel;

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle("Obaaa! Mais um membro quis adquiri o nosso bot! 🎉")
          .addFields(
            { name: "📝 Nome do Servidor", value: guild.name, inline: true },
            { name: "🆔 ID do Servidor", value: guild.id, inline: true },
            { name: "👤 Adicionado por", value: inviter, inline: true },
            { name: "🌐 Total de Servidores", value: serverCount.toString(), inline: true },
            { name: "👥 Membros", value: guild.memberCount.toString(), inline: true },
            { name: "📅 Criado em", value: guild.createdAt.toLocaleDateString("pt-BR"), inline: true }
          )
          .setThumbnail(guild.iconURL() || "")
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

      console.log(`✅ Bot adicionado ao servidor: ${guild.name} (Total: ${serverCount})`);
    } catch (error) {
      console.error("Erro ao processar entrada do servidor:", error);
    }
  });
}

export async function handleGuildDelete(client: Client) {
  client.on("guildDelete", async (guild) => {
    try {
      const serverCount = client.guilds.cache.size;

      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID) as TextChannel;

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle("👋 Bot Saiu de um Servidor")
          .addFields(
            { name: "📝 Nome do Servidor", value: guild.name, inline: true },
            { name: "🆔 ID do Servidor", value: guild.id, inline: true },
            { name: "🌐 Total de Servidores", value: serverCount.toString(), inline: true }
          )
          .setThumbnail(guild.iconURL() || "")
          .setFooter({ text: "Myra Bot • Logs de Saída" })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

      console.log(`❌ Bot removido do servidor: ${guild.name} (Total: ${serverCount})`);
    } catch (error) {
      console.error("Erro ao processar saída do servidor:", error);
    }
  });
}
