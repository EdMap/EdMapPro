from rest_framework.pagination import LimitOffsetPagination


class StandardResultsSetPagination(LimitOffsetPagination):
    page_size = 25
    page_size_query_param = "limit"
    max_page_size = 50
