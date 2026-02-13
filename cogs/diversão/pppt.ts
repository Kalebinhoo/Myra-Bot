import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

type Choice = "pedra" | "papel" | "tesoura";

const CHOICES: { id: Choice; emoji: string; name: string }[] = [
  { id: "pedra", emoji: "🪨", name: "Pedra" },
  { id: "papel", emoji: "📄", name: "Papel" },
  { id: "tesoura", emoji: "✂️", name: "Tesoura" },
];

function getBotChoice(): Choice {
  const randomIndex = Math.floor(Math.random() * CHOICES.length);
  return CHOICES[randomIndex].id;
}

function determineWinner(userChoice: Choice, botChoice: Choice): "win" | "lose" | "draw" {
  if (userChoice === botChoice) return "draw";

  if (
    (userChoice === "pedra" && botChoice === "tesoura") ||
    (userChoice === "papel" && botChoice === "pedra") ||
    (userChoice === "tesoura" && botChoice === "papel")
  ) {
    return "win";
  }

  return "lose";
}

function getChoiceById(id: Choice) {
  return CHOICES.find((c) => c.id === id)!;
}

export async function executePedraPapelTesoura(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("🪨📄✂️ Pedra, Papel ou Tesoura")
    .setDescription("Escolha sua jogada!")
    .setFooter({ text: "Myra Bot" })
    .setTimestamp();

  const buttons = CHOICES.map((choice) =>
    new ButtonBuilder()
      .setCustomId(`ppt_${choice.id}`)
      .setLabel(choice.name)
      .setEmoji(choice.emoji)
      .setStyle(ButtonStyle.Primary)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

  await interaction.reply({ embeds: [embed], components: [row] });
}

export async function handlePedraPapelTesoura(interaction: any) {
  const choiceId = interaction.customId.replace("ppt_", "") as Choice;
  const userChoice = getChoiceById(choiceId);
  const botChoiceObj = getChoiceById(getBotChoice());
  const botChoice = botChoiceObj.id;

  const result = determineWinner(choiceId, botChoice);

  let resultText = "";

  if (result === "win") {
    resultText = "Nunca imaginei que você seria bom nisso... Parabéns, você ganhou dessa vez! 🥳";
  } else if (result === "lose") {
    resultText = "Hahaha, você perdeu, agora você tá me devendo um petisco! 🌮🤣";
  } else {
    resultText = "Nossa partida empatou... Tente novamente somente dando o comando \`/ppt\`";
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("🪨📄✂️ Pedra, Papel ou Tesoura")
    .addFields(
      { name: "Sua escolha", value: `${userChoice.emoji} ${userChoice.name}`, inline: true },
      { name: "Escolha do bot", value: `${botChoiceObj.emoji} ${botChoiceObj.name}`, inline: true },
      { name: "Resultado", value: resultText, inline: false }
    )
    .setFooter({ text: `Myra Bot • ${interaction.user.tag}` })
    .setTimestamp();

  const buttons = CHOICES.map((choice) => {
    let style = ButtonStyle.Secondary; // Padrão: cinza
    
    if (choice.id === choiceId) {
      // Botão que o usuário escolheu
      style = result === "win" ? ButtonStyle.Success : result === "lose" ? ButtonStyle.Danger : ButtonStyle.Secondary;
    } else if (choice.id === botChoice) {
      // Botão que o bot escolheu
      style = result === "lose" ? ButtonStyle.Success : result === "win" ? ButtonStyle.Danger : ButtonStyle.Secondary;
    }
    
    return new ButtonBuilder()
      .setCustomId(`ppt_${choice.id}`)
      .setLabel(choice.name)
      .setEmoji(choice.emoji)
      .setStyle(style)
      .setDisabled(true);
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

  await interaction.update({ embeds: [embed], components: [row] });
}
