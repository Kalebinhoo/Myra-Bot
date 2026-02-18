import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember
} from "discord.js";

export async function executeListarBadges(interaction: ChatInputCommandInteraction) {
  const servidorId = interaction.options.getString('servidor_id');
  let guild = interaction.guild;

  if (servidorId) {
    try {
      guild = await interaction.client.guilds.fetch(servidorId);
    } catch (error) {
      return interaction.reply({ 
        content: `❌ Não foi possível encontrar o servidor com ID \`${servidorId}\` ou o bot não está presente neste servidor.`, 
        flags: [64] 
      });
    }
  }

  if (!guild) {
    return interaction.reply({ content: "❌ Não foi possível acessar as informações do servidor!", flags: [64] });
  }

  await interaction.deferReply();

  try {
    const members = guild.members.cache;

    if (members.size < Math.min(guild.memberCount * 0.1, 100)) {
      try {
        await guild.members.fetch({ limit: 100 });
      } catch (fetchError) {
        console.log('Não foi possível buscar membros adicionais, usando cache atual');
      }
    }

    const badgeCount: { [key: string]: number } = {};

    const badgeEmojis: { [key: string]: string } = {
      'Partner': '<:partnered:1472813032823590933>',
      'HypeSquadOnlineHouse1': '<:bravery:1472812948237062224>',
      'HypeSquadOnlineHouse2': '<:brilliance:1472812974275297372>',
      'HypeSquadOnlineHouse3': '<:balance:1472812991807488031>',
      'VerifiedDeveloper': '<:verificaded_developer:1472813053081944116>',
      'PremiumEarlySupporter': '<:early:1472813010924863609>',
      'ActiveDeveloper': '<:active_developer:1472718705606660240>',
      'Nitro': '<:Nitro:1472718185953235038>',
      'Tag': '<:tag:1472829304328032360>',
      'Bot': '<:bot:1472834141514109028>'
    };

    Object.keys(badgeEmojis).forEach(badge => {
      badgeCount[badge] = 0;
    });
    badgeCount['Owner'] = 0;

    let processedCount = 0;
    const maxToProcess = Math.min(members.size, 1000);

    console.log(`Processando ${maxToProcess} de ${members.size} membros para badges...`);

    for (const [memberId, member] of members) {
      if (processedCount >= maxToProcess) break;

      try {
        const userFlags = member.user.flags?.toArray() || [];

        userFlags.forEach(flag => {
          if (badgeCount.hasOwnProperty(flag)) {
            if (flag === 'VerifiedDeveloper' && member.user.bot) {
              return;
            }
            badgeCount[flag]++;
          }
        });

        if (member.user.avatar?.startsWith('a_') || member.user.banner) {
          badgeCount['Nitro']++;
        }

        if (member.user.bot && userFlags.includes('VerifiedBot')) {
          badgeCount['Bot']++;
        }

        const isServerOwner = interaction.client.guilds.cache.some(g => g.ownerId === member.user.id);
        if (isServerOwner) {
          badgeCount['Owner']++;
        }

        processedCount++;
      } catch (memberError) {
        console.log(`Erro processando membro ${member.user.tag}:`, memberError);
        continue;
      }
    }

    const badgesList: string[] = [];

    Object.entries(badgeCount).forEach(([badge, count]) => {
      if (badge === 'Owner') {
        badgesList.push(`<:owner:1472837489290121267> \`${count}\``);
      } else {
        const emoji = badgeEmojis[badge] || '🏷️';
        badgesList.push(`${emoji} \`${count}\``);
      }
    });

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(`🏷️ Insígnias do Servidor`)
      .setDescription(badgesList.join('\n'))
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Erro ao listar badges:', error);

    let errorMessage = `❌ Erro ao buscar as insígnias dos membros do servidor ${guild.name}.`;

    if (error instanceof Error) {
      if (error.message.includes('Missing Permissions')) {
        errorMessage = `❌ Não tenho permissão para acessar informações dos membros do servidor ${guild.name}.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = `⏱️ Tempo limite atingido. Servidor ${guild.name} muito grande para processar todas as badges.`;
      } else if (error.message.includes('Unknown Guild')) {
        errorMessage = `❌ O servidor com ID fornecido não existe ou o bot não está presente nele.`;
      }
    }

    try {
      await interaction.editReply({ content: errorMessage });
    } catch (replyError) {
      console.error('Erro ao responder com mensagem de erro:', replyError);
      try {
        await interaction.reply({ content: errorMessage, flags: [64] });
      } catch (secondError) {
        console.error('Falha completa na resposta do comando badges:', secondError);
      }
    }
  }
}

function getBadgeName(badge: string): string {
  const names: { [key: string]: string } = {
    'Partner': 'Parceiro Discord',
    'HypeSquadOnlineHouse1': 'HypeSquad Bravery',
    'HypeSquadOnlineHouse2': 'HypeSquad Brilliance',
    'HypeSquadOnlineHouse3': 'HypeSquad Balance',
    'VerifiedDeveloper': 'Desenvolvedor Verificado',
    'PremiumEarlySupporter': 'Early Supporter',
    'ActiveDeveloper': 'Desenvolvedor Ativo',
    'Nitro': 'Discord Nitro',
    'Tag': 'Tag Discord',
    'Bot': 'Bot Verificado'
  };

  return names[badge] || badge;
}
