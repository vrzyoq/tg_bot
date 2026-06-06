require("dotenv").config()

const { Telegraf, Markup, session, Scenes } = require("telegraf")
const sqlite3 = require("sqlite3").verbose()
const sequelize = require("./database")
const { User, addBalance, removeBalance } = require("./models/User")
const { checkSite } = require("./services/siteMonitor")

const bot = new Telegraf(process.env.BOT_TOKEN)
const OWNER_ID = Number(process.env.OWNER_ID)

const SITE_URL = "https://www.libert117.com"

// Сцены
const minusScene = new Scenes.BaseScene("minus_scene")
const plusScene = new Scenes.BaseScene("plus_scene")

const stage = new Scenes.Stage([plusScene, minusScene])

bot.use(session())
bot.use(stage.middleware())

const START_TIME = Date.now()

function reply(ctx, text, extra = {}) {
    return ctx.reply(text, {
        parse_mode: "HTML",
        ...extra
    })
}

// Плюс
plusScene.on("text", async (ctx) => {

    const amount = Number(ctx.message.text)

    if (isNaN(amount)) {
        return reply(ctx, "<i><b>Введите корректное число.</b></i>")
    }

    await addBalance(ctx.from.id, amount)

    await reply(
        ctx,
        `<i><b>Добавлено <code>${amount}€</code></b></i>`
    )

    return ctx.scene.leave()
})

// Минус
minusScene.on("text", async (ctx) => {

    const amount = Number(ctx.message.text)

    if (isNaN(amount)) {
        return reply(ctx, "<i><b>Введите корректное число.</b></i>")
    }

    await removeBalance(ctx.from.id, amount)

    await reply(
        ctx,
        `<i><b>Списано <code>${amount}€</code></b></i>`
    )

    return ctx.scene.leave()
})

const mainMenu = Markup.keyboard([
    ["/финансы", "/общее"],
    ["/мониторинг"]
]).resize()

const financeMenu = Markup.keyboard([
    ["/плюс", "/минус"],
    ["/баланс"],
    ["/назад"]
]).resize()

const monitorMenu = Markup.keyboard([
    ["/сайт", "/сервер"],
    ["/назад"]
]).resize()

// Защита
bot.use(async (ctx, next) => {

    if (!ctx.from) return

    if (ctx.from.id !== OWNER_ID) {
        return reply(
            ctx,
            "<i><b>Нет доступа.</b></i>"
        )
    }

    return next()
})

bot.start((ctx) => {
    reply(ctx, "<i><b>Hi</b></i>", mainMenu)
})

bot.hears("/финансы", (ctx) => {
    reply(ctx, "<i><b>Выберите действие:</b></i>", financeMenu)
})

bot.hears("/мониторинг", (ctx) => {
    reply(ctx, "<i><b>Выберите действие:</b></i>", monitorMenu)
})

bot.hears("/назад", (ctx) => {
    reply(
        ctx,
        "<i><b>Главное меню.</b></i>",
        mainMenu
    )
})

bot.hears("/сайт", async (ctx) => {

    const result =
        await checkSite(
            SITE_URL
        )

    if (!result.online) {

        return reply(ctx, `<i><b>Сайт недоступен.</b></i>\n<b><i><code>${SITE_URL}</code></i></b>\n\n<code>${result.error}</code>`)
    }

    let status = "ok."

    if (result.ping > 1000) {
        status = "ping > 1000ms!"
    }

    reply(ctx, `<i><b>Сайт работает.</b></i>\n\n<i><b><code>${SITE_URL}</code></b></i>\n\n<i><b>ping: <code>${result.ping}ms</code></b></i>\n<i><b>http: <code>${result.status}</code></b></i>`)
})

bot.hears("/плюс", (ctx) => {

    ctx.scene.enter("plus_scene")

    reply(ctx, "<i><b>Введите сумму:</b></i>")
})

bot.hears("/минус", (ctx) => {

    ctx.scene.enter("minus_scene")

    reply(ctx, "<i><b>Введите сумму:</b></i>")
})

bot.hears("/баланс", async (ctx) => {

    const balance =
        await User.findOne({
            where: { userId: ctx.from.id },
            attributes: ['balance']
        })

    reply(
        ctx,
        `<i><b>Баланс: <code>${balance}€</code></b></i>`
    )
})

function getDaysToSalary() {

    const now = new Date()

    let salaryDate =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            15
        )

    // Если 15-е прошло — следующий месяц
    if (now > salaryDate) {

        salaryDate =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                15
            )
    }

    let workDays = 0

    const current =
        new Date(now)

    current.setHours(0, 0, 0, 0)
    salaryDate.setHours(0, 0, 0, 0)

    while (current < salaryDate) {

        current.setDate(current.getDate() + 1)

        const day = current.getDay()

        // 0 = воскресенье
        // 6 = суббота
        if (day !== 0 && day !== 6) {
            workDays++
        }
    }

    return workDays
}

bot.hears("/общее", async (ctx) => {

    const [user] = await User.findOrCreate({
        where: {
            userId: ctx.from.id
        },
        defaults: {
            balance: 0
        }
    })

    const balance = user.balance

    const diff =
        Math.floor(
            (Date.now() - START_TIME) / 1000
        )

    const d = Math.floor(diff / 86400)
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)

    const daysToSalary = getDaysToSalary()

    reply(
        ctx,
        `<i><b>profile</b></i>\n\n` +
        `<i><b>баланс: <code>${balance}€</code></b></i>\n` +
        `<i><b>айди: <code>${ctx.from.id}</code></b></i>\n` +
        `<i><b>до зарплаты: <code>${daysToSalary} д.</code></b></i>\n` +
        `<i><b>аптайм: <code>${d}д. ${h}ч. ${m}м.</code></b></i>`
    )
});

async function start() {

    try {

        await sequelize.authenticate()

        await sequelize.sync({ alter: true })

        console.log("Database connected.")

        await bot.launch()

        console.log("Bot started.")

    } catch (err) {

        console.error(err)
    }
}

start()

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))