import {
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export async function executeServerInfo(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({ content: "Este comando só pode ser usado em servidores!", flags: [64] });
  }

  const owner = await guild.fetchOwner().catch(() => null);

  const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
  const categories = guild.channels.cache.filter(channel => channel.type === 4).size;

  const verificationLevels = {
    0: "Nenhuma",
    1: "Baixa",
    2: "Média", 
    3: "Alta",
    4: "Muito Alta"
  };

  const totalMembers = guild.memberCount;
  const bots = guild.members.cache.filter(member => member.user.bot).size;
  const humans = totalMembers - bots;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle(`🏰 ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 1024 }) || null)
    .addFields(
      { name: "🆔 ID do Servidor", value: guild.id, inline: true },
      { name: "👑 Dono", value: owner ? `${owner.user.tag}` : "Desconhecido", inline: true },
      { name: "📅 Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
      { name: "👥 Membros", value: `**${totalMembers}** total\n👤 ${humans} usuários\n🤖 ${bots} bots`, inline: true },
      { name: "📋 Canais", value: `💬 **${textChannels}** texto\n🔊 **${voiceChannels}** voz\n📂 **${categories}** categorias`, inline: true },
      { name: "🔒 Verificação", value: verificationLevels[guild.verificationLevel] || "Desconhecida", inline: true },
      { name: "🎭 Cargos", value: guild.roles.cache.size.toString(), inline: true },
      { name: "😀 Emojis", value: guild.emojis.cache.size.toString(), inline: true }
    )
    .setFooter({ text: "📊 Informações do Servidor" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
