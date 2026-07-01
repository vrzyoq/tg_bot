const openai = require("openai")

const apiKey = process.env.CHATGPT_API_KEY

const client = new openai.OpenAI({
    apiKey: apiKey
});

async function askGPT(bot, ctx, prompt) {

    try {

        if (!apiKey) {
            console.error("CHATGPT_API_KEY is not configured.")
        }

        const res = await client.responses.create({
            model: "gpt-3.5-turbo",
            instructions: "Всегда отвечай только обычным текстом. Не используй изображения, файлы, markdown-таблицы и другие форматы.",
            input: prompt
        });

        if (!res?.output_text) {
            return {
                success: false,
                message: "❌ OpenAI не вернул ответ."
            };
        }

        return {
            success: true,
            message: res.output_text
        };

    } catch (error) {
        console.error("[OPENAI (CHATGPT)]", error);

        switch (error.status) {

            case 400:
                return {
                    success: false,
                    message: "❌ Некорректный запрос."
                };

            case 401:
                return {
                    success: false,
                    message: "❌ Неверный OpenAI API ключ."
                };

            case 403:
                return {
                    success: false,
                    message: "🚫 Нет доступа к выбранной модели."
                };

            case 404:
                return {
                    success: false,
                    message: "❌ Модель не найдена."
                };

            case 413:
                return {
                    success: false,
                    message: "📄 Сообщение слишком длинное."
                };

            case 429:
                return {
                    success: false,
                    message: "⚠️ Лимит OpenAI исчерпан или слишком много запросов."
                };

            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    success: false,
                    message: "⚙️ OpenAI временно недоступен."
                };
        }

        if (
            error.code === "ETIMEDOUT" ||
            error.code === "ECONNRESET" ||
            error.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND"
        ) {
            return {
                success: false,
                message: "🌐 Не удалось подключиться к OpenAI."
            };
        }

        return {
            success: false,
            message: "❌ Произошла неизвестная ошибка."
        };
    }
}

module.exports = {
    askGPT
}