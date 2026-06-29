const axios = require("axios")

async function checkSite(url) {
    const start = Date.now()

    try {
        const response = await axios.get(url, {
            timeout: 10000,
        })

        return {
            online: true,
            status: response.status,
            ping: Date.now() - start,
        }
    } catch (error) {
        return {
            online: false,
            error: error.message,
        }
    }
}

module.exports = {
    checkSite,
}
