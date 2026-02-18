import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";

export async function executeAvatar(interaction: ChatInputCommandInteraction): Promise<void> {
  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  
  const embed = new EmbedBuilder()
    .setTitle(`🖼️ Avatar de ${targetUser.displayName}`)
    .setDescription(`**ID:** ${targetUser.id}\n**Tag:** ${targetUser.tag}`)
    .setImage(targetUser.displayAvatarURL({ size: 512, extension: 'png' }))
    .setColor(0x00FF00)
    .setFooter({ 
      text: `Solicitado por ${interaction.user.displayName}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.reply({ 
    embeds: [embed]
  });
}
