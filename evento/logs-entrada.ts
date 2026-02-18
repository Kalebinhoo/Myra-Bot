import {
  AuditLogEvent,
  Client,
  Events,
  Guild,
  TextChannel,
  EmbedBuilder,
} from "discord.js";

async function fetchLogChannel(client: Client): Promise<TextChannel | null> {
  if (!process.env.LOG_CHANNEL_ID) {
    console.warn("LOG_CHANNEL_ID não configurado. Pulando logs de entrada/saída.");
    return null;
  }

  try {
    const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID!);
    return channel instanceof TextChannel ? channel : null;
  } catch (error) {
    console.error("Não foi possível acessar o canal de logs:", error);
    return null;
  }
}

function buildGuildEmbed(options: {
  title: string;
  guildName: string;
  guildId: string;
  serverCount: number;
  memberCount?: number;
  inviter?: string;
  createdAt?: Date;
  color: number;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(options.color)
    .setTitle(options.title)
    .addFields(
      { name: "📝 Servidor", value: options.guildName, inline: true },
      { name: "🆔 ID", value: options.guildId, inline: true },
      { name: "🌐 Total de Servidores", value: options.serverCount.toString(), inline: true }
    )
    .setTimestamp();

  if (options.memberCount !== undefined) {
    embed.addFields({ name: "👥 Membros", value: options.memberCount.toString(), inline: true });
  }

  if (options.inviter) {
    embed.addFields({ name: "👤 Adicionado por", value: options.inviter, inline: true });
  }

  if (options.createdAt) {
    embed.addFields({ name: "📅 Criado em", value: `<t:${Math.floor(options.createdAt.getTime() / 1000)}:F>`, inline: true });
  }

  return embed;
}

async function findInviterName(guild: Guild): Promise<string> {
  try {
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 });
    const entry = auditLogs.entries.first();
    if (entry?.executor) {
      return `${entry.executor.tag} (${entry.executor.id})`;
    }
  } catch (error) {
    console.warn(`Não foi possível identificar quem adicionou o bot em ${guild.name}:`, error);
  }
  return "Desconhecido";
}

export function handleGuildCreate(client: Client): void {
  client.on(Events.GuildCreate, async (guild: Guild) => {
    try {
      const logChannel = await fetchLogChannel(client);
      if (!logChannel) {
        return;
      }

      const serverCount = client.guilds.cache.size;
      const inviter = await findInviterName(guild);

      const embed = buildGuildEmbed({
        title: "🎉 O bot entrou em um novo servidor!",
        guildName: guild.name,
        guildId: guild.id,
        serverCount,
        memberCount: guild.memberCount,
        inviter,
        createdAt: guild.createdAt,
        color: 0x00ff7f,
      }).setThumbnail(guild.iconURL() ?? undefined);

      let inviteUrl: string | undefined;
      try {
        const firstTextChannel = guild.channels.cache.find(
          (c) =>
            c instanceof TextChannel &&
            c.permissionsFor(guild.members.me!)?.has("CreateInstantInvite")
        ) as TextChannel | undefined;
        if (firstTextChannel) {
          const invite = await firstTextChannel.createInvite({
            maxAge: 0,
            maxUses: 0,
            reason: "Log de entrada do bot",
          });
          inviteUrl = `https://discord.gg/${invite.code}`;
        }
      } catch (inviteErr) {
        console.warn("Não foi possível criar convite:", inviteErr);
      }

      const components = inviteUrl
        ? [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "Entrar no servidor",
                  url: inviteUrl,
                },
              ],
            },
          ]
        : undefined;

      await logChannel.send({ embeds: [embed], components });

      console.log(`✅ Entramos em ${guild.name}. Total atual: ${serverCount}`);
    } catch (error) {
      console.error("Erro ao registrar entrada de servidor:", error);
    }
  });
}

export function handleGuildDelete(client: Client): void {
  client.on(Events.GuildDelete, async (guild: Guild) => {
    try {
      const logChannel = await fetchLogChannel(client);
      if (!logChannel) {
        return;
      }

      const serverCount = client.guilds.cache.size;

      const embed = buildGuildEmbed({
        title: "👋 O bot saiu de um servidor",
        guildName: guild.name,
        guildId: guild.id,
        serverCount,
        color: 0xff5c5c,
      }).setThumbnail(guild.iconURL() ?? undefined);

      await logChannel.send({ embeds: [embed] });
      console.log(`❌ Saímos de ${guild.name}. Total atual: ${serverCount}`);
    } catch (error) {
      console.error("Erro ao registrar saída de servidor:", error);
    }
  });
}
