from django.db.models import Q


def apply_appointment_list_filters(queryset, request):
    """
    Filtros de query string para listados de citas:
    - date: YYYY-MM-DD (dia exacto)
    - date_from, date_to: rango inclusive
    - status: valores separados por coma (ej: pending,accepted)
    - search: texto libre (nombre tutor/mascota/notas segun queryset base)
    - ordering: date, -date, status, -status, client_name, -client_name,
                veterinarian_name, -veterinarian_name
    """
    params = request.query_params

    day = params.get('date')
    if day:
        queryset = queryset.filter(date=day)
    else:
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

    status_param = params.get('status')
    if status_param:
        statuses = [s.strip() for s in status_param.split(',') if s.strip()]
        if statuses:
            queryset = queryset.filter(status__in=statuses)

    search = params.get('search')
    if search:
        q = search.strip()
        if q:
            queryset = queryset.filter(
                Q(client__name__icontains=q)
                | Q(veterinarian__name__icontains=q)
                | Q(pet_name__icontains=q)
                | Q(client_case_notes__icontains=q)
            )

    ordering = params.get('ordering', '-date')
    order_map = {
        'date': ['date', 'time'],
        '-date': ['-date', '-time'],
        'status': ['status', 'date', 'time'],
        '-status': ['-status', 'date', 'time'],
        'client_name': ['client__name', 'date', 'time'],
        '-client_name': ['-client__name', 'date', 'time'],
        'veterinarian_name': ['veterinarian__name', 'date', 'time'],
        '-veterinarian_name': ['-veterinarian__name', 'date', 'time'],
    }
    if ordering in order_map:
        queryset = queryset.order_by(*order_map[ordering])
    else:
        queryset = queryset.order_by('-date', '-time')

    return queryset
