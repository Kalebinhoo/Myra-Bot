import { ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, User, Guild } from "discord.js";
import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D, Image } from "canvas";
import { getAllNonDefaultSaldos } from "./saldo";

interface UserData {
  position: number;
  username: string;
  displayName: string;
  balance: number;
  userId: string;
}

export async function executeRank(interaction: ChatInputCommandInteraction, page: number = 0): Promise<void> {
  try {
    const guild = interaction.guild;
    if (!guild) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: "❌ Este comando só funciona em servidores!"
        });
      }
      return;
    }

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ 
          content: "\u270d\ud83c\udffb Estou trabalhando no ranking s\u00f3 um instante...**"
        });
        console.log(`[RANK] \ud83c\udfa8 Gerando ranking visual para ${guild.name}`);
      } catch (replyError) {
        console.error('[RANK] Erro ao responder:', replyError);
        return;
      }
    } else if (interaction.deferred) {
      console.log(`[RANK] 🔄 Atualizando ranking para ${guild.name}`);
    }

    const nonDefaultSaldos = await getAllNonDefaultSaldos();
    const membersCache = guild.members.cache;
    const usersData: UserData[] = [];

    for (const [userId, saldo] of nonDefaultSaldos.entries()) {
      const member = membersCache.get(userId);
      if (member && !member.user.bot) {
        usersData.push({
          position: 0,
          username: member.user.username,
          displayName: member.displayName || member.user.username,
          balance: saldo,
          userId: userId
        });
      }
    }

    if (usersData.length < 50) {
      let count = 0;
      for (const [userId, member] of membersCache) {
        if (member.user.bot || nonDefaultSaldos.has(userId) || count >= 50) continue;
        
        usersData.push({
          position: 0,
          username: member.user.username,
          displayName: member.displayName || member.user.username,
          balance: 100,
          userId: userId
        });
        count++;
      }
    }

    if (usersData.length === 0) {
      const noUsersMsg = '❌ Nenhum usuário encontrado no sistema de economia!\n*Use `/daily` para começar a ganhar petiscos!*';
      
      try {
        await interaction.editReply(noUsersMsg);
      } catch (e) {
        console.error('[RANK] Erro ao editar resposta:', e.message);
      }
      return;
    }

    usersData.sort((a, b) => b.balance - a.balance);
    usersData.forEach((user, index) => {
      user.position = index + 1;
    });

    const usersPerPage = 10;
    const totalPages = Math.ceil(usersData.length / usersPerPage);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    
    console.log(`[RANK] 📊 Total users: ${usersData.length}, Total pages: ${totalPages}, Current page: ${currentPage}`);

    let serverIcon: Image | null = null;
    try {
      const iconURL = guild.iconURL({
        extension: "png",
        size: 128
      });
      
      if (iconURL) {
        serverIcon = await loadImage(iconURL);
      }
    } catch (error) {
      console.log('[RANK] Servidor não possui ícone');
    }

    try {
      const startIndex = currentPage * usersPerPage;
      const displayUsers = usersData.slice(startIndex, startIndex + usersPerPage);
      
      const canvas: Canvas = createCanvas(900, 120 + (displayUsers.length * 100));
      const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0f2027');
      gradient.addColorStop(0.5, '#1a372a');
      gradient.addColorStop(1, '#2d5016');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, 80);

      if (serverIcon) {
        ctx.drawImage(serverIcon, 25, 15, 50, 50);
      } else {
        ctx.fillStyle = '#1a372a';
        ctx.fillRect(25, 15, 50, 50);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('S', 50, 47);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      const serverName = guild.name.length > 25 ? guild.name.substring(0, 25) + '...' : guild.name;
      ctx.fillText(`Ranking Myra`, canvas.width / 2, 50);

      for (let i = 0; i < displayUsers.length; i++) {
        const user = displayUsers[i];
        const y = 100 + (i * 100);
        
        const userGradient = ctx.createLinearGradient(20, y, 20, y + 80);
        if (user.position <= 3) {
          const topColors = [
            ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)'],
            ['rgba(192, 192, 192, 0.3)', 'rgba(192, 192, 192, 0.1)'],
            ['rgba(205, 127, 50, 0.3)', 'rgba(205, 127, 50, 0.1)']
          ];
          userGradient.addColorStop(0, topColors[user.position - 1][0]);
          userGradient.addColorStop(1, topColors[user.position - 1][1]);
        } else {
          userGradient.addColorStop(0, 'rgba(26, 55, 42, 0.8)');
          userGradient.addColorStop(1, 'rgba(26, 55, 42, 0.4)');
        }
        
        ctx.fillStyle = userGradient;
        ctx.fillRect(20, y, canvas.width - 40, 80);

        if (user.position <= 3) {
          const borderColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          ctx.strokeStyle = borderColors[user.position - 1];
          ctx.lineWidth = 3;
          ctx.strokeRect(20, y, canvas.width - 40, 80);
        } else {
          ctx.strokeStyle = '#38a169';
          ctx.lineWidth = 1;
          ctx.strokeRect(20, y, canvas.width - 40, 80);
        }

        try {
          const userObj: User = await interaction.client.users.fetch(user.userId);
          const avatarURL = userObj.displayAvatarURL({
            extension: "png",
            size: 128
          });
          const avatar: Image = await loadImage(avatarURL);
          
          ctx.drawImage(avatar, 40, y + 10, 60, 60);
        } catch (error) {
          ctx.fillStyle = '#1a372a';
          ctx.fillRect(40, y + 10, 60, 60);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('?', 70, y + 50);
        }


        ctx.fillStyle = user.position <= 3 ? '#FFD700' : '#b8ff35';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        
        let positionText = `#${user.position}`;
        
        ctx.fillText(positionText, 120, y + 35);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        let displayName = user.displayName;
        if (displayName.length > 20) {
          displayName = displayName.substring(0, 17) + '...';
        }
        ctx.fillText(displayName, 120, y + 60);


        ctx.fillStyle = '#b3ff00';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${user.balance.toLocaleString()} 🌮`, canvas.width - 40, y + 50);
      }


      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Página ${currentPage + 1} de ${totalPages} • PetShop da Myra`, canvas.width / 2, canvas.height - 10);

      const buffer: Buffer = canvas.toBuffer('image/png');
      const attachment: AttachmentBuilder = new AttachmentBuilder(buffer, { name: 'ranking-visual.png' });

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rank_left_${currentPage}`)
            .setLabel('⬅️ Anterior')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`rank_right_${currentPage}`)
            .setLabel('Próxima ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

      try {
        console.log(`[RANK] 🔘 Mandando os botões: ${totalPages > 1 ? 'SIM' : 'NÃO'} (totalpáginas: ${totalPages})`);
        await interaction.editReply({ 
          content: null,
          files: [attachment],
          components: totalPages > 1 ? [row] : []
        });
      } catch (editError) {
        console.error('[RANK] Erro ao editar resposta:', editError);
      }

      console.log(`[RANK] ✅ Ranking visual gerado com sucesso!`);

    } catch (error) {
      console.error('[RANK] Erro ao gerar imagem:', error);
      
      let description = '';
      const startIndex = currentPage * usersPerPage;
      const displayUsers = usersData.slice(startIndex, startIndex + usersPerPage);
      
      displayUsers.forEach((user: UserData) => {
        description += `**#${user.position}** ${user.displayName} - ${user.balance.toLocaleString()} 🌮\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🏆 Ranking de Petiscos')
        .setDescription(description)
        .setColor(0x38a169)
        .setFooter({ text: `Página ${currentPage + 1} de ${totalPages} • ${guild.name}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`rank_left_${currentPage}`)
            .setLabel('⬅️ Anterior')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`rank_right_${currentPage}`)
            .setLabel('Próxima ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

      try {
        await interaction.editReply({ 
          content: null,
          embeds: [embed],
          components: totalPages > 1 ? [row] : []
        });
      } catch (editError) {
        console.error('[RANK] Erro ao editar embed:', editError);
      }
    }

  } catch (error) {
    console.error("[RANK] Erro crítico:", error);
    
    try {
      const errorMsg = "❌ Erro no ranking. Tente novamente!";
      
      try {
        await interaction.editReply({ content: errorMsg });
      } catch (editError) {
        console.error("[RANK] Erro ao editar com mensagem de erro:", editError.message);
      }
    } catch (e) {
      console.error("[RANK] Erro ao responder erro:", e.message);
    }
  }
}

export async function handleRankNavigation(interaction: any) {
  try {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    const [, direction, currentPageStr] = customId.split('_');
    const currentPage = parseInt(currentPageStr);
    
    let newPage = currentPage;
    if (direction === 'left') {
      newPage = Math.max(0, currentPage - 1);
    } else if (direction === 'right') {
      newPage = currentPage + 1;
    }
    
    await interaction.deferUpdate();
    
    await executeRank(interaction, newPage);
  } catch (error) {
    console.error('[RANK] Erro na navegação:', error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: "❌ Erro na navegação. Tente novamente!"
        });
      }
    } catch (e) {
      console.error('[RANK] Erro ao responder erro de navegação:', e.message);
    }
  }
}
