from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def main_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="/Финансы"),
                KeyboardButton(text="/Задачи")
            ],
            [
                KeyboardButton(text="/Общее")
            ]
        ],
        resize_keyboard=True
    )


def salary_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="/плюс"),
                KeyboardButton(text="/минус"),
                KeyboardButton(text="/бал")
            ],
            [
                KeyboardButton(text="/назад")
            ]
        ],
        resize_keyboard=True
    )


def tasks_menu():
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="/добавить задачу"),
                KeyboardButton(text="/задачи")
            ],
            [
                KeyboardButton(text="/назад")
            ]
        ],
        resize_keyboard=True
    )