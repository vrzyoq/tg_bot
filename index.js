require("dotenv").config()

const { Telegraf, session } = require("telegraf")
const { checkSite } = require("./utils/siteMonitor")
const { reply } = require("./utils/telegram")
const { registerCommonHandlers } = require("./handlers/common")
const { registerMonitoringHandlers } = require("./handlers/monitoring")
const { registerMusicHandlers } = require("./handlers/music")
const { registerStartHandlers } = require("./handlers/start")
const { mainMenu, monitorMenu } = require("./utils/keyboards")

const BOT_TOKEN = process.env.BOT_TOKEN
const OWNER_ID = Number(process.env.OWNER_ID)
const SITE_URL = process.env.SITE_MONITOR_URL

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN is not configured.")
    process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const START_TIME = Date.now()

bot.use(session())

bot.use(async (ctx, next) => {
    if (!ctx.from) return next()

    if (!Number.isInteger(OWNER_ID)) {
        return next()
    }

    if (ctx.from.id !== OWNER_ID) {
        await reply(ctx, "<i><b>Нет доступа.</b></i>")
        return
    }

    return next()
})

bot.catch((err, ctx) => {
    console.error("Bot handler error:", err)
    if (ctx?.reply) {
        ctx.reply("⚠️ Произошла ошибка. Попробуйте позже.").catch(() => {})
    }
})

registerMonitoringHandlers(bot, { SITE_URL, checkSite, mainMenu, monitorMenu })
registerCommonHandlers(bot, { START_TIME })
registerMusicHandlers(bot, { START_TIME })
registerStartHandlers(bot, { START_TIME })

async function start(attempt = 1) {
    try {
        console.log("Бот запущен.")
        await bot.launch()
        console.log("Bot started.")
    } catch (err) {
        console.error(`Launch failed (attempt ${attempt}):`, err)
        if (attempt < 5) {
            setTimeout(() => start(attempt + 1), 5000)
        } else {
            console.error("Bot could not start after several attempts.")
        }
    }
}

start()

function shutdown(signal) {
    console.log(`Stopping bot on ${signal}...`)
    Promise.resolve(bot.stop(signal)).catch(() => {})
}

process.once("SIGINT", () => shutdown("SIGINT"))
process.once("SIGTERM", () => shutdown("SIGTERM"))
process.on("uncaughtException", (err) => console.error("uncaughtException:", err))
process.on("unhandledRejection", (reason) => console.error("unhandledRejection:", reason))