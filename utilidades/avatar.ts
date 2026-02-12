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

  const row = {
    type: 1,
    components: [
      {
        type: 2,
        style: 5,
        label: "128px",
        url: targetUser.displayAvatarURL({ size: 128, extension: 'png' })
      },
      {
        type: 2,
        style: 5,
        label: "256px", 
        url: targetUser.displayAvatarURL({ size: 256, extension: 'png' })
      },
      {
        type: 2,
        style: 5,
        label: "512px",
        url: targetUser.displayAvatarURL({ size: 512, extension: 'png' })
      },
      {
        type: 2,
        style: 5,
        label: "1024px",
        url: targetUser.displayAvatarURL({ size: 1024, extension: 'png' })
      }
    ]
  };

  await interaction.reply({ 
    embeds: [embed],
    components: [row]
  });
}
