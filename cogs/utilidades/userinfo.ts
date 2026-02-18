import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  User,
} from "discord.js";

export async function executeUserInfo(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({ content: "Este comando só pode ser usado em servidores!", flags: [64] });
  }

  let member: GuildMember | null = null;

  try {
    member = await guild.members.fetch({ user: targetUser.id, force: true });
  } catch (error) {
  }

  const activities = member?.presence?.activities || [];
  const activity = activities.length > 0 ? activities[0] : null;

  const statusEmojis = {
    online: "🟢 Online",
    idle: "🟡 Ausente", 
    dnd: "🔴 Não Perturbe",
    offline: "⚫ Offline"
  };

  const userStatus = member?.presence?.status || 'offline';

  const roles = member?.roles.cache
    .filter(role => role.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .first(10)
    .map(role => `<@&${role.id}>`)
    .join(' ') || "Nenhum cargo";

  let specialPerms = [];
  if (member?.permissions.has('Administrator')) specialPerms.push('👑 Administrador');
  if (member?.permissions.has('ManageGuild')) specialPerms.push('⚙️ Gerenciar Servidor');
  if (member?.permissions.has('ManageChannels')) specialPerms.push('📋 Gerenciar Canais');
  if (member?.permissions.has('ManageMessages')) specialPerms.push('🗑️ Gerenciar Mensagens');

  const userFlags = targetUser.flags?.toArray() || [];
  const badges = [];

  if (userFlags.includes('Staff')) badges.push('<:DiscordStaff:1234567890>');
  if (userFlags.includes('Partner')) badges.push('<:partnered:1472813032823590933>');
  if (userFlags.includes('HypeSquadOnlineHouse1')) badges.push('<:bravery:1472812948237062224>');
  if (userFlags.includes('HypeSquadOnlineHouse2')) badges.push('<:brilliance:1472812974275297372>');
  if (userFlags.includes('HypeSquadOnlineHouse3')) badges.push('<:balance:1472812991807488031>');
  if (userFlags.includes('VerifiedDeveloper')) badges.push('<:verificaded_developer:1472813053081944116>');
  if (userFlags.includes('PremiumEarlySupporter')) badges.push('<:early:1472813010924863609>');;
  if (userFlags.includes('VerifiedBot')) badges.push('<:VerifiedBot:1234567890>');
  if (userFlags.includes('ActiveDeveloper')) badges.push('<:active_developer:1472718705606660240>');

  if (targetUser.avatar?.startsWith('a_') || targetUser.banner) {
    badges.push('<:Nitro:1472718185953235038>');
  }

  const badgesText = badges.length > 0 ? badges.join(' ') : "Nenhuma insígnia";

  const embed = new EmbedBuilder()
    .setColor(member?.displayHexColor || 0x00FF00)
    .setTitle(`👤 ${targetUser.displayName}`)
    .setThumbnail(targetUser.displayAvatarURL({ size: 1024 }))
    .addFields(
      { name: "🏷️ Nome de Usuário", value: `**${targetUser.username}**`, inline: true },
      { name: "🆔 ID", value: targetUser.id, inline: true },
      { name: "🤖 Tipo", value: targetUser.bot ? "🤖 Bot" : "👤 Usuário", inline: true },
      { name: "📅 Conta Criada", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`, inline: true },
      { name: "🏅 Insígnias", value: badgesText, inline: false }
    );

  if (member) {
    embed.addFields(
      { name: "📅 Entrou no Servidor", value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:F>\n(<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:R>)`, inline: true },
      { name: "🎭 Cargos", value: roles.length > 1900 ? "Muitos cargos para exibir" : roles, inline: false }
    );
  } else {
    embed.addFields(
      { name: "⚠️ Status no Servidor", value: "Usuário não está neste servidor", inline: false }
    );
  }

  embed.setFooter({ text: "👤 Informações do Usuário" })
       .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
