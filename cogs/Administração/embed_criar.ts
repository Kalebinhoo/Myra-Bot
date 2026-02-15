import { 
    ChatInputCommandInteraction, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ColorResolvable, 
    TextChannel,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SelectMenuInteraction,
    Webhook,
    Collection
} from "discord.js";
import fs from "fs";
import path from "path";

interface EmbedTemplate {
    name: string;
    title?: string;
    description?: string;
    color?: string;
    footer?: string;
    image?: string;
    thumbnail?: string;
    author?: string;
    url?: string;
}

const TEMPLATES_FILE = path.join(__dirname, "..", "..", "embed_templates.json");

import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db: Db | null = null;
async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("myra_bot");
  return db;
}


import { Document, WithId } from "mongodb";
async function loadTemplatesFromDb(userId: string): Promise<EmbedTemplate[]> {
    const db = await getDb();
    const docs: WithId<Document>[] = await db.collection("embed_templates").find({ userId }).toArray();
    return docs.map(doc => ({
        name: doc.name,
        title: doc.title,
        description: doc.description,
        color: doc.color,
        footer: doc.footer,
        image: doc.image,
        thumbnail: doc.thumbnail,
        author: doc.author,
        url: doc.url
    }));
}

async function getTemplateByName(userId: string, name: string): Promise<EmbedTemplate | null> {
    const db = await getDb();
    const doc = await db.collection("embed_templates").findOne({ userId, name });
    if (!doc) return null;
    return {
        name: doc.name,
        title: doc.title,
        description: doc.description,
        color: doc.color,
        footer: doc.footer,
        image: doc.image,
        thumbnail: doc.thumbnail,
        author: doc.author,
        url: doc.url
    };
}

async function saveTemplateToDb(userId: string, template: EmbedTemplate): Promise<void> {
    const db = await getDb();
    await db.collection("embed_templates").updateOne(
        { userId, name: template.name },
        { $set: { ...template, userId } },
        { upsert: true }
    );
}

const embedBuilderData = new Map<string, Partial<EmbedTemplate>>();

export async function executeCriarEmbed(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("? Sem Permiss�o")
            .setDescription("Voc� precisa ser administrador para usar este comando!")
            .setTimestamp();

        return void await interaction.reply({ embeds: [errorEmbed], flags: [64] });
    }

    const userId = interaction.user.id;
    embedBuilderData.set(userId, {});
    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_titulo_${userId}`)
                .setLabel("?? T�tulo")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_descricao_${userId}`)
                .setLabel("?? Descri��o")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_cor_${userId}`)
                .setLabel("?? Cor")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_banner_${userId}`)
                .setLabel("??? Banner")
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_thumbnail_${userId}`)
                .setLabel("?? Thumbnail")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_autor_${userId}`)
                .setLabel("?? Autor")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_url_${userId}`)
                .setLabel("?? URL")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_footer_${userId}`)
                .setLabel("?? Footer")
                .setStyle(ButtonStyle.Primary)
        );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_preview_${userId}`)
                .setLabel("?? Preview")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`embed_template_${userId}`)
                .setLabel("?? Templates")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`embed_send_${userId}`)
                .setLabel("? Enviar Embed")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`embed_cancel_${userId}`)
                .setLabel("? Cancelar")
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({
        content: "**Myra Embed Generator ???**",
        components: [row1, row2, row3],
        flags: [64]
    });
}

async function updateConfigEmbed(interaction: ButtonInteraction | ModalSubmitInteraction | SelectMenuInteraction, userId: string): Promise<void> {
    const data = embedBuilderData.get(userId) || {};
    
    let embeds: EmbedBuilder[] = [];
    let content = "?? **Clique nos bot�es para configurar sua embed!**";

    if (data.title || data.description) {
        const previewEmbed = buildEmbedFromData(data);
        embeds.push(previewEmbed);
        content = "?? **Configure sua embed usando os bot�es abaixo:**";
    }

    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_titulo_${userId}`)
                .setLabel("?? T�tulo")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_descricao_${userId}`)
                .setLabel("?? Descri��o")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_cor_${userId}`)
                .setLabel("?? Cor")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_banner_${userId}`)
                .setLabel("??? Banner")
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_thumbnail_${userId}`)
                .setLabel("?? Thumbnail")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_autor_${userId}`)
                .setLabel("?? Autor")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_url_${userId}`)
                .setLabel("?? URL")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`embed_footer_${userId}`)
                .setLabel("?? Footer")
                .setStyle(ButtonStyle.Primary)
        );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`embed_preview_${userId}`)
                .setLabel("?? Preview")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`embed_template_${userId}`)
                .setLabel("?? Templates")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`embed_send_${userId}`)
                .setLabel("? Enviar Embed")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`embed_cancel_${userId}`)
                .setLabel("? Cancelar")
                .setStyle(ButtonStyle.Danger)
        );

    try {
        await interaction.editReply({
            content: content,
            embeds: embeds,
            components: [row1, row2, row3]
        });
    } catch (error) {
        console.error("Erro ao atualizar embed de configura��o:", error);
    }
}

