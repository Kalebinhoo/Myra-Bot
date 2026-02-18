import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  User
} from "discord.js";
import { getSaldo, addSaldo, removeSaldo } from "./saldo";

export async function executePagar(interaction: ChatInputCommandInteraction) {
  const membro = interaction.options.getUser('destinatario', true);
  const quantidade = interaction.options.getNumber('quantidade', true);
  const remetente = interaction.user;

  if (membro.id === remetente.id) {
    return interaction.reply({
      content: "❌ Você não pode pagar para si mesmo!",
      flags: [64]
    });
  }

  if (membro.bot) {
    return interaction.reply({
      content: "❌ Você não pode pagar para bots!",
      flags: [64]
    });
  }

  if (quantidade <= 0) {
    return interaction.reply({
      content: "❌ A quantidade deve ser maior que zero!",
      flags: [64]
    });
  }

  if (quantidade > 1000000) {
    return interaction.reply({
      content: "❌ Você só pode pagar até 1.000.000 de petiscos por vez!",
      flags: [64]
    });
  }

  const saldoRemetente = await getSaldo(remetente.id);
  
  if (saldoRemetente < quantidade) {
    return interaction.reply({
      content: `❌ Você não tem petiscos suficientes! Seu saldo: **${saldoRemetente.toLocaleString()}** <:petisco:1472879242868953150>`,
      flags: [64]
    });
  }

  await interaction.deferReply({ flags: [64] });

  try {
    await removeSaldo(remetente.id, quantidade);
    await addSaldo(membro.id, quantidade);

    const novoSaldoRemetente = await getSaldo(remetente.id);
    const novoSaldoDestinatario = await getSaldo(membro.id);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("<a:money:1473571577298944144> Pagamento Realizado")
      .setDescription(`${remetente} pagou **${quantidade.toLocaleString()}** <:petisco:1472879242868953150> para ${membro}!`)
      .addFields(
        {
          name: "💰 Remetente",
          value: `${remetente.displayName}\nSaldo: **${novoSaldoRemetente.toLocaleString()}** <:petisco:1472879242868953150>`,
          inline: true
        },
        {
          name: "🎁 Destinatário", 
          value: `${membro.displayName}\nSaldo: **${novoSaldoDestinatario.toLocaleString()}** <:petisco:1472879242868953150>`,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    await interaction.editReply({
      content: "❌ Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde."
    });
  }
}
