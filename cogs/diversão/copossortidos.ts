import { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from 'discord.js';
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
const db = mongoClient.db("myra_bot");
const gameCollection = db.collection("game_cooldowns");

export async function executeCoposSortidos(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  
  try {
    await mongoClient.connect();
  } catch (error) {
  }
  
  const lastGame = await gameCollection.findOne({ userId, gameType: 'copos' });
  const now = new Date();
  
  if (lastGame) {
    const timeDiff = now.getTime() - lastGame.lastGameTime.getTime();
    const cooldownTime = 5 * 1000;
    
    if (timeDiff < cooldownTime) {
      const timeLeft = cooldownTime - timeDiff;
      const secondsLeft = Math.ceil(timeLeft / 1000);
      
      const embed = new EmbedBuilder()
        .setTitle("🎯 Aguarde um pouquinho!")
        .setDescription(`Você precisa esperar mais **${secondsLeft}** segundo${secondsLeft !== 1 ? 's' : ''} para jogar novamente.\n\n⏰ Cooldown: 5 segundos`)
        .setColor(0xFF6B6B)
        .setFooter({ text: "Aguarde o cooldown! ⏰" })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], flags: [64] });
      return;
    }
  }
  const copoVencedor = Math.floor(Math.random() * 3);
  
  const embed = new EmbedBuilder()
    .setTitle("🎯 Jogo dos Copos Sortidos")
    .setDescription("**Encontre a bolinha verde! <:bola_verde:1473142487294939208>**\n\nOs copos estão sendo embaralhados...\nAguarde a contagem!")
    .setColor(0x00FF00)
    .setFooter({ text: "Boa sorte! 🍀" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`copo_0_${copoVencedor}`)
        .setEmoji('1473142588964864193')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`copo_1_${copoVencedor}`)
        .setEmoji('1473142588964864193')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`copo_2_${copoVencedor}`)
        .setEmoji('1473142588964864193')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

  await interaction.reply({
    embeds: [embed],
    components: [row]
  });

  try {
    await gameCollection.replaceOne(
      { userId, gameType: 'copos' },
      { userId, gameType: 'copos', lastGameTime: now },
      { upsert: true }
    );
  } catch (error) {
    console.error("Erro ao salvar cooldown do jogo:", error);
  }

  for (let i = 5; i > 0; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const countdownEmbed = new EmbedBuilder()
        .setTitle("🎯 Jogo dos Copos Sortidos")
        .setDescription(`**Encontre a bolinha verde! <:bola_verde:1473142487294939208>**\n\nEscolhendo posição da bolinha...\n\n⏰ **${i}**`)
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
      .setDescription("**Agora escolha um copo! <:bola_verde:1473142487294939208>**\n\nClique no copo que você acha que tem a bolinha!")
      .setColor(0x00FF00)
      .setFooter({ text: "Faça sua escolha! 🤔" })
      .setTimestamp();

    const activeRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`copo_0_${copoVencedor}`)
          .setEmoji('1473142588964864193')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`copo_1_${copoVencedor}`)
          .setEmoji('1473142588964864193')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(false),
        new ButtonBuilder()
          .setCustomId(`copo_2_${copoVencedor}`)
          .setEmoji('1473142588964864193')
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
      ? "**Você encontrou a bolinha verde! <:bola_verde:1473142487294939208>**\n\nParabéns pela sua percepção!" 
      : `**A bolinha estava no copo ${correto + 1}! <:bola_verde:1473142487294939208>**\n\nMais sorte na próxima vez!`
    )
    .setColor(0x00FF00)
    .setFooter({ text: acertou ? "Excelente! 🏆" : "Tente novamente! 🎯" })
    .setTimestamp();

  const finalRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('result_0')
        .setEmoji(correto === 0 ? '1473142487294939208' : '1473142588964864193')
        .setStyle(
          correto === 0 ? ButtonStyle.Success : 
          (escolha === 0 && !acertou) ? ButtonStyle.Danger : 
          ButtonStyle.Secondary
        )
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('result_1')
        .setEmoji(correto === 1 ? '1473142487294939208' : '1473142588964864193')
        .setStyle(
          correto === 1 ? ButtonStyle.Success : 
          (escolha === 1 && !acertou) ? ButtonStyle.Danger : 
          ButtonStyle.Secondary
        )
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('result_2')
        .setEmoji(correto === 2 ? '1473142487294939208' : '1473142588964864193')
        .setStyle(
          correto === 2 ? ButtonStyle.Success : 
          (escolha === 2 && !acertou) ? ButtonStyle.Danger : 
          ButtonStyle.Secondary
        )
        .setDisabled(true)
    );

  await interaction.update({
    embeds: [resultEmbed],
    components: [finalRow]
  });

  if (acertou) {
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.error("Erro ao deletar mensagem do jogo dos copos:", error);
      }
    }, 5000);
  }
}