export async function handleEmbedButton(interaction: ButtonInteraction): Promise<void> {
    const parts = interaction.customId.split('_');
    
    let field: string;
    let userId: string;
    
    if (parts[0] === 'embedgenerator') {
        field = parts[1];
        userId = parts[2];
    } else {
        field = parts[1];
        userId = parts[2];
    }
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar estes bot�es!",
            flags: [64]
        });
        return;
    }

    switch (field) {
        case 'titulo':
            await showTitleModal(interaction, userId);
            break;
        case 'descricao':
            await showDescriptionModal(interaction, userId);
            break;
        case 'cor':
            await showColorModal(interaction, userId);
            break;
        case 'banner':
            await showBannerModal(interaction, userId);
            break;
        case 'thumbnail':
            await showThumbnailModal(interaction, userId);
            break;
        case 'autor':
            await showAuthorModal(interaction, userId);
            break;
        case 'url':
            await showUrlModal(interaction, userId);
            break;
        case 'footer':
            await showFooterModal(interaction, userId);
            break;
        case 'preview':
            await showPreview(interaction, userId);
            break;
        case 'template':
            await showTemplateMenu(interaction, userId);
            break;
        case 'send':
            const isFromPreview = parts[0] === 'embedgenerator';
            await sendEmbed(interaction, userId, isFromPreview);
            break;
        case 'cancel':
            await cancelEmbed(interaction, userId);
            break;
        case 'back':
            await interaction.deferUpdate();
            await updateConfigEmbed(interaction, userId);
            break;
    }
}

