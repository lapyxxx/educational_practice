import datetime
import sqlite3
from typing import List, Dict
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

WEEKDAYS = [
    'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
]

def get_weekday(date_str: str) -> str:
    """Возвращает день недели по дате в формате YYYY-MM-DD."""
    date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
    return WEEKDAYS[date.weekday()]

def filter_schedule(schedule: List[Dict], date=None, weekday=None, event_type=None, subject=None) -> List[Dict]:
    """Фильтрует расписание по дате, дню недели, типу события или названию дисциплины."""
    result = schedule
    if date:
        result = [s for s in result if s['date'] == date]
    if weekday:
        result = [s for s in result if get_weekday(s['date']) == weekday]
    if event_type:
        result = [s for s in result if s['type'].lower() == event_type.lower()]
    if subject:
        result = [s for s in result if subject.lower() in s['subject'].lower()]
    return result

def format_event(event: Dict) -> str:
    """Форматирует одно событие для вывода пользователю (только дата, предмет, тип, время)."""
    # Эмодзи по типу события
    type_emoji = {
        'Зачет': '🟢',
        'Экзамен': '🔴',
        'Дифф. зачет': '🟡',
        'Консультация': '🔵',
        'ВКР': '🟣',
    }
    emoji = type_emoji.get(event['type'], '⚪')
    # Сокращаем длинные названия дисциплин для компактности
    subj = event['subject']
    if len(subj) > 32:
        subj = subj[:29] + '...'
    return f"{emoji} <b>{event['date']}</b> | <b>{event['time']}</b> | <b>{subj}</b> | {event['type']}"

def format_schedule(schedule: List[Dict]) -> str:
    """Форматирует список событий для вывода пользователю в виде таблицы."""
    if not schedule:
        return 'Нет событий по выбранным параметрам.'
    header = '<b>Дата | Время | Дисциплина | Тип</b>'
    rows = [format_event(e) for e in schedule]
    return header + '\n' + '\n'.join(rows)

async def filter_choose(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    schedule = context.user_data['schedule']
    if data == 'filter_date':
        dates = unique_values(schedule, 'date')
        keyboard = [[InlineKeyboardButton(d, callback_data=f'date_{d}')] for d in dates]
        keyboard.append([InlineKeyboardButton('⬅️ Назад', callback_data='filter')])
        await query.edit_message_text('Выберите дату:', reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == 'filter_weekday':
        # Показываем все дни недели, даже если нет событий
        keyboard = [[InlineKeyboardButton(w, callback_data=f'weekday_{w}')] for w in WEEKDAYS]
        keyboard.append([InlineKeyboardButton('⬅️ Назад', callback_data='filter')])
        await query.edit_message_text('Выберите день недели:', reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == 'filter_type':
        types = unique_values(schedule, 'type')
        keyboard = [[InlineKeyboardButton(t, callback_data=f'type_{t}')] for t in types]
        keyboard.append([InlineKeyboardButton('⬅️ Назад', callback_data='filter')])
        await query.edit_message_text('Выберите тип события:', reply_markup=InlineKeyboardMarkup(keyboard))
    return FILTER 