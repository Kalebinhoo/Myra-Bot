import { Client, EmbedBuilder, Events, TextChannel, ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";

async function fetchCommandLogChannel(client: Client): Promise<TextChannel | null> {
	if (!process.env.COMMAND_LOG_CHANNEL_ID) {
		console.warn("COMMAND_LOG_CHANNEL_ID não configurado. Pulando logs de comandos.");
		return null;
	}

	try {
		const channel = await client.channels.fetch(process.env.COMMAND_LOG_CHANNEL_ID!);
		return channel instanceof TextChannel ? channel : null;
	} catch (error) {
		console.error("Não foi possível acessar o canal de logs de comandos:", error);
		return null;
	}
}

function buildCommandEmbed(options: {
	commandName: string;
	userName: string;
	userId: string;
	userAvatar?: string;
	guildName: string;
	guildId: string;
	channelName: string;
	channelId: string;
	options?: string;
	success: boolean;
}): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor(options.success ? 0x38a169 : 0xff5c5c)
		.setTitle(`${options.success ? '✅' : '❌'} Comando Executado`)
		.addFields(
			{ name: "🔧 Comando", value: `\`/${options.commandName}\``, inline: true },
			{ name: "👤 Usuário", value: `<@${options.userId}>\n${options.userId}`, inline: true },
			{ name: "🌐 Servidor", value: `${options.guildName}\n\`${options.guildId}\``, inline: true },
			{ name: "📝 Canal", value: `#${options.channelName}\n\`${options.channelId}\``, inline: true },
			{ name: "⏰ Data/Hora", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
			{ name: "📊 Status", value: options.success ? "Sucesso" : "Erro", inline: true }
		)
		.setTimestamp();

	if (options.userAvatar) {
		embed.setThumbnail(options.userAvatar);
	}

	return embed;
}

function formatCommandOptions(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): string {
	if (!('options' in interaction) || !interaction.options.data.length) {
		return "Sem parâmetros";
	}

	const options = interaction.options.data.map(option => {
		let value = option.value?.toString() || "N/A";
		
		if (value.length > 100) {
			value = value.substring(0, 97) + "...";
		}

		return `**${option.name}:** ${value}`;
	});

	return options.join("\n");
}

export function handleCommandLogs(client: Client): void {
	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) {
			return;
		}

		try {
			const logChannel = await fetchCommandLogChannel(client);
			if (!logChannel) {
				return;
			}

			if (!interaction.guild) {
				return;
			}

			const user = interaction.user;
			const guild = interaction.guild;
			const channel = interaction.channel;

			if (!channel) return;

			const commandOptions = formatCommandOptions(interaction);
			
			const embed = buildCommandEmbed({
				commandName: interaction.commandName,
				userName: user.displayName || user.username,
				userId: user.id,
				userAvatar: user.displayAvatarURL({ size: 64 }),
				guildName: guild.name,
				guildId: guild.id,
				channelName: 'name' in channel ? channel.name : 'Canal Desconhecido',
				channelId: channel.id,
				options: commandOptions,
				success: true
			});

			await logChannel.send({ embeds: [embed] });

			console.log(`[COMMAND LOG] ${user.username} executou /${interaction.commandName} em ${guild.name}`);

		} catch (error) {
			console.error("Erro ao registrar log de comando:", error);
		}
	});
}

export function handleCommandErrors(client: Client): void {
	client.on('error', async (error) => {
		try {
			const logChannel = await fetchCommandLogChannel(client);
			if (!logChannel) {
				return;
			}

			const embed = new EmbedBuilder()
				.setColor(0xff5c5c)
				.setTitle('🚨 Erro no Bot')
				.setDescription(`\`\`\`${error.message}\`\`\``)
				.setTimestamp();

			await logChannel.send({ embeds: [embed] });

		} catch (logError) {
			console.error("Erro ao registrar erro no log:", logError);
		}
	});
}
