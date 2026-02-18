import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder, TextChannel, Message, GuildChannel } from 'discord.js';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
let mongoClient: MongoClient;

interface CountingConfig {
    guildId: string;
    channelId: string;
    currentNumber: number;
    lastUserId: string | null;
}

async function getDatabase() {
    if (!mongoClient) {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
    }
    return mongoClient.db("myra_bot");
}

async function saveCountingConfig(config: CountingConfig) {
    try {
        const db = await getDatabase();
        const collection = db.collection<CountingConfig>('counting_config');
        
        await collection.replaceOne(
            { guildId: config.guildId },
            config,
            { upsert: true }
        );
    } catch (error) {
        console.error('Erro ao salvar configuração de contagem:', error);
    }
}

async function getCountingConfig(guildId: string): Promise<CountingConfig | null> {
    try {
        const db = await getDatabase();
        const collection = db.collection<CountingConfig>('counting_config');
        
        return await collection.findOne({ guildId });
    } catch (error) {
        console.error('Erro ao obter configuração de contagem:', error);
        return null;
    }
}

async function resetCounting(guildId: string, channel: TextChannel) {
    await saveCountingConfig({
        guildId,
        channelId: channel.id,
        currentNumber: 0,
        lastUserId: null
    });

    const resetEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔄 Contagem Resetada!')
        .setDescription('A contagem foi resetada! Começe novamente digitando **1**.')
        .setTimestamp();

    await channel.send({ embeds: [resetEmbed] });
}

export const data = new SlashCommandBuilder()
    .setName('contagem')
    .setDescription('Configura o sistema de contagem para um canal')
    .addSubcommand(subcommand =>
        subcommand
            .setName('configurar')
            .setDescription('Define um canal para o jogo de contagem')
            .addChannelOption(option =>
                option.setName('canal')
                    .setDescription('O canal onde será feita a contagem')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: '❌ Este comando só pode ser usado em servidores!', ephemeral: true });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'configurar':
            await handleConfigurar(interaction);
            break;
    }
}

async function handleConfigurar(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('canal') as GuildChannel;
    
    if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: '❌ Por favor, selecione um canal de texto válido!', ephemeral: true });
        return;
    }

    const textChannel = channel as TextChannel;

    const permissions = textChannel.permissionsFor(interaction.client.user!);
    if (!permissions?.has(['SendMessages', 'AddReactions', 'ReadMessageHistory'])) {
        await interaction.reply({ 
            content: '❌ Não tenho permissões suficientes neste canal! Preciso de: `Enviar Mensagens`, `Adicionar Reações` e `Ver Histórico de Mensagens`.', 
            ephemeral: true 
        });
        return;
    }

    try {
        await saveCountingConfig({
            guildId: interaction.guildId!,
            channelId: channel.id,
            currentNumber: 0,
            lastUserId: null
        });

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Sistema de Contagem Configurado!')
            .setDescription(`O sistema de contagem foi configurado para ${channel}.\n\n📋 **Como funciona:**\n• Digite números em sequência (1, 2, 3...)\n• O bot reagirá com ✅ quando correto\n• Se errar, a contagem reseta para 1\n• A mesma pessoa não pode contar duas vezes seguidas\n\n🎯 **Comece agora digitando 1!**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        const initialEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🔢 Sistema de Contagem Ativado!')
            .setDescription('🎯 **Objetivo:** Contem até o maior número possível!\n\n📋 **Regras:**\n• Digite números em ordem crescente (1, 2, 3...)\n• Cada pessoa pode contar apenas uma vez por vez\n• Se alguém errar, volta para 1\n\n🚀 **Comece digitando: 1**')
            .setTimestamp();

        await textChannel.send({ embeds: [initialEmbed] });

    } catch (error) {
        console.error('Erro ao configurar contagem:', error);
        await interaction.reply({ content: '❌ Erro ao configurar o sistema de contagem.', ephemeral: true });
    }
}

export async function handleCountingMessage(message: Message) {
    if (!message.guild || message.author.bot) return;
    
    const config = await getCountingConfig(message.guild.id);
    if (!config || config.channelId !== message.channel.id) return;

    const content = message.content.trim();
    const number = parseInt(content);

    if (isNaN(number) || number.toString() !== content) {
        return;
    }

    const expectedNumber = config.currentNumber + 1;

    try {
        if (number === expectedNumber) {
            if (config.lastUserId === message.author.id) {
                await message.react('❌');
                await resetCounting(message.guild.id, message.channel as TextChannel);
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Erro na Contagem!')
                    .setDescription(`${message.author}, você não pode contar duas vezes seguidas!\nComece novamente digitando **1**.`)
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                return;
            }

            await saveCountingConfig({
                ...config,
                currentNumber: number,
                lastUserId: message.author.id
            });

            await message.react('✅');

            if (number % 50 === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('🎉 Marco Alcançado!')
                    .setDescription(`Parabéns! Vocês chegaram ao número **${number}**!\nContinuem contando!`)
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }

        } else {
            await message.react('❌');
            await resetCounting(message.guild.id, message.channel as TextChannel);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Número Incorreto!')
                .setDescription(`${message.author}, o próximo número deveria ser **${expectedNumber}**, mas você digitou **${number}**.\nComece novamente digitando **1**.`)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Erro ao processar contagem:', error);
        await message.react('⚠️');
    }
}