async function showTitleModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_titulo_${userId}`)
        .setTitle("Configurar T�tulo");

    const titleInput = new TextInputBuilder()
        .setCustomId('titulo')
        .setLabel("T�tulo do Embed")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256)
        .setRequired(false)
        .setPlaceholder("Digite o t�tulo do embed...")
        .setValue(currentData.title || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showDescriptionModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_descricao_${userId}`)
        .setTitle("Configurar Descri��o");

    const descriptionInput = new TextInputBuilder()
        .setCustomId('descricao')
        .setLabel("Descri��o do Embed")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(4000)
        .setRequired(false)
        .setPlaceholder("Digite a descri��o do embed... (aceita qualquer pontua��o)")
        .setValue(currentData.description || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showColorModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_cor_${userId}`)
        .setTitle("Configurar Cor");

    const colorInput = new TextInputBuilder()
        .setCustomId('cor')
        .setLabel("Cor do Embed (hex)")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(7)
        .setRequired(false)
        .setPlaceholder("#0099ff")
        .setValue(currentData.color || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showBannerModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_banner_${userId}`)
        .setTitle("Configurar Banner");

    const bannerInput = new TextInputBuilder()
        .setCustomId('banner')
        .setLabel("URL do Banner")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("https://exemplo.com/banner.png")
        .setValue(currentData.image || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bannerInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showThumbnailModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_thumbnail_${userId}`)
        .setTitle("Configurar Thumbnail");

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('thumbnail')
        .setLabel("URL do Thumbnail")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("https://exemplo.com/thumb.png")
        .setValue(currentData.thumbnail || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnailInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showAuthorModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_autor_${userId}`)
        .setTitle("Configurar Autor");

    const authorInput = new TextInputBuilder()
        .setCustomId('autor')
        .setLabel("Nome do Autor")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256)
        .setRequired(false)
        .setPlaceholder("Nome do autor...")
        .setValue(currentData.author || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(authorInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showUrlModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_url_${userId}`)
        .setTitle("Configurar URL");

    const urlInput = new TextInputBuilder()
        .setCustomId('url')
        .setLabel("URL do T�tulo")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("https://exemplo.com")
        .setValue(currentData.url || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function showFooterModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const currentData = embedBuilderData.get(userId) || {};
    
    const modal = new ModalBuilder()
        .setCustomId(`embed_modal_footer_${userId}`)
        .setTitle("Configurar Footer");

    const footerInput = new TextInputBuilder()
        .setCustomId('footer')
        .setLabel("Texto do Footer")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(2048)
        .setRequired(false)
        .setPlaceholder("Texto do rodap�...")
        .setValue(currentData.footer || '');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

export async function handleEmbedModal(interaction: ModalSubmitInteraction): Promise<void> {
    const [embed, modal, field, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar este modal!",
            flags: [64]
        });
        return;
    }

    const currentData = embedBuilderData.get(userId) || {};
    const value = interaction.fields.getTextInputValue(field);

    if (field === 'cor' && value) {
        const colorMatch = value.match(/^#?([0-9a-fA-F]{6})$/);
        if (!colorMatch) {
            await interaction.reply({
                content: "? Cor inv�lida! Use formato hexadecimal (#ff0000)",
                flags: [64]
            });
            return;
        }
        currentData.color = colorMatch[0].startsWith('#') ? colorMatch[0] : '#' + colorMatch[1];
    } else if ((field === 'banner' || field === 'thumbnail' || field === 'url') && value) {
        try {
            new URL(value);
            if (field === 'banner') currentData.image = value;
            else if (field === 'thumbnail') currentData.thumbnail = value;
            else currentData.url = value;
        } catch {
            await interaction.reply({
                content: "? URL inv�lida!",
                flags: [64]
            });
            return;
        }
    } else {
        switch (field) {
            case 'titulo':
                if (value && value.length > 256) {
                    await interaction.reply({
                        content: "? T�tulo muito longo! Limite: 256 caracteres",
                        flags: [64]
                    });
                    return;
                }
                currentData.title = value || undefined;
                break;
            case 'descricao':
                if (value && value.length > 4000) {
                    await interaction.reply({
                        content: "? Descri��o muito longa! Limite: 4000 caracteres",
                        flags: [64]
                    });
                    return;
                }
                currentData.description = value || undefined;
                break;
            case 'autor':
                if (value && value.length > 256) {
                    await interaction.reply({
                        content: "? Nome do autor muito longo! Limite: 256 caracteres",
                        flags: [64]
                    });
                    return;
                }
                currentData.author = value || undefined;
                break;
            case 'footer':
                if (value && value.length > 2048) {
                    await interaction.reply({
                        content: "? Footer muito longo! Limite: 2048 caracteres",
                        flags: [64]
                    });
                    return;
                }
                currentData.footer = value || undefined;
                break;
        }
    }

    embedBuilderData.set(userId, currentData);
    
    await interaction.deferUpdate();
    await updateConfigEmbed(interaction, userId);
}

async function showPreview(interaction: ButtonInteraction, userId: string): Promise<void> {
    const data = embedBuilderData.get(userId) || {};
    
    if (!data.title && !data.description) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "? Configure pelo menos um t�tulo ou descri��o para ver o preview!",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "? Configure pelo menos um t�tulo ou descri��o para ver o preview!",
                ephemeral: true
            });
        }
        return;
    }

    try {
        const previewEmbed = buildEmbedFromData(data);
        
        const backButton = new ButtonBuilder()
            .setCustomId(`embedgenerator_back_${userId}`)
            .setLabel("?? Voltar")
            .setStyle(ButtonStyle.Secondary);

        const sendButton = new ButtonBuilder()
            .setCustomId(`embedgenerator_send_${userId}`)
            .setLabel("?? Enviar Embed")
            .setStyle(ButtonStyle.Success);
            
        const cancelButton = new ButtonBuilder()
            .setCustomId(`embedgenerator_cancel_${userId}`)
            .setLabel("? Cancelar")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(backButton, sendButton, cancelButton);
        
        await interaction.update({
            content: "?? **Preview do seu Embed:**",
            embeds: [previewEmbed],
            components: [row]
        });
    } catch (error) {
        await interaction.update({
            content: "? Erro ao gerar preview. Verifique os dados inseridos.",
            embeds: [],
            components: []
        });
    }
}

async function showTemplateMenu(interaction: ButtonInteraction, userId: string): Promise<void> {
    const templates = await loadTemplatesFromDb(userId);
    
    const embed = new EmbedBuilder()
        .setTitle("?? Sistema de Templates")
        .setDescription("**?? Salvar:** Gera um arquivo .json para baixar\n**?? Carregar:** Cola o conte�do do arquivo .json para usar")
        .setColor(0x0099ff);

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`template_save_${userId}`)
                .setLabel("?? Salvar Template")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`template_load_${userId}`)
                .setLabel("?? Carregar Template")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`embedgenerator_back_${userId}`)
                .setLabel("?? Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({
        content: undefined,
        embeds: [embed],
        components: [row]
    });
}

export async function handleTemplateButton(interaction: ButtonInteraction): Promise<void> {
    const [template, action, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar estes bot�es!",
            flags: [64]
        });
        return;
    }

    switch (action) {
        case 'save':
            await showSaveTemplateModal(interaction, userId);
            break;
        case 'load':
            await showLoadTemplateModal(interaction, userId);
            break;
        case 'back':
            await interaction.deferUpdate();
            await updateConfigEmbed(interaction, userId);
            break;
    }
}

async function showSaveTemplateModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId(`template_save_modal_${userId}`)
        .setTitle("Salvar Template");

    const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel("Nome do Template")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50)
        .setRequired(true)
        .setPlaceholder("Nome para identificar o template...");

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

export async function handleTemplateSaveModal(interaction: ModalSubmitInteraction): Promise<void> {
    const [template, save, modal, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar este modal!",
            flags: [64]
        });
        return;
    }

    const name = interaction.fields.getTextInputValue('name');
    const data = embedBuilderData.get(userId) || {};

    if (!data.title && !data.description) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "? Configure pelo menos um t�tulo ou descri��o antes de salvar!",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "? Configure pelo menos um t�tulo ou descri��o antes de salvar!",
                ephemeral: true
            });
        }
        return;
    }

    const templateData: EmbedTemplate = {
        name,
        title: data.title,
        description: data.description,
        color: data.color,
        footer: data.footer,
        image: data.image,
        thumbnail: data.thumbnail,
        author: data.author,
        url: data.url
    };

    const jsonContent = JSON.stringify(templateData, null, 2);
    const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_template.json`;
    const buffer = Buffer.from(jsonContent, 'utf8');
    
    try {
        await interaction.reply({
            content: `?? **Template "${name}" gerado com sucesso!**\n\n?? Baixe o arquivo abaixo e guarde-o para usar posteriormente.\n?? Para carregar este template, use o bot�o "Carregar Template" e cole o conte�do do arquivo.`,
            files: [{
                attachment: buffer,
                name: fileName,
                description: `Template: ${name}`
            }],
            flags: [64]
        });
        
    } catch (error) {
        console.error("Erro ao enviar arquivo de template:", error);
        await interaction.reply({
            content: "? Erro ao gerar arquivo de template. Tente novamente.",
            flags: [64]
        });
    }
}

async function showLoadTemplateModal(interaction: ButtonInteraction, userId: string): Promise<void> {
    const modal = new ModalBuilder()
        .setCustomId(`template_load_modal_${userId}`)
        .setTitle("Carregar Template");

    const templateInput = new TextInputBuilder()
        .setCustomId('template_json')
        .setLabel("Cole o conte�do do arquivo de template aqui")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('{"name": "Meu Template", "title": "...", "description": "...", ...}');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(templateInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

export async function handleTemplateLoadModal(interaction: ModalSubmitInteraction): Promise<void> {
    const [template, load, modal, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar este modal!",
            flags: [64]
        });
        return;
    }

    const jsonContent = interaction.fields.getTextInputValue('template_json');
    
    try {
        const templateData = JSON.parse(jsonContent) as EmbedTemplate;
        if (!templateData.name || (!templateData.title && !templateData.description)) {
            await interaction.reply({
                content: "? Template inv�lido! Certifique-se de que o template tem pelo menos um nome e t�tulo ou descri��o.",
                flags: [64]
            });
            return;
        }
        
        embedBuilderData.set(userId, templateData);
        
        await interaction.reply({
            content: `? Template "${templateData.name}" carregado com sucesso!`,
            flags: [64]
        });
        setTimeout(async () => {
            try {
                await updateConfigEmbed(interaction, userId);
            } catch (error) {
                console.error("Erro ao atualizar config ap�s carregar template:", error);
            }
        }, 1000);
        
    } catch (error) {
        console.error("Erro ao processar JSON do template:", error);
        await interaction.reply({
            content: "? Erro ao processar template! Verifique se o JSON est� correto e tente novamente.\n\n**Exemplo de formato v�lido:**\n```json\n{\n  \"name\": \"Meu Template\",\n  \"title\": \"T�tulo da Embed\",\n  \"description\": \"Descri��o da embed\",\n  \"color\": \"#0099ff\"\n}\n```",
            flags: [64]
        });
    }
}

async function sendEmbed(interaction: ButtonInteraction, userId: string, isFromPreview: boolean = false): Promise<void> {
    const data = embedBuilderData.get(userId) || {};
    
    if (!data.title && !data.description) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "? Configure pelo menos um t�tulo ou descri��o antes de enviar!",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "? Configure pelo menos um t�tulo ou descri��o antes de enviar!",
                ephemeral: true
            });
        }
        return;
    }

    try {
        const embed = buildEmbedFromData(data);
        
        const channelSelect = new StringSelectMenuBuilder()
            .setCustomId(`embed_channel_select_${userId}`)
            .setPlaceholder('Selecione onde enviar o embed')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Canal Atual')
                    .setDescription('Enviar no canal onde o comando foi usado')
                    .setValue('current'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Outro Canal')
                    .setDescription('Selecionar um canal espec�fico')
                    .setValue('other')
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelect);
        
        const responseData = {
            content: "?? Onde voc� quer enviar este embed?",
            embeds: [],
            components: [row]
        };

        if (isFromPreview) {
            await interaction.update(responseData);
        } else {
            await interaction.reply({...responseData, flags: [64]});
        }

    } catch (error) {
        const errorMessage = {
            content: "? Erro ao preparar embed. Verifique os dados inseridos.",
            embeds: [],
            components: []
        };
        
        if (isFromPreview) {
            await interaction.update(errorMessage);
        } else {
            await interaction.reply({...errorMessage, flags: [64]});
        }
    }
}

