def chunk_text(text, chunk_size=50):
    for i in range(0, len(text), chunk_size):
        yield text[i : i + chunk_size]
