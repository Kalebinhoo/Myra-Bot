import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from 'discord.js';

export async function executeCoposSortidos(interaction: ChatInputCommandInteraction): Promise<void> {
  const copoVencedor = Math.floor(Math.random() * 3);
  
  const embed = new EmbedBuilder()
    .setTitle("🎯 Jogo dos Copos Sortidos")
    .setDescription("**Encontre a bolinha azul! 🔵**\n\nOs copos estão sendo embaralhados...\nAguarde a contagem!")
    .setColor(0x00FF00)
    .setFooter({ text: "Boa sorte! 🍀" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`copo_0_${copoVencedor}`)
        .setLabel('🥛')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`copo_1_${copoVencedor}`)
        .setLabel('🥛')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`copo_2_${copoVencedor}`)
        .setLabel('🥛')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

  await interaction.reply({
    embeds: [embed],
    components: [row]
  });

  for (let i = 5; i > 0; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const countdownEmbed = new EmbedBuilder()
        .setTitle("🎯 Jogo dos Copos Sortidos")
        .setDescription(`**Encontre a bolinha azul! 🔵**\n\nEscolhendo posição da bolinha...\n\n⏰ **${i}**`)
        .setColor(0x00FF00)
        .setFooter({ text: "Boa sorte! 🍀" })
        .setTimestamp();

      await interaction.editReply({
        embeds: [countdownEmbed],
        components: [row]
      });
    } catch (error) {
      console.error(`Erro na contagem ${i}:`, error);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const chooseEmbed = new EmbedBuilder()
      .setTitle("🎯 Jogo dos Copos Sortidos")
      .setDescription("**Agora escolha um copo! 🔵**\n\nClique no copo que você acha que tem a bolinha!")
      .setColor(0x00FF00)
      .setFooter({ text: "Faça sua escolha! 🤔" })
      .setTimestamp();

    const activeRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`copo_0_${copoVencedor}`)
          .setLabel('🥛')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`copo_1_${copoVencedor}`)
          .setLabel('🥛')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`copo_2_${copoVencedor}`)
          .setLabel('🥛')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false)
      );

    await interaction.editReply({
      embeds: [chooseEmbed],
      components: [activeRow]
    });
    
    console.log("Jogo finalizado, botões ativados para escolha");
  } catch (error) {
    console.error("Ops... Deu um erro bobo aqui, me desculpe 😅", error);
  }
}

export async function handleCopoChoice(interaction: ButtonInteraction): Promise<void> {
  const [, escolhaStr, corretoStr] = interaction.customId.split('_');
  const escolha = parseInt(escolhaStr);
  const correto = parseInt(corretoStr);
  
  const acertou = escolha === correto;
  
  const resultEmbed = new EmbedBuilder()
    .setTitle(acertou ? "🎉 PARABÉNS! Você acertou!" : "😅 Que pena! Você errou!")
    .setDescription(acertou 
      ? "**Você encontrou a bolinha azul! 🔵**\n\nParabéns pela sua percepção!" 
      : `**A bolinha estava no copo ${correto + 1}! 🔵**\n\nMais sorte na próxima vez!`
    )
    .setColor(0x00FF00)
    .setFooter({ text: acertou ? "Excelente! 🏆" : "Tente novamente! 🎯" })
    .setTimestamp();

  const finalRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('result_0')
        .setLabel(correto === 0 ? '🔵' : '🥛')
        .setStyle(correto === 0 ? ButtonStyle.Success : (escolha === 0 ? ButtonStyle.Danger : ButtonStyle.Secondary))
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('result_1')
        .setLabel(correto === 1 ? '🔵' : '🥛')
        .setStyle(correto === 1 ? ButtonStyle.Success : (escolha === 1 ? ButtonStyle.Danger : ButtonStyle.Secondary))
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('result_2')
        .setLabel(correto === 2 ? '🔵' : '🥛')
        .setStyle(correto === 2 ? ButtonStyle.Success : (escolha === 2 ? ButtonStyle.Danger : ButtonStyle.Secondary))
        .setDisabled(true)
    );

  await interaction.update({
    embeds: [resultEmbed],
    components: [finalRow]
  });
}
