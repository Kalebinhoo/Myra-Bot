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
    .setTitle("Informações do Bot")
    .setThumbnail(botUser.displayAvatarURL({ size: 1024 }))
    .addFields(
      { name: "<:Membro:1472700934009262244> Nome", value: "<@1448083736876028054>", inline: true },
      { name: "<:ID:1472701309823095029> ID", value: botUser.id, inline: true },
      { name: "<:discotoolsxyzicon9:1472700585227718810> Linguagem & Tecnologia", value: "<:Typescript:1471349660957409391>", inline: true },
      { name: "<:servidor:1472698177499959356> Servidores", value: client.guilds.cache.size.toString(), inline: true },
      { name: "📋 Comandos", value: "18", inline: true },
      { name: "<:Squarecloud:1472698972236681279> Hosting", value: "<:SquareCloud:1472580359664177203> [Squarecloud](https://squarecloud.app)", inline: true },
      { name: "<:Developer:1472699596844306674> Developer", value: "<@1324198892648009760>", inline: true },
      { name: "<:calendar:1472700008867565719> Criado em", value: `<t:${Math.floor(botUser.createdTimestamp / 1000)}:F>`, inline: true }

    )
    .setFooter({ text: "Myra • Desenvolvido com 💚" })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
