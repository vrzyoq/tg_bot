require("dotenv").config()

const { Telegraf, Markup, session, Scenes } = require("telegraf")
const Database = require("better-sqlite3")

const bot = new Telegraf(process.env.BOT_TOKEN)
const OWNER_ID = Number(process.env.OWNER_ID)
const db = new Database("database.db")

// Сцены для добавления и вычитания
const minusScene = new Scenes.BaseScene("minus_scene")
const plusScene = new Scenes.BaseScene("plus_scene")

const stage = new Scenes.Stage([plusScene, minusScene])

bot.use(session())
bot.use(stage.middleware())

const START_TIME = Date.now()

db.prepare(`
CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL
)
`).run()

function reply(ctx, text, extra = {}) {

    return ctx.reply(text, {
        parse_mode: "HTML",
        ...extra
    })
}

function getBalance(userId) {

    const row = db.prepare(`
        SELECT SUM(amount) as balance
        FROM income
        WHERE user_id = ?
    `).get(userId)

    return row.balance || 0
}

function addIncome(userId, amount) {

    db.prepare(`
        INSERT INTO income (user_id, amount)
        VALUES (?, ?)
    `).run(userId, amount)
}

function minusIncome(userId, amount) {

    const balance = getBalance(userId)

    if (balance < amount) {
        return false
    }

    addIncome(userId, -amount)

    return true
}

plusScene.on("text", (ctx) => {
    const amount = Number(ctx.message.text)

    if (isNaN(amount)) {
        return reply(ctx, "<i><b>Пожалуйста, введите корректное число.</b></i>")
    }

    addIncome(ctx.from.id, amount)
    reply(ctx, `<i><b>Добавлено <code>${amount}€</code></b></i>`)

    return ctx.scene.leave()
})

minusScene.on("text", (ctx) => {
    const amount = Number(ctx.message.text)

    if (isNaN(amount)) {
        return reply(ctx, "<i><b>Пожалуйста, введите корректное число.</b></i>")
    }

    const success = minusIncome(ctx.from.id, amount)

    if (!success) {
        return reply(ctx, "<i><b>Недостаточно средств.</b></i>")
    }

    reply(ctx, `<i><b>Списано <code>${amount}€</code></b></i>`)

    return ctx.scene.leave()
})

const mainMenu = Markup.keyboard([
    ["/финансы", "/общее"]
]).resize()

const financeMenu = Markup.keyboard([
    ["/плюс", "/минус"],
    ["/баланс"],
    ["/назад"]
]).resize()

bot.use(async (ctx, next) => {

    if (!ctx.from) return

    if (ctx.from.id !== OWNER_ID) {
        return reply(ctx, "<i><b>У вас нет доступа к этому боту.</b></i>")
    }

    next()
})

bot.start((ctx) => {
    reply(ctx, "<i><b>Hi</b></i>", mainMenu)
})

bot.help((ctx) => {
    reply(ctx, "Available commands:\n/start - Start the bot\n/help - Show this help message")
})

bot.hears("/финансы", (ctx) => {
    reply(ctx, "<i><b>Выберите действие:</b></i>", financeMenu)
})

bot.hears("/общее", (ctx) => {
    const balance = getBalance(ctx.from.id)

    const diff =
        Math.floor(
            (Date.now() - START_TIME) / 1000
        )

    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = diff % 60

    reply(ctx, `<i><b>profile</b></i>\n\n<i><b>баланс: <code>${balance}€</code></b></i>\n<i><b>айди: <code>${ctx.from.id}</code></b></i>\n<i><b>аптайм бота: <code>${h}ч ${m}м ${s}с</code></b></i>`)
})

bot.hears("/назад", (ctx) => {
    reply(ctx, "<i><b>Вы вернулись в главное меню.</b></i>", mainMenu)
})

bot.hears("/плюс", (ctx) => {

    ctx.scene.enter("plus_scene")

    reply(ctx, "<i><b>Введите сумму:</b></i>")
})

bot.hears("/минус", (ctx) => {

    ctx.scene.enter("minus_scene")

    reply(ctx, "<i><b>Введите сумму:</b></i>")
})

bot.hears("/баланс", (ctx) => {

    const balance = getBalance(ctx.from.id)

    reply(ctx, `<i><b>Ваш баланс: <code>${balance}€</code></b></i>`)
})

bot.on("text", (ctx) => {

    const action = ctx.session.action

    if (!ctx.session.action) {
        return reply(ctx, "<i><b>Пожалуйста, выберите действие из меню.</b></i>")
    }

    if (action === "add_income") {

        const amount = Number(ctx.message.text)

        addIncome(ctx.from.id, amount)

        reply(ctx, `<i><b>Добавлено <code>${amount}€</code></b></i>`)

        ctx.session.action = null
    }

    else if (action === "minus_income") {

        const amount = Number(ctx.message.text)

        const success =
            minusIncome(ctx.from.id, amount)

        if (!success) {
            return reply(ctx, "<i><b>Недостаточно средств.</b></i>")
        }

        reply(ctx, `<i><b>Списано <code>${amount}€</code></b></i>`)

        ctx.session.action = null
    }

})


bot.launch()
.then(() => console.log('Bot is running...'))
.catch(err => console.error('Failed to launch bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));