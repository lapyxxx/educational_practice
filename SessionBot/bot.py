import logging
import sqlite3
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes, ConversationHandler, JobQueue
from utils import filter_schedule, format_schedule, get_weekday
from datetime import datetime, time, timedelta

# --- Константы ---
GROUP, MAIN_MENU, FILTER, SHOW_SCHEDULE = range(4)
DB_PATH = 'session_schedule.db'
GROUPS = ['241-325', '241-324']
MOSPOLY_LINK = 'https://e.mospolytech.ru/#/schedule/session'

# --- Логирование ---
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

# --- Вспомогательные функции ---
def get_schedule_from_db(group):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute('SELECT * FROM schedule WHERE group_name=? ORDER BY date, time', (group,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def unique_values(schedule, key):
    return sorted(list(set(e[key] for e in schedule)))

# --- Хэндлеры ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if 'user_ids' not in context.application.bot_data:
        context.application.bot_data['user_ids'] = []
    if user_id not in context.application.bot_data['user_ids']:
        context.application.bot_data['user_ids'].append(user_id)
    keyboard = [[InlineKeyboardButton(g, callback_data=f'group_{g}')] for g in GROUPS]
    await update.message.reply_text(
        'Привет! Я помогу тебе узнать расписание сессии.\nВыбери свою учебную группу:',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return GROUP

async def group_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if 'user_ids' not in context.application.bot_data:
        context.application.bot_data['user_ids'] = []
    if user_id not in context.application.bot_data['user_ids']:
        context.application.bot_data['user_ids'].append(user_id)
    query = update.callback_query
    await query.answer()
    group = query.data.split('_')[1]
    context.user_data['group'] = group
    await show_main_menu(query, context)
    return MAIN_MENU

async def show_main_menu(query, context):
    keyboard = [
        [InlineKeyboardButton('📅 Показать расписание', callback_data='show_schedule')],
        [InlineKeyboardButton('🔎 Фильтр', callback_data='filter')],
        [InlineKeyboardButton('🌐 Личный кабинет Мосполитеха', url=MOSPOLY_LINK)],
        [InlineKeyboardButton('⬅️ Назад к выбору группы', callback_data='back_to_group')]
    ]
    await query.edit_message_text(
        f'Группа: <b>{context.user_data["group"]}</b>\nЧто показать?',
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode='HTML'
    )

async def show_schedule(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    group = context.user_data['group']
    schedule = get_schedule_from_db(group)
    text = format_schedule(schedule)
    keyboard = [
        [InlineKeyboardButton('🔎 Фильтр', callback_data='filter')],
        [InlineKeyboardButton('⬅️ Назад', callback_data='main_menu')]
    ]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='HTML')
    return SHOW_SCHEDULE

async def filter_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    group = context.user_data['group']
    schedule = get_schedule_from_db(group)
    keyboard = [
        [InlineKeyboardButton('По дате', callback_data='filter_date')],
        [InlineKeyboardButton('По дню недели', callback_data='filter_weekday')],
        [InlineKeyboardButton('По типу', callback_data='filter_type')],
        [InlineKeyboardButton('⬅️ Назад', callback_data='main_menu')]
    ]
    await query.edit_message_text('Выберите параметр фильтрации:', reply_markup=InlineKeyboardMarkup(keyboard))
    context.user_data['schedule'] = schedule
    return FILTER

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
        weekdays = sorted(set(get_weekday(e['date']) for e in schedule))
        keyboard = [[InlineKeyboardButton(w, callback_data=f'weekday_{w}')] for w in weekdays]
        keyboard.append([InlineKeyboardButton('⬅️ Назад', callback_data='filter')])
        await query.edit_message_text('Выберите день недели:', reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == 'filter_type':
        types = unique_values(schedule, 'type')
        keyboard = [[InlineKeyboardButton(t, callback_data=f'type_{t}')] for t in types]
        keyboard.append([InlineKeyboardButton('⬅️ Назад', callback_data='filter')])
        await query.edit_message_text('Выберите тип события:', reply_markup=InlineKeyboardMarkup(keyboard))
    return FILTER

async def filter_apply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    schedule = context.user_data['schedule']
    group = context.user_data['group']
    if data.startswith('date_'):
        value = data[5:]
        filtered = filter_schedule(schedule, date=value)
    elif data.startswith('weekday_'):
        value = data[8:]
        filtered = filter_schedule(schedule, weekday=value)
    elif data.startswith('type_'):
        value = data[5:]
        filtered = filter_schedule(schedule, event_type=value)
    else:
        await query.answer()
        return FILTER
    text = format_schedule(filtered)
    keyboard = [
        [InlineKeyboardButton('🔎 Новый фильтр', callback_data='filter')],
        [InlineKeyboardButton('⬅️ Назад', callback_data='main_menu')]
    ]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='HTML')
    return SHOW_SCHEDULE

async def main_menu_back(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await show_main_menu(query, context)
    return MAIN_MENU

async def back_to_group(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton(g, callback_data=f'group_{g}')] for g in GROUPS]
    await update.callback_query.edit_message_text(
        'Привет! Я помогу тебе узнать расписание сессии.\nВыбери свою учебную группу:',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return GROUP

async def send_exam_notifications(context: ContextTypes.DEFAULT_TYPE):
    now = datetime.now()
    for group in GROUPS:
        schedule = get_schedule_from_db(group)
        for event in schedule:
            event_date = datetime.strptime(event['date'], '%Y-%m-%d')
            if event_date.date() == now.date() and event['type'].lower() == 'экзамен':
                user_ids = context.application.bot_data.get('user_ids', [])
                for user_id in user_ids:
                    keyboard = [
                        [InlineKeyboardButton('📅 Показать расписание', callback_data='show_schedule')],
                        [InlineKeyboardButton('🔎 Фильтр', callback_data='filter')]
                    ]
                    await context.bot.send_message(
                        chat_id=user_id,
                        text=f'Сегодня экзамен по предмету: <b>{event["subject"]}</b> в {event["time"]}!\nУдачи на экзамене! 🍀',
                        reply_markup=InlineKeyboardMarkup(keyboard),
                        parse_mode='HTML'
                    )

async def post_init(application):
    application.job_queue.run_daily(send_exam_notifications, time(hour=8, minute=0, second=0))

# --- Основной запуск ---
def main():
    app = ApplicationBuilder()\
        .token('7697710779:AAH0Un2eXMdHXG8PeEbl_x04sUZ2dT7-6C8')\
        .post_init(post_init)\
        .build()
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            GROUP: [CallbackQueryHandler(group_select, pattern=r'^group_')],
            MAIN_MENU: [
                CallbackQueryHandler(show_schedule, pattern='^show_schedule$'),
                CallbackQueryHandler(filter_menu, pattern='^filter$'),
                CallbackQueryHandler(main_menu_back, pattern='^main_menu$'),
                CallbackQueryHandler(back_to_group, pattern='^back_to_group$')
            ],
            SHOW_SCHEDULE: [
                CallbackQueryHandler(filter_menu, pattern='^filter$'),
                CallbackQueryHandler(main_menu_back, pattern='^main_menu$'),
                CallbackQueryHandler(back_to_group, pattern='^back_to_group$')
            ],
            FILTER: [
                CallbackQueryHandler(filter_choose, pattern=r'^filter_'),
                CallbackQueryHandler(filter_apply, pattern=r'^(date_|weekday_|type_)'),
                CallbackQueryHandler(filter_menu, pattern='^filter$'),
                CallbackQueryHandler(main_menu_back, pattern='^main_menu$'),
                CallbackQueryHandler(back_to_group, pattern='^back_to_group$')
            ]
        },
        fallbacks=[CommandHandler('start', start)]
    )
    app.add_handler(conv_handler)
    app.add_handler(CallbackQueryHandler(back_to_group, pattern='^back_to_group$'))
    app.bot_data['user_ids'] = []  # Здесь должен быть список user_id, которые нужно уведомлять
    app.run_polling()

if __name__ == '__main__':
    main() 