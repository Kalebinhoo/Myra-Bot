import {
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { addSaldo } from "./saldo";

export async function executeAddPetisco(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("Administrator")) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("❌ Sem Permissão")
      .setDescription("Você precisa ser administrador para usar este comando!")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: [64] });
  }

  const user = interaction.options.getUser("usuario", true);
  const amount = interaction.options.getNumber("quantidade", true);

  if (amount <= 0) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("❌ Erro")
      .setDescription("A quantidade deve ser maior que 0!")
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: [64] });
  }

  const novoSaldo = await addSaldo(user.id, amount);

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("✅ Petiscos Adicionados!")
    .setDescription(`Adicionado **${amount.toLocaleString()}** petiscos para ${user.toString()}!`)
    .addFields(
      { name: "Novo Saldo", value: `${novoSaldo.toLocaleString()} petiscos`, inline: true },
      { name: "Admin", value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}