export async function handleChannelSelect(interaction: SelectMenuInteraction): Promise<void> {
    const [embed, channel, select, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar este menu!",
            flags: [64]
        });
        return;
    }

    const choice = interaction.values[0];
    const data = embedBuilderData.get(userId) || {};
    
    try {
        const embedToSend = buildEmbedFromData(data);
        
        if (choice === 'current') {
            const channel = interaction.channel as TextChannel;
            
            if (!channel) {
                await interaction.reply({
                    content: "? Erro: Canal n�o encontrado!",
                    flags: [64]
                });
                return;
            }

            const botPermissions = channel.permissionsFor(interaction.client.user!);
            if (!botPermissions?.has(PermissionFlagsBits.ManageWebhooks)) {
                await channel.send({ embeds: [embedToSend] });
                
                await interaction.reply({
                    content: "? Embed enviado com sucesso! (Sem permiss�o para webhooks)",
                    flags: [64]
                });
                
                embedBuilderData.delete(userId);
                return;
            }

            try {
                const webhooks = await channel.fetchWebhooks();
                let webhook = webhooks.find(wh => wh.owner?.id === interaction.client.user?.id);

                if (!webhook) {
                    webhook = await channel.createWebhook({
                        name: 'Myra',
                        avatar: interaction.client.user?.displayAvatarURL(),
                        reason: 'Webhook para embeds personalizados'
                    });
                }

                await webhook.send({ 
                    embeds: [embedToSend],
                    username: 'Myra',
                    avatarURL: interaction.client.user?.displayAvatarURL()
                });

                await interaction.reply({
                    content: "? Embed enviado com sucesso via webhook!",
                    flags: [64]
                });

            } catch (webhookError) {
                console.error("Erro ao usar webhook:", webhookError);
                
                await channel.send({ embeds: [embedToSend] });
                
                await interaction.reply({
                    content: "? Embed enviado com sucesso! (m�todo alternativo)",
                    flags: [64]
                });
            }
            
        } else if (choice === 'other') {
            const guild = interaction.guild;
            if (!guild) {
                await interaction.reply({
                    content: "? Erro: Servidor n�o encontrado!",
                    flags: [64]
                });
                return;
            }

            const allChannels = guild.channels.cache.filter(channel => 
                channel.type === 0 &&
                channel.permissionsFor(interaction.client.user!)?.has(PermissionFlagsBits.SendMessages) &&
                channel.permissionsFor(interaction.client.user!)?.has(PermissionFlagsBits.ViewChannel)
            );

            const textChannels = allChannels.first(25) as TextChannel[];

            if (textChannels.length === 0) {
                await interaction.reply({
                    content: "? Nenhum canal dispon�vel encontrado!",
                    flags: [64]
                });
                return;
            }

            const channelOptions = textChannels.map(channel => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(`#${channel.name}`)
                    .setDescription(channel.topic ? channel.topic.substring(0, 100) : 'Sem descri��o')
                    .setValue(channel.id)
            );

            const channelSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`embed_specific_channel_${userId}`)
                .setPlaceholder('Selecione um canal espec�fico')
                .addOptions(channelOptions);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(channelSelectMenu);

            await interaction.update({
                content: "?? **Selecione o canal onde deseja enviar a embed:**",
                components: [row]
            });
            return;
        }
        
        embedBuilderData.delete(userId);
        
    } catch (error) {
        await interaction.reply({
            content: "? Erro ao enviar embed.",
            flags: [64]
        });
    }
}

