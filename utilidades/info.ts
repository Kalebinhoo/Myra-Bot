import {
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export async function executeInfo(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const botUser = client.user;

  if (!botUser) {
    return interaction.reply({ content: "Erro ao obter informações do bot.", flags: [64] });
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("<:Myra:1471353306562560223> Informações do Bot")
    .setThumbnail(botUser.displayAvatarURL({ size: 1024 }))
    .addFields(
      { name: "📛 Nome", value: botUser.username, inline: true },
      { name: "🆔 ID", value: botUser.id, inline: true },
      { name: "🏷️ Tag", value: `#${botUser.discriminator}`, inline: true },
      { name: "💻 Linguagem", value: "<:Typescript:1471349660957409391>", inline: true },
      { name: "🌐 Servidores", value: client.guilds.cache.size.toString(), inline: true },

      { name: "🗓️ Criado em", value: `<t:${Math.floor(botUser.createdTimestamp / 1000)}:F>`, inline: true }
    )
    .setFooter({ text: "Myra • Desenvolvido com 💚" })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
