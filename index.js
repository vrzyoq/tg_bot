require("dotenv").config()

const { Telegraf, Markup, session } = require("telegraf")

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())

bot.start((ctx) => {
    ctx.reply("Welcome to the bot! Use /help to see available commands.")
})

bot.help((ctx) => {
    ctx.reply("Available commands:\n/start - Start the bot\n/help - Show this help message")
})

bot.launch()