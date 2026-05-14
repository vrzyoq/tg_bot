import aiosqlite

DB_NAME = "data.db"


async def init_db():
    async with aiosqlite.connect(DB_NAME) as db:

        await db.execute("""
        CREATE TABLE IF NOT EXISTS income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount REAL
        )
        """)

        await db.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            text TEXT,
            done INTEGER DEFAULT 0
        )
        """)

        await db.commit()


async def add_income(user_id, amount):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            "INSERT INTO income (user_id, amount) VALUES (?, ?)",
            (user_id, amount)
        )
        await db.commit()

async def minus_income(user_id, amount):
    async with aiosqlite.connect(DB_NAME) as db:

        # Получаем текущий баланс
        cursor = await db.execute(
            "SELECT SUM(amount) FROM income WHERE user_id=?",
            (user_id,)
        )

        result = await cursor.fetchone()

        balance = result[0] or 0

        # Проверка на отрицательный баланс
        if balance < amount:
            return False

        # Добавляем отрицательную сумму
        await db.execute(
            "INSERT INTO income (user_id, amount) VALUES (?, ?)",
            (user_id, -amount)
        )

        await db.commit()

        return True


async def get_balance(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            "SELECT SUM(amount) FROM income WHERE user_id=?",
            (user_id,)
        )

        result = await cursor.fetchone()

        return result[0] or 0


async def create_task(user_id, text):
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute(
            "INSERT INTO tasks (user_id, text) VALUES (?, ?)",
            (user_id, text)
        )

        await db.commit()

async def get_tasks(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            "SELECT * FROM tasks WHERE user_id=?",
            (user_id,)
        )

        return await cursor.fetchall()

async def get_completed_tasks(user_id):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.execute(
            "SELECT COUNT(*) FROM tasks WHERE user_id=? AND done=1",
            (user_id,)
        )

        result = await cursor.fetchone()

        return result[0]