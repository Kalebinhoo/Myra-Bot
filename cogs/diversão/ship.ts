import { ChatInputCommandInteraction, EmbedBuilder, User } from 'discord.js';

interface ShipResult {
  emoji: string;
  message: string;
  color: number;
}

export async function executeShip(interaction: ChatInputCommandInteraction): Promise<void> {
  const user1: User = interaction.options.getUser('usuario1', true);
  const user2: User = interaction.options.getUser('usuario2') || interaction.user;
  
  if (user1.id === user2.id) {
    await interaction.reply({
      content: '💔 Você não pode fazer ship de uma pessoa consigo mesma! Escolha outra pessoa.',
      flags: [64]
    });
    return;
  }
  
  const combinedId: string = [user1.id, user2.id].sort().join('');
  let hash: number = 0;
  for (let i = 0; i < combinedId.length; i++) {
    hash = ((hash << 5) - hash + combinedId.charCodeAt(i)) & 0xffffffff;
  }
  const percentage: number = Math.abs(hash) % 101;
  
  const shipResult: ShipResult = getShipResult(percentage);
  
  const name1: string = user1.displayName || user1.username;
  const name2: string = user2.displayName || user2.username;
  const shipName: string = name1.slice(0, Math.ceil(name1.length / 2)) + name2.slice(Math.floor(name2.length / 2));
  
  const progressBar: string = '💖'.repeat(Math.floor(percentage / 10)) + '🖤'.repeat(10 - Math.floor(percentage / 10));
  
  const shipEmbed = new EmbedBuilder()
    .setTitle(`${shipResult.emoji} Ship Detector ${shipResult.emoji}`)
    .setDescription(`**${user1.displayName || user1.username}** ${shipResult.emoji} **${user2.displayName || user2.username}**`)
    .addFields(
      {
        name: '💕 Compatibilidade',
        value: `**${percentage}%**\n\`${progressBar}\``,
        inline: false
      },
      {
        name: '✨ Nome do Casal',
        value: `**${shipName}**`,
        inline: true
      },
      {
        name: '💭 Veredicto',
        value: shipResult.message,
        inline: false
      }
    )
    .setColor(0x00FF00)
    .setFooter({ 
      text: `Ship entre ${user1.username} e ${user2.username}`,
      iconURL: interaction.client.user?.displayAvatarURL()
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [shipEmbed]
  });
}

function getShipResult(percentage: number): ShipResult {
  if (percentage >= 90) {
    return {
      emoji: '💕',
      message: 'Almas gêmeas! Casamento à vista! 💒',
      color: 0xFF69B4
    };
  } else if (percentage >= 75) {
    return {
      emoji: '❤️',
      message: 'Amor verdadeiro! Relacionamento perfeito! 💖',
      color: 0xFF1493
    };
  } else if (percentage >= 60) {
    return {
      emoji: '💖',
      message: 'Muito compatíveis! Ótimo casal! 😍',
      color: 0xFF6347
    };
  } else if (percentage >= 45) {
    return {
      emoji: '💘',
      message: 'Podem dar certo com esforço! 😊',
      color: 0xFFA500
    };
  } else if (percentage >= 30) {
    return {
      emoji: '💛',
      message: 'Apenas amigos talvez... 🤔',
      color: 0xFFD700
    };
  } else if (percentage >= 15) {
    return {
      emoji: '💔',
      message: 'Melhor não tentar... 😅',
      color: 0x808080
    };
  } else {
    return {
      emoji: '🚫',
      message: 'Completamente incompatíveis! 💀',
      color: 0x000000
    };
  }
}
