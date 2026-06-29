async function sendTyping(ctx) {
    if (!ctx?.chat?.id) return

    try {
        await ctx.telegram.sendChatAction(ctx.chat.id, "typing")
    } catch (error) {
        // ignore Telegram chat action errors
    }
}

function reply(ctx, text, extra = {}) {
    return ctx.reply(text, {
        parse_mode: "HTML",
        ...extra,
    })
}

async function safeDeleteMessage(ctx, messageId) {
    if (!ctx?.telegram?.deleteMessage || !ctx?.chat?.id || !messageId) return

    try {
        await ctx.telegram.deleteMessage(ctx.chat.id, messageId)
    } catch (error) {
        // ignore Telegram delete errors
    }
}

async function safeEditMessageText(ctx, text, extra = {}) {
    if (!ctx?.editMessageText || !ctx?.chat?.id) return

    try {
        await ctx.editMessageText(text, {
            parse_mode: "HTML",
            ...extra,
        })
    } catch (error) {
        // ignore Telegram edit errors
    }
}

module.exports = {
    reply,
    sendTyping,
    safeDeleteMessage,
    safeEditMessageText,
}
