from aiogram.fsm.state import StatesGroup, State

class SalaryState(StatesGroup):
    add_amount = State()
    add_reason = State()

    minus_amount = State()
    minus_reason = State()

class TaskState(StatesGroup):
    text = State()