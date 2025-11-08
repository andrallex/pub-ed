## Тренировочное задание 7. Библиотека Selenium.
### Установка
```bash
pip install https://github.com/andrallex/pub-ed/releases/download/v2025.11.2/zoon_tomsk_parser-2025.11.2-py3-none-any.whl

```
### Пример использования 1 (по шагам, с контролем)
```python

from training_task_7_selenium_lib_pack import (
    collect_cards_to_html_uc,
    get_cards_from_html
)

# Если нужно сначала собрать HTML, а затем разобрать его на карточки и записать в .csv-файл
# 1. Собираем HTML всех страниц сайта
# (с дополнительной последовательной записью всех страниц в файл 'restaurants_uc.html')
    html_pages = collect_cards_to_html_uc()

# 2. Читаем HTML-файл 'restaurants_uc.html'
    with open('restaurants.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

# 3. Получаем список карточек заведений
    card_list = get_cards_from_html(html_content)
    print(f'card_list_len: {len(card_list)} \ncard_list: {card_list}')

# 4. Записываем полученный список карточек в .CSV-файл
    df = pd.DataFrame(card_list)
    df.to_csv('restaurants_cards_5.csv', index=False, encoding='utf-8')
    print(df)
```

### Пример использования 2 (в один подход, медленно, без контроля)
```python
from training_task_7_selenium_lib_pack import parse_all_restaurants_to_csv
# Собираем HTML, а затем разобрать его на карточки и записать в .csv-файл в один подход
parse_all_restaurants_to_csv()
```