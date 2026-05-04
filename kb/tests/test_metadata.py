import os
import tempfile
import yaml

from kb.scripts.extract import load_metadata, slugify, output_paths_for


def _write_meta(d):
    f = tempfile.NamedTemporaryFile(suffix=".yaml", delete=False, mode="w")
    yaml.safe_dump({"files": d}, f)
    f.close()
    return f.name


def test_load_metadata_returns_dict():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "text",
            "grade": ["K"],
            "domain": ["curriculum"],
            "program": "Test",
            "topics": ["t1"],
        }
    })
    try:
        m = load_metadata(path)
        assert "Foo.pdf" in m
        assert m["Foo.pdf"]["extraction"] == "text"
    finally:
        os.unlink(path)


def test_load_metadata_rejects_bad_extraction():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "bogus",
            "grade": ["K"],
            "domain": ["curriculum"],
            "program": None,
            "topics": [],
        }
    })
    try:
        import pytest
        with pytest.raises(ValueError, match="extraction"):
            load_metadata(path)
    finally:
        os.unlink(path)


def test_load_metadata_rejects_bad_domain():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "text",
            "grade": ["K"],
            "domain": ["oops"],
            "program": None,
            "topics": [],
        }
    })
    try:
        import pytest
        with pytest.raises(ValueError, match="domain"):
            load_metadata(path)
    finally:
        os.unlink(path)


def test_slugify_handles_spaces_and_punctuation():
    assert slugify("Letterbook 1 Cc.pdf") == "letterbook-1-cc"
    assert slugify("WB 33 - A Trip in the Van.pdf") == "wb-33-a-trip-in-the-van"
    assert slugify("Wordcloud Israel.jpg") == "wordcloud-israel"


def test_output_paths_for_curriculum_only():
    entry = {"domain": ["curriculum"]}
    paths = output_paths_for("Foo.pdf", entry, base="/tmp/extracted")
    assert paths == {"curriculum": "/tmp/extracted/curriculum/foo.md"}


def test_output_paths_for_both():
    entry = {"domain": ["both"]}
    paths = output_paths_for("Foo.pdf", entry, base="/tmp/extracted")
    assert paths == {
        "curriculum": "/tmp/extracted/curriculum/foo.md",
        "activity": "/tmp/extracted/activities/foo.md",
    }
