from kb.scripts.chunking import tokenize_sentences, chunk_sentences, rough_token_count


def test_tokenize_sentences_splits_on_boundaries():
    text = "This is one. This is two! Is this three? Yes it is."
    assert tokenize_sentences(text) == [
        "This is one.",
        "This is two!",
        "Is this three?",
        "Yes it is.",
    ]


def test_tokenize_sentences_collapses_whitespace():
    text = "Hello   world.\n\n\nFoo bar."
    assert tokenize_sentences(text) == ["Hello world.", "Foo bar."]


def test_tokenize_sentences_empty_input():
    assert tokenize_sentences("") == []
    assert tokenize_sentences("   \n\n  ") == []


def test_rough_token_count_uses_whitespace():
    assert rough_token_count("one two three") == 3
    assert rough_token_count("") == 0


def test_chunk_sentences_respects_token_ceiling():
    sentences = ["word " * 100, "word " * 100, "word " * 100, "word " * 100]
    chunks = chunk_sentences(sentences, target_tokens=150, overlap=1)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert rough_token_count(chunk) <= 300  # at most one sentence over


def test_chunk_sentences_overlaps():
    sentences = [f"Sentence number {i}." for i in range(10)]
    chunks = chunk_sentences(sentences, target_tokens=10, overlap=2)
    # With overlap=2, consecutive chunks share some content
    assert len(chunks) > 1
    # The last sentence of one should appear in the next chunk somewhere
    assert any("Sentence number 1" in c for c in chunks[:2])


def test_chunk_sentences_filters_tiny_chunks():
    sentences = ["a.", "b."]  # both under min_chars
    chunks = chunk_sentences(sentences, target_tokens=100, overlap=1, min_chars=10)
    assert chunks == []


def test_chunk_sentences_empty_input():
    assert chunk_sentences([], target_tokens=100, overlap=2) == []
