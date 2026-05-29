require("dotenv").config()

const { Telegraf, Markup, session, Scenes } = require("telegraf")
const sqlite3 = require("sqlite3").verbose()

const bot = new Telegraf(process.env.BOT_TOKEN)
const OWNER_ID = Number(process.env.OWNER_ID)

const db = new sqlite3.Database("./database.db")

// Создание таблицы
db.run(`
CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL
)
`)

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

// Получение баланса
function getBalance(userId) {
    return new Promise((resolve, reject) => {

        db.get(
            `
            SELECT SUM(amount) as balance
            FROM income
            WHERE user_id = ?
            `,
            [userId],
            (err, row) => {

                if (err) {
                    reject(err)
                } else {
                    resolve(row?.balance || 0)
                }
            }
        )
    })
}

// Добавление денег
function addIncome(userId, amount) {

    db.run(
        `
        INSERT INTO income (user_id, amount)
        VALUES (?, ?)
        `,
        [userId, amount]
    )
}

// Списание денег
async function minusIncome(userId, amount) {

    const balance = await getBalance(userId)

    if (balance < amount) {
        return false
    }

    addIncome(userId, -amount)

    return true
}

// Плюс
plusScene.on("text", async (ctx) => {

    const amount = Number(ctx.message.text)

    if (isNaN(amount)) {
        return reply(ctx, "<i><b>Введите корректное число.</b></i>")
    }

    addIncome(ctx.from.id, amount)

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

    const success =
        await minusIncome(ctx.from.id, amount)

    if (!success) {
        return reply(ctx, "<i><b>Недостаточно средств.</b></i>")
    }

    await reply(
        ctx,
        `<i><b>Списано <code>${amount}€</code></b></i>`
    )

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

bot.hears("/назад", (ctx) => {
    reply(
        ctx,
        "<i><b>Главное меню.</b></i>",
        mainMenu
    )
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
        await getBalance(ctx.from.id)

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

    const balance =
        await getBalance(ctx.from.id)

    const diff =
        Math.floor(
            (Date.now() - START_TIME) / 1000
        )

    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = diff % 60

    const daysToSalary = getDaysToSalary()

    reply(
        ctx,
        `<i><b>profile</b></i>\n\n` +
        `<i><b>баланс: <code>${balance}€</code></b></i>\n` +
        `<i><b>айди: <code>${ctx.from.id}</code></b></i>\n` +
        `<i><b>до зарплаты: <code>${daysToSalary} д.</code></b></i>\n` +
        `<i><b>аптайм: <code>${h}ч ${m}м ${s}с</code></b></i>`
    )
})

bot.launch()
    .then(() => {
        console.log("Bot is running...")
    })
    .catch((err) => {
        console.error(err)
    })

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))