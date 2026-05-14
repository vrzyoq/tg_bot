from aiogram.fsm.state import StatesGroup, State

class SalaryState(StatesGroup):
    add_amount = State()
    minus_amount = State()

class TaskState(StatesGroup):
    text = State()