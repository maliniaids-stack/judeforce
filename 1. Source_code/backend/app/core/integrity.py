import hashlib


def hash_artefact(content: str) -> str:
    """
    Computes and returns the SHA-256 hexadecimal hash of the given artefact content string.
    """
    if content is None:
        content = ""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
