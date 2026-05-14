
import asyncio
from aiogram import Bot, Dispatcher, F, BaseMiddleware
from aiogram.types import Message, CallbackQuery, TelegramObject
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from keyboards import main_menu, salary_menu, tasks_menu
from states import SalaryState, TaskState
from database import *

import time

START_TIME = time.time()

TOKEN = "7084873915:AAEysVk7UqFtsHkH9o1aP1YRHGfpxjDfIcw"
owner_id = 6563619324
spotify_client_id = "e9cdced40fc8432ea92dbe5f3d65492a"
spotify_client_secret = "e04f6b59641b4dbea504d61fb778bbde"

bot = Bot(
    token=TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

class OwnerMiddleware(BaseMiddleware):
    async def __call__(self, handler, event: TelegramObject, data):

        user = data.get("event_from_user")

        if user and user.id != owner_id:

            if hasattr(event, "answer"):
                await event.answer(
                    "<i><b>У вас нет доступа к этому боту.</b></i>"
                )

            return

        return await handler(event, data)

dp = Dispatcher()
dp.message.middleware(OwnerMiddleware())
dp.callback_query.middleware(OwnerMiddleware())

@dp.message(CommandStart())
async def start(message: Message):
    await message.answer(
        "<i><b>Hi</b></i>",
        reply_markup=main_menu()
    )

# ====== ГЛАВНОЕ МЕНЮ ======

@dp.message(F.text == "/Финансы")
async def salary(message: Message):
    await message.answer(
        "<i><b>Раздел финансов:</b></i>",
        reply_markup=salary_menu()
    )

@dp.message(F.text == "/Задачи")
async def tasks(message: Message):
    await message.answer(
        "<i><b>Раздел задач:</b></i>",
        reply_markup=tasks_menu()
    )

@dp.message(F.text == "/Общее")
async def stats(message: Message):
    balance = await get_balance(message.from_user.id)
    tasks_done = await get_completed_tasks(message.from_user.id)

    now = time.time()

    diff = int(time.time() - START_TIME)

    d = diff // 86400
    h = (diff % 86400) // 3600
    m = (diff % 3600) // 60
    s = diff % 60

    text = (
        f"<i><b>Стата хуй</b></i>\n\n"
        f"<i><b>Айди: <code>{message.from_user.id}</code></b></i>\n"
        f"<i><b>Баланс: <code>{balance}€</code></b></i>\n"
        f"<i><b>Выполнено задач: {tasks_done}</b></i>\n\n"
        f"<i><b>Аптайм: {d}д {h}ч {m}м {s}с</b></i>"
    )

    await message.answer(text)

# ====== ЗАРПЛАТА ======

@dp.message(F.text == "/плюс")
async def add_salary(message: Message, state: FSMContext):
    await message.answer("<i><b>Введите сумму:</b></i>")
    await state.set_state(SalaryState.add_amount)

@dp.message(SalaryState.add_amount)
async def save_salary(message: Message, state: FSMContext):
    amount = float(message.text)

    await add_income(
        user_id=message.from_user.id,
        amount=amount
    )

    await message.answer(f"<i><b>Добавлено: {amount}€</b></i>")
    await state.clear()

@dp.message(F.text == "/минус")
async def minus_salary(message: Message, state: FSMContext):
    await message.answer("<i><b>Введите сумму:</b></i>")
    await state.set_state(SalaryState.minus_amount)

@dp.message(SalaryState.minus_amount)
async def minus_salary(message: Message, state: FSMContext):
    amount = float(message.text)

    success = await minus_income(
        user_id=message.from_user.id,
        amount=amount
    )

    if success:
        await message.answer(f"<i><b>Списано {amount}€</b></i>")
    else:
        await message.answer("<i><b>Недостаточно средств</b></i>")
    await state.clear()

@dp.message(F.text == "/бал")
async def balance(message: Message):
    bal = await get_balance(message.from_user.id)

    await message.answer(
        f"<i><b>На Балансе:</b>\n<b><code>{bal}€</code></b></i>"
    )

# ====== ЗАДАЧИ ======

@dp.message(F.text == "/добавить задачу")
async def add_task(message: Message, state: FSMContext):
    await message.answer("<i><b>Введи задачу:</b></i>")
    await state.set_state(TaskState.text)


@dp.message(TaskState.text)
async def save_task(message: Message, state: FSMContext):
    await create_task(
        user_id=message.from_user.id,
        text=message.text
    )

    await message.answer("<i><b>Задача добавлена.</b></i>")
    await state.clear()

@dp.message(F.text == "/задачи")
async def my_tasks(message: Message):
    tasks = await get_tasks(message.from_user.id)

    if not tasks:
        await message.answer("<i><b>Задач нет.</b></i>")
        return

    text = "📋 <b>Ваши задачи:</b>\n\n"

    for task in tasks:
        status = "✅" if task[3] else "❌"
        text += f"{status} ID:{task[0]} — {task[2]}\n"

    await message.answer(text)

@dp.message(F.text == "/назад")
async def back_to_menu(message: Message):
    await message.answer(
        "<i><b>Главное меню</b></i>",
        reply_markup=main_menu()
    )

async def main():
    await init_db()
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())