import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, PermissionFlagsBits } from "discord.js";

export async function executeClear(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Sem Permissão")
      .setDescription("Você precisa ser administrador para usar este comando!")
      .setTimestamp();

    return void await interaction.reply({ embeds: [embed], flags: [64] });
  }

  const amount = interaction.options.getInteger("quantidade", true);

  if (amount < 1 || amount > 100) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Quantidade Inválida")
      .setDescription("A quantidade deve ser entre 1 e 100 mensagens!")
      .setTimestamp();

    return void await interaction.reply({ embeds: [embed], flags: [64] });
  }

  const channel = interaction.channel;
  
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Canal Inválido")
      .setDescription("Este comando só pode ser usado em canais de texto!")
      .setTimestamp();

    return void await interaction.reply({ embeds: [embed], flags: [64] });
  }
  const textChannel = channel as TextChannel;

  if (!textChannel.permissionsFor(interaction.client.user!)?.has(PermissionFlagsBits.ManageMessages)) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Sem Permissão")
      .setDescription("Eu não tenho permissão para apagar mensagens neste canal! Verifique minhas permissões.")
      .setTimestamp();

    return void await interaction.reply({ embeds: [embed], flags: [64] });
  }
  try {
    await interaction.deferReply({ flags: [64] });

    const existingMessages = await textChannel.messages.fetch({ limit: amount });
    
    if (existingMessages.size === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle("📭 Canal Vazio")
        .setDescription("Não há mensagens para apagar neste canal!")
        .setFooter({ text: "Myra Bot • Clear Command" })
        .setTimestamp();

      return void await interaction.editReply({ embeds: [embed] });
    }

    const messages = await textChannel.bulkDelete(amount, true);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("🗑️ Mensagens Apagadas")
      .setDescription(`Estou exausta... Agora o canal está limpinho, tirei as **${messages.size}** sujeira desse canal.`)
      .addFields(
        { name: "👤 Responsável", value: interaction.user.toString(), inline: true },
        { name: "📍 Canal", value: channel.toString(), inline: true },
        { name: "📊 Solicitado", value: `${amount} mensagens`, inline: true }
      )
      .setFooter({ text: "Myra Bot • Clear Command" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error("Erro ao apagar mensagens:", error);
    
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Erro")
      .setDescription("Ocorreu um erro ao tentar apagar as mensagens. Verifique se as mensagens não são muito antigas (mais de 14 dias).")
      .setTimestamp();

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], flags: [64] });
    }
  }
}