export async function handleSpecificChannelSelect(interaction: SelectMenuInteraction): Promise<void> {
    const [embed, specific, channel, userId] = interaction.customId.split('_');
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: "? Voc� n�o pode usar este menu!",
            flags: [64]
        });
        return;
    }

    const channelId = interaction.values[0];
    const data = embedBuilderData.get(userId) || {};
    
    try {
        const embedToSend = buildEmbedFromData(data);
        const targetChannel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
        
        if (!targetChannel) {
            await interaction.reply({
                content: "? Canal n�o encontrado!",
                flags: [64]
            });
            return;
        }

        const botPermissions = targetChannel.permissionsFor(interaction.client.user!);
        if (!botPermissions?.has(PermissionFlagsBits.SendMessages)) {
            await interaction.reply({
                content: `? N�o tenho permiss�o para enviar mensagens em ${targetChannel}!`,
                flags: [64]
            });
            return;
        }

        if (botPermissions.has(PermissionFlagsBits.ManageWebhooks)) {
            try {
                const webhooks = await targetChannel.fetchWebhooks();
                let webhook = webhooks.find(wh => wh.owner?.id === interaction.client.user?.id);

                if (!webhook) {
                    webhook = await targetChannel.createWebhook({
                        name: 'Myra',
                        avatar: interaction.client.user?.displayAvatarURL(),
                        reason: 'Webhook para embeds personalizados'
                    });
                }

                await webhook.send({ 
                    embeds: [embedToSend],
                    username: 'Myra',
                    avatarURL: interaction.client.user?.displayAvatarURL()
                });

                await interaction.update({
                    content: `? Embed enviado com sucesso em ${targetChannel} via webhook!`,
                    components: []
                });

            } catch (webhookError) {
                await targetChannel.send({ embeds: [embedToSend] });
                
                await interaction.update({
                    content: `? Embed enviado com sucesso em ${targetChannel}!`,
                    components: []
                });
            }
        } else {
            await targetChannel.send({ embeds: [embedToSend] });
            
            await interaction.update({
                content: `? Embed enviado com sucesso em ${targetChannel}!`,
                components: []
            });
        }
        
        embedBuilderData.delete(userId);
        
    } catch (error) {
        console.error("Erro ao enviar para canal espec�fico:", error);
        await interaction.reply({
            content: "? Erro ao enviar embed para o canal selecionado.",
            flags: [64]
        });
    }
}

async function cancelEmbed(interaction: ButtonInteraction, userId: string): Promise<void> {
    embedBuilderData.delete(userId);
    
    const cancelEmbed = new EmbedBuilder()
        .setTitle("? Cria��o Cancelada")
        .setDescription("A cria��o do embed foi cancelada.\n\n*Esta mensagem ser� apagada em 5 segundos...*")
        .setColor(0xFF0000)
        .setTimestamp();

    await interaction.update({
        content: undefined,
        embeds: [cancelEmbed],
        components: []
    });
    
    setTimeout(async () => {
        try {
            await interaction.deleteReply();
        } catch (error) {
            console.error("Erro ao deletar mensagem de cancelamento:", error);
        }
    }, 5000);
}

function buildEmbedFromData(data: Partial<EmbedTemplate>): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTimestamp();

    if (data.color) {
        embed.setColor(parseInt(data.color.replace('#', ''), 16));
    } else {
        embed.setColor(0x0099ff);
    }

    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.author) embed.setAuthor({ name: data.author });
    if (data.footer) embed.setFooter({ text: data.footer });
    if (data.image) embed.setImage(data.image);
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.url) embed.setURL(data.url);

    return embed;
}
